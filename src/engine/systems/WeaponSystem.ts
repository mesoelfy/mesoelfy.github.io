import { IGameSystem, IEntitySpawner, IGameStateSystem, IEntityRegistry, IGameEventService, IPhysicsSystem, IParticleSystem } from '@/engine/interfaces';
import { Tag, Faction } from '@/engine/ecs/types';
import { TransformData } from '@/engine/ecs/components/TransformData';
import { MotionData } from '@/engine/ecs/components/MotionData';
import { AIStateData } from '@/engine/ecs/components/AIStateData';
import { RenderModel } from '@/engine/ecs/components/RenderModel';
import { RenderTransform } from '@/engine/ecs/components/RenderTransform';
import { IdentityData } from '@/engine/ecs/components/IdentityData';
import { TargetData } from '@/engine/ecs/components/TargetData';
import { GameEvents } from '@/engine/signals/GameEvents';
import { ConfigService } from '@/engine/services/ConfigService';
import { ComponentType } from '@/engine/ecs/ComponentType';
import { calculateSpitterShot, calculateSnifferShots } from '@/engine/handlers/weapons/WeaponLogic';
import { AI_STATE } from '@/engine/ai/AIStateTypes';
import { WeaponIDs } from '@/engine/config/Identifiers';
import { SYS_LIMITS } from '@/engine/config/constants/SystemConstants';
import { useGameStore } from '@/engine/state/game/useGameStore';
import { Query } from '@/engine/ecs/Query';
import * as THREE from 'three';

interface PurgeState {
    active: boolean;
    shotsRemaining: number;
    currentAngle: number;
    accumulator: number;
}

export class WeaponSystem implements IGameSystem {
  private lastSpitterTime = 0; 
  private lastSnifferTime = 0;
  private unsubs: (() => void)[] = [];
  private tempColor = new THREE.Color();
  private queryBuffer = new Int32Array(SYS_LIMITS.MAX_COLLISION_RESULTS);
  
  private purgeState: PurgeState = { active: false, shotsRemaining: 0, currentAngle: 0, accumulator: 0 };
  private projectileQuery = new Query({ all: [ComponentType.Projectile, ComponentType.Transform, ComponentType.Motion] });

  constructor(
    private spawner: IEntitySpawner,
    private registry: IEntityRegistry,
    private gameSystem: IGameStateSystem,
    private events: IGameEventService,
    private config: typeof ConfigService,
    private physics: IPhysicsSystem,
    private particleSystem: IParticleSystem
  ) {
    this.unsubs.push(this.events.subscribe(GameEvents.UPGRADE_SELECTED, (p) => {
        if (p.option === 'PURGE') this.triggerPurge();
        if (p.option === 'NOVA') this.triggerNova(); 
    }));
  }

  update(delta: number, time: number): void {
    this.updateProjectiles(delta, time);

    if (this.purgeState.active) {
        const player = this.getPlayerEntity();
        if (player) {
            const t = player.getComponent<TransformData>(ComponentType.Transform);
            if (t) this.processPurgeFrame(delta, t.x, t.y);
        }
        return;
    }

    const isDead = this.gameSystem.isGameOver || this.gameSystem.playerHealth <= 0;
    if (isDead) return;
    
    this.handleAutoFire(delta, time);
  }

  private updateProjectiles(delta: number, time: number) {
      const projectiles = this.registry.query(this.projectileQuery);

      for (const p of projectiles) {
          if (!p.active) continue;

          const transform = p.getComponent<TransformData>(ComponentType.Transform)!;
          const motion = p.getComponent<MotionData>(ComponentType.Motion)!;
          const target = p.getComponent<TargetData>(ComponentType.Target);

          if (target && target.type === 'ENEMY') {
              this.handleSteering(p, transform, motion, delta);
          }

          transform.prevX = transform.x;
          transform.prevY = transform.y;
          transform.prevRotation = transform.rotation;

          transform.x += motion.vx * delta;
          transform.y += motion.vy * delta;
      }
  }

  private handleSteering(entity: Entity, transform: TransformData, motion: MotionData, delta: number) {
      const targetData = entity.getComponent<TargetData>(ComponentType.Target);
      if (!targetData) return;

      if (!targetData.id || targetData.id === 'ENEMY_LOCKED') {
          const RANGE = 20;
          const count = this.physics.spatialGrid.query(transform.x, transform.y, RANGE, this.queryBuffer);
          let minDist = Infinity;
          let bestTarget: Entity | null = null;

          for(let i=0; i<count; i++) {
              const other = this.registry.getEntity(this.queryBuffer[i]);
              if (!other || !other.active || !other.hasTag(Tag.ENEMY)) continue;
              const t2 = other.getComponent<TransformData>(ComponentType.Transform);
              if (!t2) continue;
              const d = (t2.x - transform.x)**2 + (t2.y - transform.y)**2;
              if (d < minDist) { minDist = d; bestTarget = other; }
          }
          if (bestTarget) targetData.id = bestTarget.id.toString();
      }

      if (targetData.id) {
          const targetEntity = this.registry.getEntity(parseInt(targetData.id));
          if (!targetEntity || !targetEntity.active) { targetData.id = null; return; }

          const t2 = targetEntity.getComponent<TransformData>(ComponentType.Transform);
          if (t2) {
              const desiredAngle = Math.atan2(t2.y - transform.y, t2.x - transform.x);
              const currentAngle = Math.atan2(motion.vy, motion.vx);
              let diff = desiredAngle - currentAngle;
              while (diff > Math.PI) diff -= Math.PI * 2;
              while (diff < -Math.PI) diff += Math.PI * 2;

              const TURN_SPEED = 8.0; 
              const turn = Math.max(-TURN_SPEED * delta, Math.min(TURN_SPEED * delta, diff));
              const newAngle = currentAngle + turn;
              const speed = Math.sqrt(motion.vx*motion.vx + motion.vy*motion.vy);
              
              motion.vx = Math.cos(newAngle) * speed;
              motion.vy = Math.sin(newAngle) * speed;
          }
      }
  }

  private handleAutoFire(delta: number, time: number) {
    const playerEntity = this.getPlayerEntity();
    if (!playerEntity) return;

    const stateComp = playerEntity.getComponent<AIStateData>(ComponentType.State);
    if (!stateComp || (stateComp.current !== AI_STATE.ACTIVE && stateComp.current !== AI_STATE.REBOOTING)) return;

    const transform = playerEntity.getComponent<TransformData>(ComponentType.Transform);
    if (!transform) return;

    const target = this.acquireTarget(transform);
    if (!target) return;

    const spitterState = useGameStore.getState().spitter;
    const snifferState = useGameStore.getState().sniffer;
    const pVisual = playerEntity.getComponent<RenderTransform>(ComponentType.RenderTransform);

    // SPITTER
    const spitterInterval = this.getSpitterInterval(spitterState.rateLevel);
    if (time > this.lastSpitterTime + spitterInterval) {
        const shot = calculateSpitterShot(
            { x: transform.x, y: transform.y },
            { x: target.x, y: target.y },
            spitterState
        );
        
        // --- SCALE CALCULATION ---
        // Each Girth Level increases size by 75%
        const girthMult = 1.0 + (spitterState.girthLevel * 0.75);
        
        this.spawner.spawnProjectile(
            shot.x, shot.y, shot.vx, shot.vy, 
            Faction.FRIENDLY, shot.life, shot.damage, shot.configId,
            undefined, 
            { scaleX: 0.4 * girthMult, scaleY: 0.4 * girthMult } // Override base 0.4
        );

        this.events.emit(GameEvents.PLAYER_FIRED, { x: transform.x, y: transform.y, angle: Math.atan2(shot.vy, shot.vx) });
        this.events.emit(GameEvents.PLAY_SOUND, { key: 'fx_player_fire', x: transform.x });
        this.lastSpitterTime = time;
    }

    // SNIFFER
    if (snifferState.capacityLevel > 0) {
        const snifferInterval = this.getSnifferInterval(snifferState.rateLevel);
        if (time > this.lastSnifferTime + snifferInterval) {
            const reticleRot = pVisual ? -pVisual.rotation : 0;
            const shots = calculateSnifferShots(
                { x: transform.x, y: transform.y },
                snifferState,
                reticleRot
            );

            shots.forEach(s => {
                const b = this.spawner.spawnProjectile(
                    s.x, s.y, s.vx, s.vy, 
                    Faction.FRIENDLY, s.life, s.damage, s.configId
                );
                b.addComponent(new TargetData(null, 'ENEMY'));
                this.registry.updateCache(b);
            });
            this.lastSnifferTime = time;
        }
    }
  }

  private getSpitterInterval(level: number): number {
      const base = 0.15;
      return base / Math.pow(1.1, level);
  }

  private getSnifferInterval(level: number): number {
      const base = 0.15;
      if (level === 0) return base * 3.0;
      if (level === 1) return base * 1.5;
      if (level === 2) return base;
      if (level >= 3) return base * 0.75;
      return base * 3.0;
  }

  private triggerPurge() {
      this.purgeState = { active: true, shotsRemaining: 180, currentAngle: 0, accumulator: 0 };
      const player = this.getPlayerEntity();
      if (player) {
          const t = player.getComponent<TransformData>(ComponentType.Transform);
          if (t) {
              this.events.emit(GameEvents.SPAWN_FX, { type: 'PURGE_BLAST', x: t.x, y: t.y, angle: 0 });
              this.events.emit(GameEvents.TRAUMA_ADDED, { amount: 0.5 });
          }
      }
  }

  private triggerNova() {
      const player = this.getPlayerEntity();
      if (player) {
          const t = player.getComponent<TransformData>(ComponentType.Transform);
          if (t) {
              const BURST_COUNT = 72;
              const BURST_SPEED = 24;
              
              for(let i=0; i<BURST_COUNT; i++) {
                  const angle = (i / BURST_COUNT) * Math.PI * 2;
                  const vx = Math.cos(angle) * BURST_SPEED;
                  const vy = Math.sin(angle) * BURST_SPEED;
                  
                  const bullet = this.spawner.spawnProjectile(
                      t.x, t.y, vx, vy, 
                      Faction.FRIENDLY, 2.4, 50, 
                      WeaponIDs.PLAYER_PURGE, 
                      undefined,
                      { scaleX: 1.5, scaleY: 1.5 }
                  );

                  const hue = i / BURST_COUNT;
                  this.tempColor.setHSL(hue, 1.0, 0.5);
                  
                  const model = bullet.getComponent<RenderModel>(ComponentType.RenderModel);
                  if (model) { 
                      model.r = this.tempColor.r; 
                      model.g = this.tempColor.g; 
                      model.b = this.tempColor.b; 
                  }
              }
          }
      }
  }

  private processPurgeFrame(delta: number, originX: number, originY: number) {
      const ANGLE_INCREMENT = 0.4; const SPEED = 24; const DAMAGE = 50;
      const LIFE = 2.4; const FIRE_RATE = 164; 
      this.purgeState.accumulator += delta * FIRE_RATE;
      while (this.purgeState.accumulator >= 1.0) {
          this.purgeState.accumulator -= 1.0;
          if (this.purgeState.shotsRemaining <= 0) { 
              this.purgeState.active = false; 
              this.events.emit(GameEvents.PURGE_COMPLETE, null); 
              break; 
          }
          const angle = this.purgeState.currentAngle;
          const vx = Math.cos(angle) * SPEED; const vy = Math.sin(angle) * SPEED;
          const bullet = this.spawner.spawnProjectile(originX, originY, vx, vy, Faction.FRIENDLY, LIFE, DAMAGE, WeaponIDs.PLAYER_PURGE);
          
          const hue = (this.purgeState.currentAngle * 0.15) % 1.0; 
          this.tempColor.setHSL(hue, 1.0, 0.5); 
          const model = bullet.getComponent<RenderModel>(ComponentType.RenderModel);
          if (model) { model.r = this.tempColor.r; model.g = this.tempColor.g; model.b = this.tempColor.b; }

          if (this.purgeState.shotsRemaining % 5 === 0) { this.events.emit(GameEvents.PLAY_SOUND, { key: 'fx_player_fire', x: originX }); }
          this.purgeState.currentAngle += ANGLE_INCREMENT;
          this.purgeState.shotsRemaining--;
      }
  }

  private acquireTarget(pPos: TransformData) {
    const RANGE = 14; 
    const count = this.physics.spatialGrid.query(pPos.x, pPos.y, RANGE, this.queryBuffer);
    let nearestDist = Infinity; let targetEnemy = null;

    for (let i = 0; i < count; i++) {
      const id = this.queryBuffer[i];
      const e = this.registry.getEntity(id);
      if (!e || !e.active || !e.hasTag(Tag.ENEMY) || e.hasTag(Tag.PROJECTILE)) continue;
      const state = e.getComponent<AIStateData>(ComponentType.State);
      if (state && state.current === AI_STATE.SPAWN) continue;
      const t = e.getComponent<TransformData>(ComponentType.Transform);
      if (!t) continue;
      const dist = (t.x - pPos.x)**2 + (t.y - pPos.y)**2; 
      if (dist < 196 && dist < nearestDist) { nearestDist = dist; targetEnemy = e; }
    }
    if (!targetEnemy) return null;
    const t = targetEnemy.getComponent<TransformData>(ComponentType.Transform)!;
    return { x: t.x, y: t.y };
  }

  private getPlayerEntity() {
      const players = this.registry.getByTag(Tag.PLAYER);
      for (const p of players) {
          const id = p.getComponent<IdentityData>(ComponentType.Identity);
          if (id && id.variant === 'PLAYER') return p;
      }
      return null;
  }

  teardown(): void { 
      this.unsubs.forEach(u => u());
      this.unsubs = [];
  }
}

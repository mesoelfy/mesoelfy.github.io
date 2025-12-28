import { IGameSystem, IEntitySpawner, IGameStateSystem, IEntityRegistry, IGameEventService, IPhysicsSystem } from '@/engine/interfaces';
import { Tag, Faction } from '@/engine/ecs/types';
import { TransformData } from '@/engine/ecs/components/TransformData';
import { AIStateData } from '@/engine/ecs/components/AIStateData';
import { RenderModel } from '@/engine/ecs/components/RenderModel';
import { RenderTransform } from '@/engine/ecs/components/RenderTransform';
import { IdentityData } from '@/engine/ecs/components/IdentityData';
import { TargetData } from '@/engine/ecs/components/TargetData';
import { GameEvents } from '@/engine/signals/GameEvents';
import { ConfigService } from '@/engine/services/ConfigService';
import { ComponentType } from '@/engine/ecs/ComponentType';
import { calculateRailgunShot, calculateSnifferShots } from '@/engine/handlers/weapons/WeaponLogic';
import { AI_STATE } from '@/engine/ai/AIStateTypes';
import { WeaponIDs } from '@/engine/config/Identifiers';
import { SYS_LIMITS } from '@/engine/config/constants/SystemConstants';
import { useGameStore } from '@/engine/state/game/useGameStore';
import * as THREE from 'three';

interface PurgeState {
    active: boolean;
    shotsRemaining: number;
    currentAngle: number;
    accumulator: number;
}

export class WeaponSystem implements IGameSystem {
  private lastRailgunTime = 0;
  private lastSnifferTime = 0;
  
  private unsubs: (() => void)[] = [];
  private tempColor = new THREE.Color();
  private queryBuffer = new Int32Array(SYS_LIMITS.MAX_COLLISION_RESULTS);
  
  private purgeState: PurgeState = {
      active: false, shotsRemaining: 0, currentAngle: 0, accumulator: 0
  };

  constructor(
    private spawner: IEntitySpawner,
    private registry: IEntityRegistry,
    private gameSystem: IGameStateSystem,
    private events: IGameEventService,
    private config: typeof ConfigService,
    private physics: IPhysicsSystem 
  ) {
    this.unsubs.push(this.events.subscribe(GameEvents.UPGRADE_SELECTED, (p) => {
        if (p.option === 'PURGE') this.triggerPurge();
    }));
  }

  update(delta: number, time: number): void {
    const isDead = this.gameSystem.isGameOver || this.gameSystem.playerHealth <= 0;
    if (isDead && !this.purgeState.active) return;

    const playerEntity = this.getPlayerEntity();
    if (!playerEntity) return;

    // --- PURGE LOGIC ---
    if (this.purgeState.active) {
        const transform = playerEntity.getComponent<TransformData>(ComponentType.Transform);
        if (transform) this.processPurgeFrame(delta, transform.x, transform.y);
    }

    if (this.purgeState.active || isDead) return;

    // --- AUTO FIRE LOGIC ---
    const stateComp = playerEntity.getComponent<AIStateData>(ComponentType.State);
    if (!stateComp || (stateComp.current !== AI_STATE.ACTIVE && stateComp.current !== AI_STATE.REBOOTING)) return;

    // 1. Acquire Targets
    const transform = playerEntity.getComponent<TransformData>(ComponentType.Transform);
    if (!transform) return;

    const target = this.acquireTarget(transform);
    if (!target) return; // No enemies in range, don't fire

    // 2. Read State
    const railgunState = useGameStore.getState().railgun;
    const snifferState = useGameStore.getState().sniffer;
    const pVisual = playerEntity.getComponent<RenderTransform>(ComponentType.RenderTransform);

    // 3. RAILGUN FIRE
    const railgunInterval = this.getRailgunInterval(railgunState.rateLevel);
    if (time > this.lastRailgunTime + railgunInterval) {
        const shot = calculateRailgunShot(
            { x: transform.x, y: transform.y },
            { x: target.x, y: target.y },
            railgunState
        );
        
        // Pass Scale Override (scaleX maps to width in Capsule geometry context usually Y or radius, 
        // but let's assume we map scaleX to the prop we want. 
        // Our Railgun visual is a CAPSULE. [0.2, 0.8, 0.2].
        // Scale X/Z is width. Scale Y is length.
        // Logic returns 'scaleX' as the width multiplier.
        this.spawner.spawnBullet(
            shot.x, shot.y, shot.vx, shot.vy, 
            Faction.FRIENDLY, shot.life, shot.damage, shot.configId, 
            undefined,
            { scaleX: shot.scaleX, scaleY: 0.8 } // Pass length explicitly to maintain aspect? Or handled in logic.
        );

        this.events.emit(GameEvents.PLAYER_FIRED, { 
            x: transform.x, y: transform.y, 
            angle: Math.atan2(shot.vy, shot.vx) 
        });
        this.events.emit(GameEvents.PLAY_SOUND, { key: 'fx_player_fire', x: transform.x });
        this.lastRailgunTime = time;
    }

    // 4. SNIFFER FIRE
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
                const b = this.spawner.spawnBullet(
                    s.x, s.y, s.vx, s.vy, 
                    Faction.FRIENDLY, s.life, s.damage, s.configId
                );
                // Sniffers need homing
                b.addComponent(new TargetData(null, 'ENEMY'));
                this.registry.updateCache(b);
            });
            
            // Only play sound if shots were actually generated
            if (shots.length > 0) {
                // Slightly different sound or pitch?
                // For now, reuse or add 'fx_sniffer_fire' later
            }
            this.lastSnifferTime = time;
        }
    }
  }

  private getRailgunInterval(level: number): number {
      const base = 0.15;
      // 10% faster per level: 0.15 / (1.1 ^ level)
      return base / Math.pow(1.1, level);
  }

  private getSnifferInterval(level: number): number {
      const base = 0.15; // Railgun Base
      // Lvl 0: 1/3 rate -> 3x interval -> 0.45s
      if (level === 0) return base * 3.0;
      // Lvl 1: 2/3 rate -> 1.5x interval -> 0.225s
      if (level === 1) return base * 1.5;
      // Lvl 2: 1:1 rate -> 1x interval -> 0.15s
      if (level === 2) return base;
      // Lvl 3: 1.33x rate -> 0.75x interval -> 0.1125s
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
          const bullet = this.spawner.spawnBullet(originX, originY, vx, vy, Faction.FRIENDLY, LIFE, DAMAGE, WeaponIDs.PLAYER_PURGE);
          
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
    
    let nearestDist = Infinity; 
    let targetEnemy = null;

    for (let i = 0; i < count; i++) {
      const id = this.queryBuffer[i];
      const e = this.registry.getEntity(id);
      
      if (!e || !e.active || !e.hasTag(Tag.ENEMY) || e.hasTag(Tag.BULLET)) continue;
      
      const state = e.getComponent<AIStateData>(ComponentType.State);
      if (state && state.current === AI_STATE.SPAWN) continue;
      
      const t = e.getComponent<TransformData>(ComponentType.Transform);
      if (!t) continue;
      
      const dist = (t.x - pPos.x)**2 + (t.y - pPos.y)**2; 
      if (dist < 196 && dist < nearestDist) { 
          nearestDist = dist; 
          targetEnemy = e; 
      }
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

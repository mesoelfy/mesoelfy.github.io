import { IGameSystem, IEntitySpawner, IGameStateSystem, IEntityRegistry, IGameEventService, IPhysicsSystem } from '@/engine/interfaces';
import { Tag, Faction } from '@/engine/ecs/types';
import { TransformData } from '@/engine/ecs/components/TransformData';
import { MotionData } from '@/engine/ecs/components/MotionData';
import { AIStateData } from '@/engine/ecs/components/AIStateData';
import { RenderTransform } from '@/engine/ecs/components/RenderTransform';
import { IdentityData } from '@/engine/ecs/components/IdentityData';
import { TargetData } from '@/engine/ecs/components/TargetData';
import { GameEvents } from '@/engine/signals/GameEvents';
import { ComponentType } from '@/engine/ecs/ComponentType';
import { calculateSpitterShot, calculateSnifferShots, ShotDef } from '@/engine/handlers/weapons/WeaponLogic';
import { AI_STATE } from '@/engine/ai/AIStateTypes';
import { WeaponIDs } from '@/engine/config/Identifiers';
import { SYS_LIMITS } from '@/engine/config/constants/SystemConstants';
import { Query } from '@/engine/ecs/Query';
import { Entity } from '@/engine/ecs/Entity';

export class WeaponSystem implements IGameSystem {
  private lastSpitterTime = 0; 
  private lastSnifferTime = 0;
  
  private projectileQuery = new Query({ all: [ComponentType.Projectile, ComponentType.Transform, ComponentType.Motion] });
  private queryBuffer = new Int32Array(SYS_LIMITS.MAX_COLLISION_RESULTS);

  private targetCache = { x: 0, y: 0, valid: false };
  private originCache = { x: 0, y: 0 };
  private spitterOut: ShotDef = { x: 0, y: 0, vx: 0, vy: 0, damage: 0, life: 0, configId: WeaponIDs.PLAYER_SPITTER, isHoming: false };
  private snifferOut: ShotDef[] = Array.from({ length: 8 }, () => ({ x: 0, y: 0, vx: 0, vy: 0, damage: 0, life: 0, configId: WeaponIDs.PLAYER_SNIFFER, isHoming: true }));

  constructor(
    private spawner: IEntitySpawner,
    private registry: IEntityRegistry,
    private gameSystem: IGameStateSystem,
    private events: IGameEventService,
    private physics: IPhysicsSystem
  ) {}

  update(delta: number, time: number): void {
    this.updateProjectiles(delta);

    const isDead = this.gameSystem.isGameOver || this.gameSystem.playerHealth <= 0;
    if (isDead) return;
    
    this.handleAutoFire(time);
  }

  private updateProjectiles(delta: number) {
      const projectiles = this.registry.query(this.projectileQuery);
      for (const p of projectiles) {
          if (!p.active) continue;
          const transform = p.getComponent<TransformData>(ComponentType.Transform)!;
          const motion = p.getComponent<MotionData>(ComponentType.Motion)!;
          
          transform.prevX = transform.x;
          transform.prevY = transform.y;
          transform.prevRotation = transform.rotation;

          transform.x += motion.vx * delta;
          transform.y += motion.vy * delta;
      }
  }

  private handleAutoFire(time: number) {
    const playerEntity = this.getPlayerEntity();
    if (!playerEntity) return;

    const stateComp = playerEntity.getComponent<AIStateData>(ComponentType.State);
    if (!stateComp || (stateComp.current !== AI_STATE.ACTIVE && stateComp.current !== AI_STATE.REBOOTING)) return;

    const transform = playerEntity.getComponent<TransformData>(ComponentType.Transform);
    if (!transform) return;

    this.acquireTarget(transform);
    if (!this.targetCache.valid) return;

    const weapons = this.gameSystem.getWeaponState();
    const spitterState = weapons.spitter;
    const snifferState = weapons.sniffer;

    const pVisual = playerEntity.getComponent<RenderTransform>(ComponentType.RenderTransform);

    this.originCache.x = transform.x;
    this.originCache.y = transform.y;

    // SPITTER
    const spitterInterval = this.getSpitterInterval(spitterState.rateLevel);
    if (time > this.lastSpitterTime + spitterInterval) {
        calculateSpitterShot(this.originCache, this.targetCache, spitterState, this.spitterOut);
        const girthMult = 1.0 + (spitterState.girthLevel * 0.75);
        
        this.spawner.spawnProjectile(
            this.spitterOut.x, this.spitterOut.y, this.spitterOut.vx, this.spitterOut.vy, 
            Faction.FRIENDLY, this.spitterOut.life, this.spitterOut.damage, this.spitterOut.configId,
            undefined, 
            { scaleX: 0.4 * girthMult, scaleY: 0.4 * girthMult }
        );

        this.events.emit(GameEvents.PLAYER_FIRED, { x: transform.x, y: transform.y, angle: Math.atan2(this.spitterOut.vy, this.spitterOut.vx) });
        this.events.emit(GameEvents.PLAY_SOUND, { key: 'fx_player_fire', x: transform.x });
        this.lastSpitterTime = time;
    }

    // SNIFFER
    if (snifferState.capacityLevel > 0) {
        const snifferInterval = this.getSnifferInterval(snifferState.rateLevel);
        if (time > this.lastSnifferTime + snifferInterval) {
            const reticleRot = pVisual ? -pVisual.rotation : 0;
            const count = calculateSnifferShots(this.originCache, snifferState, reticleRot, this.snifferOut);

            for (let i = 0; i < count; i++) {
                const s = this.snifferOut[i];
                const b = this.spawner.spawnProjectile(
                    s.x, s.y, s.vx, s.vy, 
                    Faction.FRIENDLY, s.life, s.damage, s.configId
                );
                b.addComponent(new TargetData(null, 'ENEMY'));
                this.registry.updateCache(b);
            }
            this.lastSnifferTime = time;
        }
    }
  }

  private getSpitterInterval(level: number): number { return 0.15 / Math.pow(1.1, level); }
  private getSnifferInterval(level: number): number {
      const base = 0.15;
      if (level === 0) return base * 3.0;
      if (level === 1) return base * 1.5;
      if (level === 2) return base;
      return base * 0.75;
  }

  private acquireTarget(pPos: TransformData) {
    const RANGE = 14; 
    const count = this.physics.spatialGrid.query(pPos.x, pPos.y, RANGE, this.queryBuffer);
    let nearestDist = Infinity; 
    this.targetCache.valid = false;

    for (let i = 0; i < count; i++) {
      const id = this.queryBuffer[i];
      const e = this.registry.getEntity(id);
      if (!e || !e.active || !e.hasTag(Tag.ENEMY) || e.hasTag(Tag.PROJECTILE)) continue;
      const state = e.getComponent<AIStateData>(ComponentType.State);
      if (state && state.current === AI_STATE.SPAWN) continue;
      const t = e.getComponent<TransformData>(ComponentType.Transform);
      if (!t) continue;
      
      const distSq = (t.x - pPos.x)**2 + (t.y - pPos.y)**2; 
      if (distSq < 196 && distSq < nearestDist) { 
          nearestDist = distSq; 
          this.targetCache.x = t.x;
          this.targetCache.y = t.y;
          this.targetCache.valid = true;
      }
    }
  }

  private getPlayerEntity(): Entity | null {
      for (const p of this.registry.getByTag(Tag.PLAYER)) {
          const id = p.getComponent<IdentityData>(ComponentType.Identity);
          if (id && id.variant === 'PLAYER') return p;
      }
      return null;
  }

  teardown(): void {}
}

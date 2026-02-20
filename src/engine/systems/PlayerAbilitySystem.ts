import { IGameSystem, IEntitySpawner, IEntityRegistry, IGameEventService } from '@/engine/interfaces';
import { GameEvents } from '@/engine/signals/GameEvents';
import { Tag, Faction } from '@/engine/ecs/types';
import { TransformData } from '@/engine/ecs/components/TransformData';
import { RenderModel } from '@/engine/ecs/components/RenderModel';
import { ComponentType } from '@/engine/ecs/ComponentType';
import { GameStream } from '@/engine/state/GameStream';
import { WeaponIDs } from '@/engine/config/Identifiers';
import { IdentityData } from '@/engine/ecs/components/IdentityData';
import * as THREE from 'three';

const PURGE_OFFSET = 1.2;

interface PurgeState {
    active: boolean;
    shotsRemaining: number;
    currentAngle: number;
    accumulator: number;
}

export class PlayerAbilitySystem implements IGameSystem {
  private unsubs: (() => void)[] = [];
  private purgeState: PurgeState = { active: false, shotsRemaining: 0, currentAngle: 0, accumulator: 0 };
  private tempColor = new THREE.Color();

  constructor(
    private registry: IEntityRegistry,
    private spawner: IEntitySpawner,
    private events: IGameEventService
  ) {
    this.unsubs.push(this.events.subscribe(GameEvents.UPGRADE_SELECTED, (p) => {
        if (p.option === 'PURGE') this.triggerPurge();
        if (p.option === 'NOVA') this.triggerNova(); 
    }));
  }

  update(delta: number, time: number): void {
    if (this.purgeState.active) {
        const player = this.getPlayerEntity();
        if (player) {
            const t = player.getComponent<TransformData>(ComponentType.Transform);
            if (t) this.processPurgeFrame(delta, t.x, t.y);
        }
    }
  }

  private triggerPurge() {
      this.purgeState = { active: true, shotsRemaining: 180, currentAngle: 0, accumulator: 0 };
      GameStream.set('PLAYER_PURGE_ACTIVE', 1);
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
                  const startX = t.x + Math.cos(angle) * PURGE_OFFSET;
                  const startY = t.y + Math.sin(angle) * PURGE_OFFSET;
                  const vx = Math.cos(angle) * BURST_SPEED;
                  const vy = Math.sin(angle) * BURST_SPEED;
                  
                  const bullet = this.spawner.spawnProjectile(
                      startX, startY, vx, vy, 
                      Faction.FRIENDLY, 2.4, 50, 
                      WeaponIDs.PLAYER_PURGE, 
                      undefined,
                      { scaleX: 1.5, scaleY: 1.5 }
                  );

                  this.tempColor.setHSL(i / BURST_COUNT, 1.0, 0.5);
                  
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
              GameStream.set('PLAYER_PURGE_ACTIVE', 0); 
              this.events.emit(GameEvents.PURGE_COMPLETE, null); 
              break; 
          }
          const angle = this.purgeState.currentAngle;
          const startX = originX + Math.cos(angle) * PURGE_OFFSET;
          const startY = originY + Math.sin(angle) * PURGE_OFFSET;
          const vx = Math.cos(angle) * SPEED; const vy = Math.sin(angle) * SPEED;
          const bullet = this.spawner.spawnProjectile(startX, startY, vx, vy, Faction.FRIENDLY, LIFE, DAMAGE, WeaponIDs.PLAYER_PURGE);
          
          this.tempColor.setHSL((this.purgeState.currentAngle * 0.15) % 1.0, 1.0, 0.5); 
          const model = bullet.getComponent<RenderModel>(ComponentType.RenderModel);
          if (model) { model.r = this.tempColor.r; model.g = this.tempColor.g; model.b = this.tempColor.b; }

          if (this.purgeState.shotsRemaining % 5 === 0) { this.events.emit(GameEvents.PLAY_SOUND, { key: 'fx_player_fire', x: originX }); }
          this.purgeState.currentAngle += ANGLE_INCREMENT;
          this.purgeState.shotsRemaining--;
      }
  }

  private getPlayerEntity() {
      for (const p of this.registry.getByTag(Tag.PLAYER)) {
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

import { IGameSystem, IParticleSystem, IGameEventService, IPanelSystem } from '@/engine/interfaces';
import { UnifiedEventService } from '@/engine/signals/UnifiedEventService';
import { GameEvents } from '@/engine/signals/GameEvents';
import { FastEventType, FX_LOOKUP, FXCode, FLOAT_SCALAR } from '@/engine/signals/FastEventBus';
import { ShakeSystem } from './ShakeSystem';
import { TimeSystem } from './TimeSystem';
import { VFX_MANIFEST } from '@/engine/config/assets/VFXManifest';
import { ParticleShape } from '@/engine/ecs/types';
import { PanelId } from '@/engine/config/PanelConfig';
import * as THREE from 'three';

export class VFXSystem implements IGameSystem {
  private unsubs: (() => void)[] = [];
  private isPotato = false;
  
  private tempColor = new THREE.Color();
  private white = new THREE.Color(0xffffff);

  constructor(
    private particleSystem: IParticleSystem,
    private shakeSystem: ShakeSystem,
    private events: IGameEventService, 
    private panelSystem: IPanelSystem,
    private timeSystem: TimeSystem
  ) {
    this.setupSubscriptions();
  }

  private setupSubscriptions() {
    this.unsubs.push(this.events.subscribe(GameEvents.GLOBAL_STATE_SYNC, (p) => {
        this.isPotato = p.graphicsMode === 'POTATO';
    }));

    this.unsubs.push(this.events.subscribe(GameEvents.SPAWN_IMPACT, (p) => {
        this.spawnDynamicImpact(p.x, p.y, p.hexColor, p.angle);
    }));

    this.unsubs.push(this.events.subscribe(GameEvents.SPAWN_FX, (p) => {
        this.executeRecipe(p.type, p.x, p.y, p.angle);
    }));

    this.unsubs.push(this.events.subscribe(GameEvents.PANEL_RESTORED, (p) => {
        const x = p.x !== undefined ? p.x : this.getPanelX(p.id);
        this.executeRecipe('REBOOT_HEAL', x, 0);
    }));

    this.unsubs.push(this.events.subscribe(GameEvents.PANEL_DESTROYED, () => {
        this.shakeSystem.addTrauma(0.75);
        this.timeSystem.freeze(0.15);
    }));

    this.unsubs.push(this.events.subscribe(GameEvents.GAME_OVER, () => {
        this.shakeSystem.addTrauma(1.0);
        this.timeSystem.freeze(0.5);
    }));
    
    // FIX: Add global shake on manual restore
    this.unsubs.push(this.events.subscribe(GameEvents.UPGRADE_SELECTED, (p) => {
        if (p.option === 'RESTORE') {
            this.shakeSystem.addTrauma(0.3);
        }
    }));
  }

  update(delta: number, time: number): void {
      const unified = this.events as UnifiedEventService;
      if (unified && typeof unified.processFastEvents === 'function') {
          unified.processFastEvents((id, a1, a2, a3, a4) => {
              if (id === FastEventType.SPAWN_FX) {
                  const key = FX_LOOKUP[a1 as FXCode];
                  if (key) {
                      this.executeRecipe(
                          key, 
                          a2 / FLOAT_SCALAR, 
                          a3 / FLOAT_SCALAR, 
                          a4 / FLOAT_SCALAR
                      );
                  }
              }
              else if (id === FastEventType.CAM_SHAKE) {
                  this.shakeSystem.addTrauma(a1 / FLOAT_SCALAR);
              }
              else if (id === FastEventType.HIT_STOP) {
                  this.timeSystem.freeze(a1 / 1000); 
              }
          });
      }
  }

  private getPanelX(panelId: PanelId): number {
      const rect = this.panelSystem.getPanelRect(panelId);
      return rect ? rect.x : 0;
  }

  teardown(): void {
      this.unsubs.forEach(u => u());
      this.unsubs = [];
  }

  private spawnDynamicImpact(x: number, y: number, hexColor: string, impactAngle: number) {
      this.tempColor.set(hexColor);
      this.tempColor.lerp(this.white, 0.6); 
      const lightHex = '#' + this.tempColor.getHexString();
      
      const count = this.randomRange(2, 3); 
      
      for(let i=0; i<count; i++) {
          const side = Math.random() > 0.5 ? 1 : -1;
          const deflection = 0.6 + (Math.random() * 1.2);
          const angle = impactAngle + (side * deflection);
          
          const speed = this.randomRange(10, 22); 
          const vx = Math.cos(angle) * speed;
          const vy = Math.sin(angle) * speed;
          const life = this.randomRange(0.1, 0.3);
          
          const randC = Math.random();
          let finalColor = hexColor;
          let size = 1.0;

          if (randC > 0.8) {
              finalColor = '#FFFFFF';
              size = 0.8;
          } else if (randC > 0.4) {
              finalColor = lightHex;
              size = 1.2;
          }

          this.particleSystem.spawn(x, y, finalColor, vx, vy, life, size, ParticleShape.SQUARE); 
      }
  }

  private executeRecipe(key: string, x: number, y: number, angle: number = 0) {
      const recipe = VFX_MANIFEST[key];
      if (!recipe) return;

      const multiplier = this.isPotato ? 0.3 : 1.0;

      const rawCount = this.randomRange(recipe.count[0], recipe.count[1]);
      let count = Math.floor(rawCount * multiplier);
      if (rawCount > 0 && count === 0) count = 1;

      const offsetRadius = recipe.offsetRadius || 0;

      for (let i = 0; i < count; i++) {
          const color = recipe.colors[Math.floor(Math.random() * recipe.colors.length)];
          const speed = this.randomRange(recipe.speed[0], recipe.speed[1]);
          const life = this.randomRange(recipe.life[0], recipe.life[1]);
          
          let size = 1.0;
          if (recipe.size) {
              size = this.randomRange(recipe.size[0], recipe.size[1]);
          }
          
          let vx = 0;
          let vy = 0;
          
          let spawnX = x;
          let spawnY = y;

          const isBackblast = recipe.omniChance && Math.random() < recipe.omniChance;
          const isDirectional = recipe.pattern === 'DIRECTIONAL';
          
          const finalSpeed = (isDirectional && isBackblast) ? speed * 0.5 : speed;
          const finalLife = (isDirectional && isBackblast) ? life * 0.8 : life;

          if (recipe.pattern === 'RADIAL') {
              const a = Math.random() * Math.PI * 2;
              vx = Math.cos(a) * finalSpeed;
              vy = Math.sin(a) * finalSpeed;
              
              if (offsetRadius > 0) {
                  spawnX += Math.cos(a) * offsetRadius;
                  spawnY += Math.sin(a) * offsetRadius;
              }
          } 
          else if (isDirectional) {
              let dir = angle + Math.PI; 
              let spread = recipe.spread || 0.5;

              if (isBackblast) {
                  dir += Math.PI; 
                  spread *= 1.5; 
              }

              const a = dir + (Math.random() - 0.5) * spread;
              vx = Math.cos(a) * finalSpeed;
              vy = Math.sin(a) * finalSpeed;
              
              if (offsetRadius > 0) {
                  spawnX += Math.cos(a) * offsetRadius;
                  spawnY += Math.sin(a) * offsetRadius;
              }
          }

          const shape = (recipe.shape === 1) ? ParticleShape.SQUARE : ParticleShape.CIRCLE;
          this.particleSystem.spawn(spawnX, spawnY, color, vx, vy, finalLife, size, shape);
      }
  }

  private randomRange(min: number, max: number) {
      return min + Math.random() * (max - min);
  }
}

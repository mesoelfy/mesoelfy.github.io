import { IGameSystem, IParticleSystem, IGameEventService, IPanelSystem } from '@/engine/interfaces';
import { UnifiedEventService } from '@/engine/signals/UnifiedEventService';
import { GameEvents } from '@/engine/signals/GameEvents';
import { FastEventType, FX_LOOKUP, FXCode, FLOAT_SCALAR } from '@/engine/signals/FastEventBus';
import { ShakeSystem } from './ShakeSystem';
import { TimeSystem } from './TimeSystem';
import { VFX_MANIFEST } from '@/engine/config/assets/VFXManifest';
import { useStore } from '@/engine/state/global/useStore';
import { ParticleShape } from '@/engine/ecs/types';
import { PanelId } from '@/engine/config/PanelConfig';
import * as THREE from 'three';

export class VFXSystem implements IGameSystem {
  private unsubs: (() => void)[] = [];
  
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
      // 1. Prepare Palette
      this.tempColor.set(hexColor);
      this.tempColor.lerp(this.white, 0.6); // Lighter "hot" version
      const lightHex = '#' + this.tempColor.getHexString();
      
      // REVERTED: Original Physics Counts
      const count = this.randomRange(2, 3); 
      
      for(let i=0; i<count; i++) {
          const side = Math.random() > 0.5 ? 1 : -1;
          const deflection = 0.6 + (Math.random() * 1.2);
          const angle = impactAngle + (side * deflection);
          
          // REVERTED: Original Speed/Life
          const speed = this.randomRange(10, 22); 
          const vx = Math.cos(angle) * speed;
          const vy = Math.sin(angle) * speed;
          const life = this.randomRange(0.1, 0.3);
          
          // 2. Color Variant Logic (Kept)
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

      const graphicsMode = useStore.getState().graphicsMode;
      const isPotato = graphicsMode === 'POTATO';
      const multiplier = isPotato ? 0.3 : 1.0;

      const rawCount = this.randomRange(recipe.count[0], recipe.count[1]);
      let count = Math.floor(rawCount * multiplier);
      if (rawCount > 0 && count === 0) count = 1;

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

          const isBackblast = recipe.omniChance && Math.random() < recipe.omniChance;
          const isDirectional = recipe.pattern === 'DIRECTIONAL';
          
          const finalSpeed = (isDirectional && isBackblast) ? speed * 0.5 : speed;
          const finalLife = (isDirectional && isBackblast) ? life * 0.8 : life;

          if (recipe.pattern === 'RADIAL') {
              const a = Math.random() * Math.PI * 2;
              vx = Math.cos(a) * finalSpeed;
              vy = Math.sin(a) * finalSpeed;
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
          }

          const shape = (recipe.shape === 1) ? ParticleShape.SQUARE : ParticleShape.CIRCLE;
          this.particleSystem.spawn(x, y, color, vx, vy, finalLife, size, shape);
      }
  }

  private randomRange(min: number, max: number) {
      return min + Math.random() * (max - min);
  }
}

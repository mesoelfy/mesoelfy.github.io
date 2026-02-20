import { IGameSystem, IPanelSystem, IEntityRegistry, IPhysicsSystem } from '@/engine/interfaces';
import { TransformData } from '@/engine/ecs/components/TransformData';
import { TargetData } from '@/engine/ecs/components/TargetData';
import { Tag } from '@/engine/ecs/types';
import { ComponentType } from '@/engine/ecs/ComponentType';
import { PanelId } from '@/engine/config/PanelConfig';
import { SYS_LIMITS } from '@/engine/config/constants/SystemConstants';

export class TargetingSystem implements IGameSystem {
  private playerCache = { x: 0, y: 0, valid: false };
  private enemyCache = { x: 0, y: 0, valid: false };
  private queryBuffer = new Int32Array(SYS_LIMITS.MAX_COLLISION_RESULTS);

  constructor(
    private registry: IEntityRegistry,
    private panelSystem: IPanelSystem,
    private physics: IPhysicsSystem
  ) {}

  update(delta: number, time: number): void {
    this.updatePlayerCache();
    const entities = this.registry.getAll();
    
    for (const entity of entities) {
        if (!entity.active) continue;

        const target = entity.getComponent<TargetData>(ComponentType.Target);
        if (!target) continue;

        const transform = entity.getComponent<TransformData>(ComponentType.Transform);
        if (!transform) continue;

        if (target.locked && target.id) {
            if (target.type === 'PANEL') {
                const panel = this.panelSystem.getPanelState(target.id as PanelId);
                if (!panel || panel.isDestroyed) {
                    target.locked = false;
                    target.id = null;
                } else {
                    const rect = this.panelSystem.getPanelRect(target.id as PanelId);
                    if (rect) {
                        // FIX: Target the center of the panel, NOT the closest clamped edge
                        target.x = rect.x; 
                        target.y = rect.y; 
                    }
                }
            }
            else if (target.type === 'ENEMY') {
                target.locked = false; 
            }
            else if (target.type === 'PLAYER' && this.playerCache.valid) {
                target.x = this.playerCache.x;
                target.y = this.playerCache.y;
            }
            
            if (target.locked) continue; 
        }

        if (target.type === 'PLAYER') {
            if (this.playerCache.valid) {
                target.x = this.playerCache.x;
                target.y = this.playerCache.y;
                target.id = 'PLAYER';
            }
        }
        else if (target.type === 'PANEL') {
            const bestPanel = this.findNearestPanel(transform.x, transform.y);
            if (bestPanel) {
                target.id = bestPanel.id;
                // FIX: Target the center of the panel
                target.x = bestPanel.x; 
                target.y = bestPanel.y; 
                target.locked = true; 
            } else {
                if (this.playerCache.valid) {
                    target.x = this.playerCache.x;
                    target.y = this.playerCache.y;
                    target.id = 'PLAYER';
                }
            }
        }
        else if (target.type === 'ENEMY') {
            this.findNearestEnemy(transform.x, transform.y);
            if (this.enemyCache.valid) {
                target.x = this.enemyCache.x;
                target.y = this.enemyCache.y;
                target.id = 'ENEMY_LOCKED';
            } else {
                target.id = null; 
            }
        }
    }
  }

  private updatePlayerCache() {
      this.playerCache.valid = false;
      const players = this.registry.getByTag(Tag.PLAYER);
      for (const p of players) {
          const t = p.getComponent<TransformData>(ComponentType.Transform);
          if (t) {
              this.playerCache.x = t.x;
              this.playerCache.y = t.y;
              this.playerCache.valid = true;
              return;
          }
      }
  }

  private findNearestPanel(x: number, y: number) {
      const panels = this.panelSystem.getAllPanels();
      let nearest: any = null;
      let minDist = Infinity;

      for (const p of panels) {
          if (p.isDestroyed) continue;
          
          const clampedX = Math.max(p.left, Math.min(x, p.right));
          const clampedY = Math.max(p.bottom, Math.min(y, p.top));
          
          const dx = clampedX - x;
          const dy = clampedY - y;
          const distSq = dx*dx + dy*dy;
          
          if (distSq < minDist) {
              minDist = distSq;
              nearest = p;
          }
      }
      return nearest;
  }

  private findNearestEnemy(x: number, y: number) {
      const SEARCH_RADIUS = 15;
      const MAX_RANGE_SQ = SEARCH_RADIUS * SEARCH_RADIUS;
      const count = this.physics.spatialGrid.query(x, y, SEARCH_RADIUS, this.queryBuffer);
      
      let minDist = Infinity;
      this.enemyCache.valid = false;

      for (let i = 0; i < count; i++) {
          const id = this.queryBuffer[i];
          const e = this.registry.getEntity(id);
          
          if (!e || !e.active || !e.hasTag(Tag.ENEMY) || e.hasTag(Tag.PROJECTILE)) continue;

          const t = e.getComponent<TransformData>(ComponentType.Transform);
          if (!t) continue;
          
          const dx = t.x - x;
          const dy = t.y - y;
          const distSq = dx*dx + dy*dy;
          
          if (distSq < minDist && distSq < MAX_RANGE_SQ) {
              minDist = distSq;
              this.enemyCache.x = t.x;
              this.enemyCache.y = t.y;
              this.enemyCache.valid = true;
          }
      }
  }

  teardown(): void {}
}

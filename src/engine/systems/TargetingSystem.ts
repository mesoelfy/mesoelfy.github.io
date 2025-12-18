import { IGameSystem, IPanelSystem, IEntityRegistry } from '@/engine/interfaces';
import { TransformData } from '@/engine/ecs/components/TransformData';
import { TargetData } from '@/engine/ecs/components/TargetData';
import { Tag } from '@/engine/ecs/types';
import { ComponentType } from '@/engine/ecs/ComponentType';

export class TargetingSystem implements IGameSystem {
  private playerCache: { x: number, y: number } | null = null;

  constructor(
    private registry: IEntityRegistry,
    private panelSystem: IPanelSystem
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

        // 1. UPDATE EXISTING LOCK
        if (target.locked && target.id) {
            if (target.type === 'PANEL') {
                const panel = this.panelSystem.getPanelState(target.id);
                if (!panel || panel.isDestroyed) {
                    target.locked = false;
                    target.id = null;
                } else {
                    const rect = this.panelSystem.getPanelRect(target.id);
                    if (rect) {
                        // CLAMP TO EDGE: Drillers want to go to the surface, not the center
                        target.x = Math.max(rect.left, Math.min(transform.x, rect.right));
                        target.y = Math.max(rect.bottom, Math.min(transform.y, rect.top));
                    }
                }
            }
            else if (target.type === 'ENEMY') {
                // Enemies don't typically track other enemies persistently in this game logic yet
                target.locked = false; 
            }
            else if (target.type === 'PLAYER' && this.playerCache) {
                target.x = this.playerCache.x;
                target.y = this.playerCache.y;
            }
            
            if (target.locked) continue; 
        }

        // 2. ACQUIRE NEW TARGET
        if (target.type === 'PLAYER') {
            if (this.playerCache) {
                target.x = this.playerCache.x;
                target.y = this.playerCache.y;
                target.id = 'PLAYER';
                // Player target is implicitly "locked" as it updates every frame above
            }
        }
        else if (target.type === 'PANEL') {
            const bestPanel = this.findNearestPanel(transform.x, transform.y);
            if (bestPanel) {
                target.id = bestPanel.id;
                // Initial Clamp
                target.x = Math.max(bestPanel.left, Math.min(transform.x, bestPanel.right));
                target.y = Math.max(bestPanel.bottom, Math.min(transform.y, bestPanel.top));
                target.locked = true; 
            } else {
                // Fallback to Player if no panels alive (rare)
                if (this.playerCache) {
                    target.x = this.playerCache.x;
                    target.y = this.playerCache.y;
                    target.id = 'PLAYER';
                }
            }
        }
        else if (target.type === 'ENEMY') {
            const bestEnemy = this.findNearestEnemy(transform.x, transform.y);
            if (bestEnemy) {
                target.x = bestEnemy.x;
                target.y = bestEnemy.y;
                target.id = 'ENEMY_LOCKED';
            } else {
                target.id = null; 
            }
        }
    }
  }

  private updatePlayerCache() {
      const players = this.registry.getByTag(Tag.PLAYER);
      for (const p of players) {
          const t = p.getComponent<TransformData>(ComponentType.Transform);
          if (t) {
              this.playerCache = { x: t.x, y: t.y };
              return;
          }
      }
      this.playerCache = null;
  }

  private findNearestPanel(x: number, y: number) {
      const panels = this.panelSystem.getAllPanels();
      let nearest: any = null;
      let minDist = Infinity;

      for (const p of panels) {
          if (p.isDestroyed) continue;
          
          // Calculate distance to the NEAREST POINT on the rect, not center
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
      const enemies = this.registry.getByTag(Tag.ENEMY);
      let nearest: { x: number, y: number } | null = null;
      let minDist = Infinity;
      const MAX_RANGE_SQ = 15 * 15; 

      for (const e of enemies) {
          if (!e.active) continue;
          if (e.hasTag(Tag.BULLET)) continue;

          const t = e.getComponent<TransformData>(ComponentType.Transform);
          if (!t) continue;
          
          const dx = t.x - x;
          const dy = t.y - y;
          const distSq = dx*dx + dy*dy;
          
          if (distSq < minDist && distSq < MAX_RANGE_SQ) {
              minDist = distSq;
              nearest = { x: t.x, y: t.y };
          }
      }
      return nearest;
  }

  teardown(): void {}
}

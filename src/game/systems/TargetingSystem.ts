import { IGameSystem, IServiceLocator } from '../core/interfaces';
import { EntityRegistry } from '../core/ecs/EntityRegistry';
import { TransformComponent } from '../components/data/TransformComponent';
import { TargetComponent } from '../components/data/TargetComponent';
import { PanelRegistry } from './PanelRegistrySystem';
import { Tag } from '../core/ecs/types';

export class TargetingSystem implements IGameSystem {
  private registry!: EntityRegistry;
  private locator!: IServiceLocator;

  private playerCache: { x: number, y: number } | null = null;

  setup(locator: IServiceLocator): void {
    this.registry = locator.getRegistry() as EntityRegistry;
    this.locator = locator;
  }

  update(delta: number, time: number): void {
    this.updatePlayerCache();

    const entities = this.registry.getAll();
    
    for (const entity of entities) {
        if (!entity.active) continue;

        const target = entity.getComponent<TargetComponent>('Target');
        const transform = entity.getComponent<TransformComponent>('Transform');

        if (!target || !transform) continue;

        // Locked target validation
        if (target.locked && target.id) {
            if (target.type === 'PANEL') {
                const panel = PanelRegistry.getPanelState(target.id);
                if (!panel || panel.isDestroyed) {
                    target.locked = false;
                    target.id = null;
                } else {
                    const rect = PanelRegistry.getPanelRect(target.id);
                    if (rect) {
                        target.x = rect.x;
                        target.y = rect.y;
                    }
                }
            }
            // Validate Enemy Target (for Homing Bullets)
            else if (target.type === 'ENEMY') {
                // If target ID is generic 'PLAYER', skip check.
                // If it's a specific Entity ID (stringified), check if alive.
                // For now, we recalculate nearest enemy every frame for bullets 
                // because enemies die fast. Simple and robust.
                target.locked = false; 
            }
            else if (target.type === 'PLAYER' && this.playerCache) {
                target.x = this.playerCache.x;
                target.y = this.playerCache.y;
            }
            
            if (target.locked) continue; 
        }

        // --- FIND NEW TARGET ---

        if (target.type === 'PLAYER') {
            if (this.playerCache) {
                target.x = this.playerCache.x;
                target.y = this.playerCache.y;
                target.id = 'PLAYER';
            }
        }
        else if (target.type === 'PANEL') {
            const bestPanel = this.findNearestPanel(transform.x, transform.y);
            if (bestPanel) {
                target.id = bestPanel.id;
                target.x = bestPanel.x;
                target.y = bestPanel.y;
                target.locked = true; 
            } else {
                // Fallback to Player if no panels
                if (this.playerCache) {
                    target.x = this.playerCache.x;
                    target.y = this.playerCache.y;
                    target.id = 'PLAYER';
                }
            }
        }
        // NEW: Bullet Homing Logic
        else if (target.type === 'ENEMY') {
            const bestEnemy = this.findNearestEnemy(transform.x, transform.y);
            if (bestEnemy) {
                // We don't ID lock bullets, we just steer to coordinates
                target.x = bestEnemy.x;
                target.y = bestEnemy.y;
                target.id = 'ENEMY_LOCKED';
            } else {
                target.id = null; // No target found, fly straight
            }
        }
    }
  }

  private updatePlayerCache() {
      const players = this.registry.getByTag(Tag.PLAYER);
      if (players.length > 0) {
          const t = players[0].getComponent<TransformComponent>('Transform');
          if (t) {
              this.playerCache = { x: t.x, y: t.y };
              return;
          }
      }
      this.playerCache = null;
  }

  private findNearestPanel(x: number, y: number) {
      const panels = PanelRegistry.getAllPanels();
      let nearest: any = null;
      let minDist = Infinity;

      for (const p of panels) {
          if (p.isDestroyed) continue;
          const dx = p.x - x;
          const dy = p.y - y;
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
      // Range limit for homing (don't target things across map)
      const MAX_RANGE_SQ = 15 * 15; 

      for (const e of enemies) {
          if (!e.active) continue;
          
          // UPDATED: Ignore Enemy Projectiles
          if (e.hasTag(Tag.BULLET)) continue;

          const t = e.getComponent<TransformComponent>('Transform');
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

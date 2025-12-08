import { IGameSystem, IServiceLocator } from '../core/interfaces';
import { EntityRegistry } from '../core/ecs/EntityRegistry';
import { TransformComponent } from '../components/data/TransformComponent';
import { TargetComponent } from '../components/data/TargetComponent';
import { PanelRegistry } from './PanelRegistrySystem';
import { Tag } from '../core/ecs/types';

export class TargetingSystem implements IGameSystem {
  private registry!: EntityRegistry;
  private locator!: IServiceLocator;

  // Cache to avoid querying player every loop iteration
  private playerCache: { x: number, y: number } | null = null;

  setup(locator: IServiceLocator): void {
    this.registry = locator.getRegistry() as EntityRegistry;
    this.locator = locator;
  }

  update(delta: number, time: number): void {
    // 1. Cache Player Position
    this.updatePlayerCache();

    // 2. Iterate all entities seeking a target
    // In a huge game, we'd use a specific 'TargetSeeker' tag, but iterating components is fast enough here.
    const entities = this.registry.getAll();
    
    for (const entity of entities) {
        if (!entity.active) continue;

        const target = entity.getComponent<TargetComponent>('Target');
        const transform = entity.getComponent<TransformComponent>('Transform');

        if (!target || !transform) continue;

        // If locked, just verify the target still exists/is valid
        if (target.locked && target.id) {
            if (target.type === 'PANEL') {
                const panel = PanelRegistry.getPanelState(target.id);
                // If panel is dead or missing, unlock and retarget
                if (!panel || panel.isDestroyed) {
                    target.locked = false;
                    target.id = null;
                } else {
                    // Update coordinates (in case of weird resizing?)
                    // Usually panels are static, but good practice.
                    const rect = PanelRegistry.getPanelRect(target.id);
                    if (rect) {
                        // Target the nearest edge or center? 
                        // For now, center is fine, behaviors handle edge logic.
                        target.x = rect.x;
                        target.y = rect.y;
                    }
                }
            }
            // If locked on Player, just update coord
            else if (target.type === 'PLAYER' && this.playerCache) {
                target.x = this.playerCache.x;
                target.y = this.playerCache.y;
            }
            
            if (target.locked) continue; // Still valid, skip new search
        }

        // --- FIND NEW TARGET ---

        // Strategy: PLAYER
        if (target.type === 'PLAYER') {
            if (this.playerCache) {
                target.x = this.playerCache.x;
                target.y = this.playerCache.y;
                target.id = 'PLAYER';
            }
        }
        
        // Strategy: PANEL (Drillers)
        else if (target.type === 'PANEL') {
            const bestPanel = this.findNearestPanel(transform.x, transform.y);
            
            if (bestPanel) {
                target.id = bestPanel.id;
                target.x = bestPanel.x;
                target.y = bestPanel.y;
                target.locked = true; // Lock onto this panel until it dies
            } else {
                // Fallback: If no panels alive, attack player
                if (this.playerCache) {
                    target.x = this.playerCache.x;
                    target.y = this.playerCache.y;
                    target.id = 'PLAYER'; // Temporary override
                }
            }
        }
    }
  }

  private updatePlayerCache() {
      // Use InputService cursor as the "Player Position" proxy since movement is cursor-bound
      // Or get actual entity. Let's get actual entity for correctness.
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
          // Ignore destroyed panels
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

  teardown(): void {}
}

import { IPanelSystem, IGameEventService, IAudioService } from '@/engine/interfaces';
import { GameEvents } from '@/engine/signals/GameEvents';
import { WorldRect, ViewportHelper } from '@/engine/math/ViewportHelper';
import { useGameStore } from '@/engine/state/game/useGameStore';
import { useStore } from '@/engine/state/global/useStore';
import { ServiceLocator } from '@/engine/services/ServiceLocator';
import { Entity } from '@/engine/ecs/Entity';
import { Tag } from '@/engine/ecs/types';
import { ComponentRegistry } from '@/engine/ecs/ComponentRegistry';
import { ComponentType } from '@/engine/ecs/ComponentType';
import { CollisionLayers, PhysicsConfig } from '@/engine/config/PhysicsConfig';
import { TransformData } from '@/engine/ecs/components/TransformData';
import { ColliderData } from '@/engine/ecs/components/ColliderData';
import { PanelId } from '@/engine/config/PanelConfig';

export class PanelRegistrySystem implements IPanelSystem {
  private entityMap = new Map<string, Entity>();
  private observer: ResizeObserver | null = null;
  private elements = new Map<string, HTMLElement>();

  public get systemIntegrity() {
      return useGameStore.getState().systemIntegrity;
  }

  constructor(
    private events: IGameEventService,
    private audio: IAudioService
  ) {
    if (typeof window !== 'undefined') {
        this.observer = new ResizeObserver((entries) => {
            for (const entry of entries) {
                for (const [id, el] of this.elements) {
                    if (el === entry.target) {
                        this.syncEntity(id as PanelId, entry.contentRect);
                        break;
                    }
                }
            }
        });
    }

    this.events.subscribe(GameEvents.UPGRADE_SELECTED, (p) => {
        if (p.option === 'RESTORE') {
            const restoredCount = useGameStore.getState().restoreAllPanels();
            if (restoredCount > 0) {
                this.events.emit(GameEvents.TRAUMA_ADDED, { amount: 0.3 }); 
                this.audio.playSound('fx_reboot_success'); 
            }
        }
    });

    this.events.subscribe(GameEvents.ZEN_MODE_ENABLED, () => {
        this.destroyAll();
    });
  }

  update(delta: number, time: number): void {}

  teardown(): void {
      this.observer?.disconnect();
      this.entityMap.clear();
      this.elements.clear();
  }

  public register(id: PanelId, element: HTMLElement) {
      this.elements.set(id, element);
      useGameStore.getState().registerPanel(id, element);
      this.observer?.observe(element);
      
      const registry = ServiceLocator.getRegistry();
      const entity = registry.createEntity();
      entity.addTag(Tag.OBSTACLE); 
      
      entity.addComponent(ComponentRegistry.create(ComponentType.Transform));
      entity.addComponent(ComponentRegistry.create(ComponentType.Identity, { variant: id })); 
      
      entity.addComponent(ComponentRegistry.create(ComponentType.Collider, {
          shape: 'BOX',
          layer: CollisionLayers.PANEL,
          mask: 0 
      }));

      this.entityMap.set(id, entity);
      registry.updateCache(entity);
      this.syncEntity(id, element.getBoundingClientRect());
  }

  public unregister(id: PanelId) {
      const el = this.elements.get(id);
      if (el) this.observer?.unobserve(el);
      this.elements.delete(id);
      
      useGameStore.getState().unregisterPanel(id);

      const entity = this.entityMap.get(id);
      if (entity) {
          ServiceLocator.getRegistry().destroyEntity(entity.id as number);
          this.entityMap.delete(id);
      }
  }

  private syncEntity(id: PanelId, rect: DOMRect | { width: number, height: number }) {
      const entity = this.entityMap.get(id);
      const el = this.elements.get(id);
      if (!entity || !el) return;

      const fullRect = el.getBoundingClientRect();
      const worldRect = ViewportHelper.domToWorld(id, fullRect);

      const transform = entity.getComponent<TransformData>(ComponentType.Transform);
      const collider = entity.getComponent<ColliderData>(ComponentType.Collider);

      if (transform && collider) {
          transform.x = worldRect.x;
          transform.y = worldRect.y;
          collider.width = worldRect.width;
          collider.height = worldRect.height;
      }
  }

  public refreshAll() { 
      for (const [id, el] of this.elements) {
          this.syncEntity(id as PanelId, el.getBoundingClientRect());
      }
  }
  
  public refreshSingle(id: PanelId) { 
      const el = this.elements.get(id);
      if (el) this.syncEntity(id, el.getBoundingClientRect());
  }

  public damagePanel(id: PanelId, amount: number, silent: boolean = false, sourceX?: number, sourceY?: number) {
      if (useStore.getState().debugFlags.panelGodMode) return;
      useGameStore.getState().damagePanel(id, amount, silent, sourceX, sourceY);
  }

  public healPanel(id: PanelId, amount: number, sourceX?: number) {
      useGameStore.getState().healPanel(id, amount, sourceX);
  }
  
  public decayPanel(id: PanelId, amount: number) {
      useGameStore.getState().decayPanel(id, amount);
  }

  public destroyAll() { 
      useGameStore.getState().destroyAllPanels();
  }

  public getPanelRect(id: PanelId): WorldRect | undefined {
      const entity = this.entityMap.get(id);
      if (entity) {
          const t = entity.getComponent<TransformData>(ComponentType.Transform);
          const c = entity.getComponent<ColliderData>(ComponentType.Collider);
          if (t && c) {
              const halfW = c.width / 2;
              const halfH = c.height / 2;
              return {
                  id,
                  x: t.x, y: t.y,
                  width: c.width, height: c.height,
                  left: t.x - halfW, right: t.x + halfW,
                  top: t.y + halfH, bottom: t.y - halfH
              };
          }
      }
      return undefined;
  }

  public getPanelState(id: PanelId) {
      const panel = useGameStore.getState().panels[id];
      if (!panel) return undefined;
      return { health: panel.health, isDestroyed: panel.isDestroyed };
  }
  
  public getAllPanels() {
      const results = [];
      const state = useGameStore.getState();
      
      for(const [id, entity] of this.entityMap) {
          const pid = id as PanelId;
          const rect = this.getPanelRect(pid);
          const panel = state.panels[pid];
          if (rect && panel) {
              results.push({ ...rect, health: panel.health, isDestroyed: panel.isDestroyed });
          }
      }
      return results;
  }
}

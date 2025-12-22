import { IPanelSystem, IGameEventService, IAudioService, DamageOptions } from '@/engine/interfaces';
import { GameEvents } from '@/engine/signals/GameEvents';
import { WorldRect, ViewportHelper } from '@/engine/math/ViewportHelper';
import { useGameStore } from '@/engine/state/game/useGameStore';
import { useStore } from '@/engine/state/global/useStore';
import { ServiceLocator } from '@/engine/services/ServiceLocator';
import { Entity } from '@/engine/ecs/Entity';
import { Tag } from '@/engine/ecs/types';
import { ComponentRegistry } from '@/engine/ecs/ComponentRegistry';
import { ComponentType } from '@/engine/ecs/ComponentType';
import { CollisionLayers } from '@/engine/config/PhysicsConfig';
import { TransformData } from '@/engine/ecs/components/TransformData';
import { ColliderData } from '@/engine/ecs/components/ColliderData';
import { PanelId } from '@/engine/config/PanelConfig';

interface PanelRuntime {
  id: PanelId;
  element: HTMLElement;
  entityId: number;
  stress: number; 
}

export class PanelRegistrySystem implements IPanelSystem {
  private entityMap = new Map<string, Entity>();
  private observer: ResizeObserver | null = null;
  private elements = new Map<string, HTMLElement>();
  private rectCache = new Map<PanelId, WorldRect>();
  private stressMap = new Map<PanelId, number>();
  private unsubs: (() => void)[] = [];

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

    this.unsubs.push(this.events.subscribe(GameEvents.PANEL_DAMAGED, (p) => {
        const current = this.stressMap.get(p.id) || 0;
        this.stressMap.set(p.id, Math.min(3.0, current + 0.5));
    }));

    this.unsubs.push(this.events.subscribe(GameEvents.UPGRADE_SELECTED, (p) => {
        if (p.option === 'RESTORE') {
            const restoredCount = useGameStore.getState().restoreAllPanels();
            if (restoredCount > 0) {
                this.events.emit(GameEvents.TRAUMA_ADDED, { amount: 0.3 }); 
                this.audio.playSound('fx_reboot_success'); 
            }
        }
    }));

    this.unsubs.push(this.events.subscribe(GameEvents.ZEN_MODE_ENABLED, () => {
        this.destroyAll();
    }));
  }

  update(delta: number, time: number): void {
      for (const [id, stress] of this.stressMap.entries()) {
          if (stress > 0) {
              this.stressMap.set(id, Math.max(0, stress * 0.9));
          }
      }
  }

  public getPanelStress(id: PanelId): number {
      return this.stressMap.get(id) || 0;
  }

  teardown(): void {
      this.unsubs.forEach(u => u());
      this.unsubs = [];
      this.observer?.disconnect();
      this.entityMap.clear();
      this.elements.clear();
      this.rectCache.clear();
      this.stressMap.clear();
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
      this.rectCache.delete(id);
      this.stressMap.delete(id);
      
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
      if (!el) return;

      const fullRect = el.getBoundingClientRect();
      const worldRect = ViewportHelper.domToWorld(id, fullRect);
      
      this.rectCache.set(id, worldRect);

      if (entity) {
          const transform = entity.getComponent<TransformData>(ComponentType.Transform);
          const collider = entity.getComponent<ColliderData>(ComponentType.Collider);

          if (transform && collider) {
              transform.x = worldRect.x;
              transform.y = worldRect.y;
              collider.width = worldRect.width;
              collider.height = worldRect.height;
          }
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

  public damagePanel(id: PanelId, amount: number, options?: DamageOptions) {
      if (useStore.getState().debugFlags.panelGodMode) return;
      useGameStore.getState().damagePanel(id, amount, options);
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
      return this.rectCache.get(id);
  }

  public getPanelState(id: PanelId) {
      const panel = useGameStore.getState().panels[id];
      if (!panel) return undefined;
      return { health: panel.health, isDestroyed: panel.isDestroyed };
  }
  
  public getAllPanels() {
      const results = [];
      const state = useGameStore.getState();
      
      for(const [id, rect] of this.rectCache) {
          const pid = id as PanelId;
          const panel = state.panels[pid];
          if (panel) {
              results.push({ ...rect, health: panel.health, isDestroyed: panel.isDestroyed });
          }
      }
      return results;
  }

  public getPanelAt(x: number, y: number): PanelId | null {
      for (const [id, rect] of this.rectCache) {
          if (x >= rect.left && x <= rect.right && y >= rect.bottom && y <= rect.top) {
              return id;
          }
      }
      return null;
  }
}

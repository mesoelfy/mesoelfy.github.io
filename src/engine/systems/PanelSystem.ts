import { IPanelSystem, IGameEventService, IAudioService, DamageOptions } from '@/engine/interfaces';
import { GameEvents } from '@/engine/signals/GameEvents';
import { WorldRect, ViewportHelper } from '@/engine/math/ViewportHelper';
import { useGameStore } from '@/engine/state/game/useGameStore';
import { useStore } from '@/engine/state/global/useStore';
import { ServiceLocator } from '@/engine/services/ServiceLocator';
import { ComponentRegistry } from '@/engine/ecs/ComponentRegistry';
import { ComponentType } from '@/engine/ecs/ComponentType';
import { CollisionLayers } from '@/engine/config/PhysicsConfig';
import { TransformData } from '@/engine/ecs/components/TransformData';
import { ColliderData } from '@/engine/ecs/components/ColliderData';
import { Tag } from '@/engine/ecs/types';
import { PanelId } from '@/engine/config/PanelConfig';
import { DOM_ID } from '@/ui/config/DOMConfig';

interface PanelRuntime {
  id: PanelId;
  element: HTMLElement;
  entityId: number;
  stress: number; 
}

export class PanelSystem implements IPanelSystem {
  private panels = new Map<PanelId, PanelRuntime>();
  private resizeObserver: ResizeObserver;
  private mutationObserver: MutationObserver;
  private rectCache = new Map<PanelId, WorldRect>();

  constructor(
    private events: IGameEventService,
    private audio: IAudioService
  ) {
    this.resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const id = (entry.target as HTMLElement).getAttribute('data-panel-id') as PanelId;
        if (id && this.panels.has(id)) {
          this.syncEntity(id);
        }
      }
    });

    this.mutationObserver = new MutationObserver(() => this.scanDOM());

    this.events.subscribe(GameEvents.PANEL_DAMAGED, (p) => {
       const panel = this.panels.get(p.id);
       if (panel) panel.stress = Math.min(3.0, panel.stress + 0.5);
    });

    this.events.subscribe(GameEvents.UPGRADE_SELECTED, (p) => {
        if (p.option === 'RESTORE') {
            const count = useGameStore.getState().restoreAllPanels();
            if (count > 0) {
                this.events.emit(GameEvents.TRAUMA_ADDED, { amount: 0.3 }); 
                this.audio.playSound('fx_reboot_success'); 
            }
        }
    });

    this.events.subscribe(GameEvents.ZEN_MODE_ENABLED, () => this.destroyAll());
    
    setTimeout(() => this.scanDOM(), 100);
  }

  public get systemIntegrity() {
      return useGameStore.getState().systemIntegrity;
  }

  update(delta: number, time: number): void {
    for (const panel of this.panels.values()) {
        if (panel.stress > 0.01) {
            panel.stress *= 0.9; 
            if (panel.stress < 0.01) panel.stress = 0;

            const shake = panel.stress * 2.0;
            const jx = (Math.random() - 0.5) * shake;
            const jy = (Math.random() - 0.5) * shake;
            
            panel.element.style.transform = `translate3d(${jx.toFixed(1)}px, ${jy.toFixed(1)}px, 0)`;
        } else if (panel.element.style.transform !== '') {
            panel.element.style.transform = '';
        }
    }
  }

  private scanDOM() {
    const root = document.getElementById(DOM_ID.APP_ROOT);
    if (!root) return;

    this.mutationObserver.disconnect();
    this.mutationObserver.observe(root, { childList: true, subtree: true });

    const nodes = document.querySelectorAll('[data-panel-id]');
    const foundIds = new Set<string>();

    nodes.forEach((node) => {
        const el = node as HTMLElement;
        const id = el.getAttribute('data-panel-id') as PanelId;
        foundIds.add(id);

        if (!this.panels.has(id)) {
            this.register(id, el);
        }
    });

    for (const id of this.panels.keys()) {
        if (!foundIds.has(id)) {
            this.unregister(id);
        }
    }
  }

  public register(id: PanelId, element: HTMLElement) {
      if (this.panels.has(id)) return;

      const registry = ServiceLocator.getRegistry();
      const entity = registry.createEntity();
      entity.addTag(Tag.OBSTACLE); 
      
      entity.addComponent(ComponentRegistry.create(ComponentType.Transform));
      entity.addComponent(ComponentRegistry.create(ComponentType.Identity, { variant: id })); 
      entity.addComponent(ComponentRegistry.create(ComponentType.Collider, {
          shape: 'BOX', layer: CollisionLayers.PANEL, mask: 0 
      }));

      this.panels.set(id, { id, element, entityId: entity.id as number, stress: 0 });
      this.resizeObserver.observe(element);
      
      registry.updateCache(entity);
      useGameStore.getState().registerPanel(id, element);
      this.syncEntity(id);
  }

  public unregister(id: PanelId) {
      const p = this.panels.get(id);
      if (!p) return;

      this.resizeObserver.unobserve(p.element);
      ServiceLocator.getRegistry().destroyEntity(p.entityId);
      this.panels.delete(id);
      this.rectCache.delete(id);
      useGameStore.getState().unregisterPanel(id);
  }

  private syncEntity(id: PanelId) {
      const p = this.panels.get(id);
      if (!p) return;

      const rect = p.element.getBoundingClientRect();
      const worldRect = ViewportHelper.domToWorld(id, rect);
      this.rectCache.set(id, worldRect);

      const entity = ServiceLocator.getRegistry().getEntity(p.entityId);
      if (entity) {
          const t = entity.getComponent<TransformData>(ComponentType.Transform);
          const c = entity.getComponent<ColliderData>(ComponentType.Collider);
          if (t && c) {
              t.x = worldRect.x;
              t.y = worldRect.y;
              c.width = worldRect.width;
              c.height = worldRect.height;
          }
      }
  }

  public refreshAll() { this.scanDOM(); }
  public refreshSingle(id: PanelId) { this.syncEntity(id); }

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
          if (panel) results.push({ ...rect, health: panel.health, isDestroyed: panel.isDestroyed });
      }
      return results;
  }

  public getPanelAt(x: number, y: number): PanelId | null {
      for (const [id, rect] of this.rectCache) {
          if (x >= rect.left && x <= rect.right && y >= rect.bottom && y <= rect.top) return id;
      }
      return null;
  }

  teardown(): void {
      this.resizeObserver.disconnect();
      this.mutationObserver.disconnect();
      this.panels.clear();
      this.rectCache.clear();
  }
}

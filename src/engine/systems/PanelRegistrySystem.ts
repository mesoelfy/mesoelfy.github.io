import { IPanelSystem, IGameEventService, IAudioService, IEntityRegistry, DamageOptions } from '@/engine/interfaces';
import { GameEvents } from '@/engine/signals/GameEvents';
import { WorldRect, ViewportHelper } from '@/engine/math/ViewportHelper';
import { Entity } from '@/engine/ecs/Entity';
import { Tag } from '@/engine/ecs/types';
import { ComponentRegistry } from '@/engine/ecs/ComponentRegistry';
import { ComponentType } from '@/engine/ecs/ComponentType';
import { CollisionLayers } from '@/engine/config/PhysicsConfig';
import { TransformData } from '@/engine/ecs/components/TransformData';
import { ColliderData } from '@/engine/ecs/components/ColliderData';
import { PanelId } from '@/engine/config/PanelConfig';
import { GameStream, StreamKey } from '@/engine/state/GameStream';

export class PanelRegistrySystem implements IPanelSystem {
  private entityMap = new Map<string, Entity>();
  private observer: ResizeObserver | null = null;
  private elements = new Map<string, HTMLElement>();
  private rectCache = new Map<PanelId, WorldRect>();
  private stressMap = new Map<PanelId, number>();
  
  private unsubs: (() => void)[] = [];
  private panelGodMode = false;

  public get systemIntegrity() {
      return GameStream.get('SYSTEM_INTEGRITY');
  }

  constructor(
    private events: IGameEventService,
    private audio: IAudioService,
    private registry: IEntityRegistry
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

    this.unsubs.push(this.events.subscribe(GameEvents.GLOBAL_STATE_SYNC, (p) => {
        this.panelGodMode = p.debugFlags.panelGodMode;
    }));

    // Only apply physical shake stress on damage. Health state is now handled by GameStream!
    this.unsubs.push(this.events.subscribe(GameEvents.PANEL_DAMAGED, (p) => {
        const current = this.stressMap.get(p.id) || 0;
        this.stressMap.set(p.id, Math.min(4.0, current + 0.4));
    }));

    this.unsubs.push(this.events.subscribe(GameEvents.ZEN_MODE_ENABLED, () => {
        this.destroyAll();
    }));
  }

  update(delta: number, time: number): void {
      for (const [id, stress] of this.stressMap.entries()) {
          const el = this.elements.get(id as string);
          if (stress > 0.01) {
              const decayFactor = Math.pow(0.9, delta * 60);
              const newStress = stress * decayFactor;
              this.stressMap.set(id, newStress);

              if (el) {
                  const shake = newStress * 2.0; 
                  const jx = (Math.random() - 0.5) * shake;
                  const jy = (Math.random() - 0.5) * shake;
                  el.style.transform = `translate3d(${jx.toFixed(1)}px, ${jy.toFixed(1)}px, 0)`;
              }
          } else {
              if (stress !== 0) this.stressMap.set(id, 0);
              if (el && el.style.transform !== '') el.style.transform = '';
          }
      }
  }

  public getPanelStress(id: PanelId): number { return this.stressMap.get(id) || 0; }

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
      this.events.emit(GameEvents.CMD_REGISTER_PANEL, { id, element });
      this.observer?.observe(element);
      
      const entity = this.registry.createEntity();
      entity.addTag(Tag.OBSTACLE); 
      entity.addComponent(ComponentRegistry.create(ComponentType.Transform));
      entity.addComponent(ComponentRegistry.create(ComponentType.Identity, { variant: id })); 
      entity.addComponent(ComponentRegistry.create(ComponentType.Collider, { shape: 'BOX', layer: CollisionLayers.PANEL, mask: 0 }));

      this.entityMap.set(id, entity);
      this.registry.updateCache(entity);
      this.syncEntity(id, element.getBoundingClientRect());
  }

  public unregister(id: PanelId) {
      const el = this.elements.get(id);
      if (el) this.observer?.unobserve(el);
      this.elements.delete(id);
      this.rectCache.delete(id);
      this.stressMap.delete(id);
      
      this.events.emit(GameEvents.CMD_UNREGISTER_PANEL, { id });

      const entity = this.entityMap.get(id);
      if (entity) {
          this.registry.destroyEntity(entity.id as number);
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
      for (const [id, el] of this.elements) this.syncEntity(id as PanelId, el.getBoundingClientRect());
  }
  
  public refreshSingle(id: PanelId) { 
      const el = this.elements.get(id);
      if (el) this.syncEntity(id, el.getBoundingClientRect());
  }

  public damagePanel(id: PanelId, amount: number, options?: DamageOptions) {
      if (this.panelGodMode) return;
      this.events.emit(GameEvents.CMD_DAMAGE_PANEL, { id, amount, options });
  }

  public healPanel(id: PanelId, amount: number, sourceX?: number) {
      this.events.emit(GameEvents.CMD_HEAL_PANEL, { id, amount, sourceX });
  }
  
  public decayPanel(id: PanelId, amount: number) {
      this.events.emit(GameEvents.CMD_DECAY_PANEL, { id, amount });
  }

  public destroyAll() { 
      this.events.emit(GameEvents.CMD_DESTROY_ALL_PANELS, null);
  }

  public getPanelRect(id: PanelId): WorldRect | undefined { return this.rectCache.get(id); }

  public getPanelState(id: PanelId) { 
      const health = GameStream.get(`PANEL_HEALTH_${id.toUpperCase()}` as StreamKey);
      const isDead = GameStream.get(`PANEL_DEAD_${id.toUpperCase()}` as StreamKey) === 1;
      return { health, isDestroyed: isDead };
  }
  
  public getAllPanels() {
      const results = [];
      for(const [id, rect] of this.rectCache) {
          const pid = id as PanelId;
          const health = GameStream.get(`PANEL_HEALTH_${pid.toUpperCase()}` as StreamKey);
          const isDead = GameStream.get(`PANEL_DEAD_${pid.toUpperCase()}` as StreamKey) === 1;
          results.push({ ...rect, id: pid, health: health, isDestroyed: isDead });
      }
      return results;
  }

  public getPanelAt(x: number, y: number): PanelId | null {
      for (const [id, rect] of this.rectCache) {
          if (x >= rect.left && x <= rect.right && y >= rect.bottom && y <= rect.top) return id;
      }
      return null;
  }
}

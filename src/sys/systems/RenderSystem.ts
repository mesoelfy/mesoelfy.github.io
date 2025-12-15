import { IGameSystem, IServiceLocator, IEntityRegistry } from '@/engine/interfaces';
import { RenderData } from '@/sys/data/RenderData';
import { ComponentType } from '@/engine/ecs/ComponentType';
import { GameEventBus } from '@/engine/signals/GameEventBus';
import { GameEvents } from '@/engine/signals/GameEvents';

export class RenderSystem implements IGameSystem {
  private registry!: IEntityRegistry;
  private readonly FLASH_DECAY = 5.0; // Speed of color recovery

  setup(locator: IServiceLocator): void {
    this.registry = locator.getRegistry();
    
    // Listen for damage to trigger flashes
    GameEventBus.subscribe(GameEvents.ENEMY_DAMAGED, (p) => {
        const entity = this.registry.getEntity(p.id);
        if (entity) {
            const render = entity.getComponent<RenderData>(ComponentType.Render);
            if (render) {
                // Flash White
                render.r = 2.0; // Overdrive for bloom
                render.g = 2.0;
                render.b = 2.0;
            }
        }
    });
  }

  update(delta: number, time: number): void {
    const renderables = this.registry.query({ all: [ComponentType.Render] });

    for (const entity of renderables) {
        if (!entity.active) continue;
        const render = entity.getComponent<RenderData>(ComponentType.Render);
        if (!render) continue;

        // Color Decay Logic (Return to Base)
        if (render.r > render.baseR || render.g > render.baseG || render.b > render.baseB) {
            render.r = this.lerp(render.r, render.baseR, delta * this.FLASH_DECAY);
            render.g = this.lerp(render.g, render.baseG, delta * this.FLASH_DECAY);
            render.b = this.lerp(render.b, render.baseB, delta * this.FLASH_DECAY);
        }
    }
  }

  private lerp(start: number, end: number, t: number) {
      return start * (1 - t) + end * t;
  }

  teardown(): void {}
}

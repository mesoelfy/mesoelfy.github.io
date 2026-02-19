import { IGameSystem, IEntityRegistry } from '@/engine/interfaces';
import { ComponentType } from '@/engine/ecs/ComponentType';
import { RenderTransform } from '@/engine/ecs/components/RenderTransform';
import { RenderEffect } from '@/engine/ecs/components/RenderEffect';
import { VISUAL_CONFIG } from '@/engine/config/VisualConfig';
import { Query } from '@/engine/ecs/Query';

function easeOutElastic(t: number): number {
  const c4 = (2 * Math.PI) / 3;
  if (t === 0) return 0;
  if (t === 1) return 1;
  return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
}

export class AnimationSystem implements IGameSystem {
  private animationQuery = new Query({ 
      all: [ComponentType.RenderTransform] 
  });

  constructor(private registry: IEntityRegistry) {}

  update(delta: number, time: number): void {
    const SPAWN_CFG = VISUAL_CONFIG.SPAWN;
    const entities = this.registry.query(this.animationQuery);

    for (const entity of entities) {
      if (!entity.active) continue;

      const render = entity.getComponent<RenderTransform>(ComponentType.RenderTransform);
      const effect = entity.getComponent<RenderEffect>(ComponentType.RenderEffect); 

      if (!render) continue;

      let dX = 1.0, dY = 1.0, dZ = 1.0;

      if (effect) {
          if (effect.spawnProgress < 1.0) {
              const t = effect.spawnProgress;
              const scaleCurve = easeOutElastic(t);
              dX *= scaleCurve; dY *= scaleCurve; dZ *= scaleCurve;
              const riseT = t * (2 - t); 
              render.offsetY = SPAWN_CFG.Y_OFFSET * (1.0 - riseT);
          } else {
              render.offsetY = 0;
          }

          if (effect.flash > 0) {
              const bump = effect.flash * 0.25;
              dX += bump; dY += bump; dZ += bump;
          }
          if (effect.pulseSpeed > 0) {
              const pulse = Math.sin(time * effect.pulseSpeed) * 0.2;
              dX += pulse; dY += pulse; dZ += pulse;
          }

          if (effect.spawnProgress >= 1.0 && effect.squashFactor > 0.01) {
              const compression = 0.4 * effect.squashFactor; 
              const expansion = 0.8 * effect.squashFactor;   
              dY *= (1.0 - compression); 
              dX *= (1.0 + expansion);   
              dZ *= (1.0 + expansion);   
          }
      }

      render.dynamicScaleX = dX;
      render.dynamicScaleY = dY;
      render.dynamicScaleZ = dZ;
    }
  }

  teardown(): void {}
}

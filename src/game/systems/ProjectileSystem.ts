import { IGameSystem, IServiceLocator, IEntityRegistry } from '@/core/interfaces';
import { ComponentType } from '@/core/ecs/ComponentType';
import { ProjectileData } from '@/game/data/ProjectileData';
import { TransformData } from '@/game/data/TransformData';
import { MotionData } from '@/game/data/MotionData';
import { RenderData } from '@/game/data/RenderData';
import { PROJECTILE_CONFIG } from '@/game/config/ProjectileConfig';

export class ProjectileSystem implements IGameSystem {
  private registry!: IEntityRegistry;

  setup(locator: IServiceLocator): void {
    this.registry = locator.getRegistry();
  }

  update(delta: number, time: number): void {
    const entities = this.registry.query({ all: [ComponentType.Projectile, ComponentType.Transform] });

    for (const entity of entities) {
        if (!entity.active) continue;

        const proj = entity.getComponent<ProjectileData>(ComponentType.Projectile);
        const transform = entity.getComponent<TransformData>(ComponentType.Transform);
        const render = entity.getComponent<RenderData>(ComponentType.Render);
        const motion = entity.getComponent<MotionData>(ComponentType.Motion);
        
        if (!proj || !transform) continue;

        const config = PROJECTILE_CONFIG[proj.configId];
        if (!config) continue;

        // --- STATE: CHARGING (Stuck to Owner) ---
        if (proj.state === 'CHARGING' && proj.ownerId !== -1) {
            const owner = this.registry.getEntity(proj.ownerId);
            
            if (!owner || !owner.active) {
                this.registry.destroyEntity(entity.id);
                continue;
            }

            const ownerTransform = owner.getComponent<TransformData>(ComponentType.Transform);
            if (ownerTransform) {
                const offsetDist = 1.6; 
                
                const cos = Math.cos(ownerTransform.rotation);
                const sin = Math.sin(ownerTransform.rotation);
                
                transform.x = ownerTransform.x + (cos * offsetDist);
                transform.y = ownerTransform.y + (sin * offsetDist);
                transform.rotation = ownerTransform.rotation;
                
                if (motion) {
                    motion.vx = 0;
                    motion.vy = 0;
                }
            }
        }
        
        // --- STATE: FLIGHT (Visual Physics) ---
        else if (proj.state === 'FLIGHT' && render) {
            // Apply Spin
            if (!config.faceVelocity && config.spinSpeed !== 0) {
                render.visualRotation += delta * config.spinSpeed;
            }

            // Apply Pulse
            if (config.pulseSpeed > 0) {
                render.visualScale = 1.0 + Math.sin(time * config.pulseSpeed) * 0.2;
            }
        }
    }
  }

  teardown(): void {}
}

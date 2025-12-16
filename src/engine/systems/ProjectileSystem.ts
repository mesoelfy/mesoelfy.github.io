import { IGameSystem, IEntityRegistry } from '@/engine/interfaces';
import { ComponentType } from '@/engine/ecs/ComponentType';
import { ProjectileData } from '@/engine/ecs/components/ProjectileData';
import { TransformData } from '@/engine/ecs/components/TransformData';
import { MotionData } from '@/engine/ecs/components/MotionData';
import { RenderData } from '@/engine/ecs/components/RenderData';
import { PROJECTILE_CONFIG } from '@/engine/config/ProjectileConfig';

export class ProjectileSystem implements IGameSystem {
  constructor(private registry: IEntityRegistry) {}

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

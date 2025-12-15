import { IGameSystem, IServiceLocator, IEntityRegistry } from '@/engine/interfaces';
import { ComponentType } from '@/engine/ecs/ComponentType';
import { OrdnanceData } from '@/sys/data/OrdnanceData';
import { TransformData } from '@/sys/data/TransformData';
import { MotionData } from '@/sys/data/MotionData';
import { RenderData } from '@/sys/data/RenderData';

export class OrdnanceSystem implements IGameSystem {
  private registry!: IEntityRegistry;

  setup(locator: IServiceLocator): void {
    this.registry = locator.getRegistry();
  }

  update(delta: number, time: number): void {
    const entities = this.registry.query({ all: [ComponentType.Ordnance, ComponentType.Transform] });

    for (const entity of entities) {
        if (!entity.active) continue;

        const ordnance = entity.getComponent<OrdnanceData>(ComponentType.Ordnance);
        const transform = entity.getComponent<TransformData>(ComponentType.Transform);
        const render = entity.getComponent<RenderData>(ComponentType.Render);
        
        if (!ordnance || !transform) continue;

        // --- STATE: CHARGING (Stuck to Gun) ---
        if (ordnance.state === 'CHARGING' && ordnance.ownerId !== -1) {
            const owner = this.registry.getEntity(ordnance.ownerId);
            
            if (!owner || !owner.active) {
                this.registry.destroyEntity(entity.id);
                continue;
            }

            const ownerTransform = owner.getComponent<TransformData>(ComponentType.Transform);
            if (ownerTransform) {
                // Offset logic matches Hunter/Daemon visual design
                const offsetDist = 1.6; 
                
                const cos = Math.cos(ownerTransform.rotation);
                const sin = Math.sin(ownerTransform.rotation);
                
                transform.x = ownerTransform.x + (cos * offsetDist);
                transform.y = ownerTransform.y + (sin * offsetDist);
                transform.rotation = ownerTransform.rotation;
                
                const motion = entity.getComponent<MotionData>(ComponentType.Motion);
                if (motion) {
                    motion.vx = 0;
                    motion.vy = 0;
                }
            }
        }
        
        // --- STATE: FLIGHT (Visual Physics) ---
        else if (ordnance.state === 'FLIGHT' && render) {
            // SHARD (Enemy) -> Spin around Z axis relative to travel
            // ORB (Charge shot) -> Slow rotation
            // PLASMA (Player) -> Stable
            
            if (ordnance.type === 'SHARD') {
                render.visualRotation += delta * 15.0; // Fast Sawblade Spin
            } else if (ordnance.type === 'ORB') {
                render.visualRotation += delta * 2.0;
            }
        }
    }
  }

  teardown(): void {}
}

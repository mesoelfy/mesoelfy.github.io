import { IGameSystem, IServiceLocator } from '../core/interfaces';
import { EntityRegistry } from '../core/ecs/EntityRegistry';
import { TransformComponent } from '../components/data/TransformComponent';
import { OrbitalComponent } from '../components/data/OrbitalComponent';
import { Tag } from '../core/ecs/types';

export class OrbitalSystem implements IGameSystem {
  private registry!: EntityRegistry;

  setup(locator: IServiceLocator): void {
    this.registry = locator.getRegistry() as EntityRegistry;
  }

  update(delta: number, time: number): void {
    const orbitals = this.registry.getAll(); // Filter by component in loop for speed or tag?
    // Optimization: In a real ECS we'd query by component. Here we iterate.
    
    // Find Player Cache (Parent)
    const players = this.registry.getByTag(Tag.PLAYER);
    if (players.length === 0) return;
    const player = players[0];
    const pPos = player.getComponent<TransformComponent>('Transform');
    if (!pPos) return;

    for (const entity of orbitals) {
        if (!entity.active) continue;
        
        const orb = entity.getComponent<OrbitalComponent>('Orbital');
        const transform = entity.getComponent<TransformComponent>('Transform');

        if (!orb || !transform) continue;

        // Update Angle
        if (orb.active) {
            orb.angle += orb.speed * delta;
        }

        // Update Position (Parent Pos + Orbit Offset)
        transform.x = pPos.x + Math.cos(orb.angle) * orb.radius;
        transform.y = pPos.y + Math.sin(orb.angle) * orb.radius;
        
        // Rotate self to look outward (tangent) or just spin?
        // Let's spin the mesh in the renderer, keep physics rotation simple.
    }
  }

  teardown(): void {}
}

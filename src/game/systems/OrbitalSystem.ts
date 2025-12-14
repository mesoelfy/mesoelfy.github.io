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
    const orbitals = this.registry.getAll();
    
    // OPTIMIZATION FIX: getByTag returns Iterable, not Array.
    // Use iterator to get the first player efficiently.
    let player = null;
    const players = this.registry.getByTag(Tag.PLAYER);
    for (const p of players) {
        player = p;
        break; // Just get the first one
    }

    if (!player) return;
    
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
    }
  }

  teardown(): void {}
}

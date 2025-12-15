import { IGameSystem, IServiceLocator } from '@/engine/interfaces';
import { EntityRegistry } from '@/engine/ecs/EntityRegistry';
import { TransformData } from '@/sys/data/TransformData';
import { OrbitalData } from '@/sys/data/OrbitalData';
import { Tag } from '@/engine/ecs/types';
import { ComponentType } from '@/engine/ecs/ComponentType';

export class OrbitalSystem implements IGameSystem {
  private registry!: EntityRegistry;

  setup(locator: IServiceLocator): void {
    this.registry = locator.getRegistry() as EntityRegistry;
  }

  update(delta: number, time: number): void {
    const orbitals = this.registry.getAll();
    let player = null;
    const players = this.registry.getByTag(Tag.PLAYER);
    for (const p of players) {
        player = p;
        break; 
    }

    if (!player) return;
    
    const pPos = player.getComponent<TransformData>(ComponentType.Transform);
    if (!pPos) return;

    for (const entity of orbitals) {
        if (!entity.active) continue;
        
        const orb = entity.getComponent<OrbitalData>(ComponentType.Orbital);
        const transform = entity.getComponent<TransformData>(ComponentType.Transform);

        if (!orb || !transform) continue;

        if (orb.active) {
            orb.angle += orb.speed * delta;
        }

        transform.x = pPos.x + Math.cos(orb.angle) * orb.radius;
        transform.y = pPos.y + Math.sin(orb.angle) * orb.radius;
    }
  }

  teardown(): void {}
}

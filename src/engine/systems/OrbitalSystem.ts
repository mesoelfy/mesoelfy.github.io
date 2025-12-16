import { IGameSystem, IEntityRegistry } from '@/engine/interfaces';
import { TransformData } from '@/engine/ecs/components/TransformData';
import { OrbitalData } from '@/engine/ecs/components/OrbitalData';
import { Tag } from '@/engine/ecs/types';
import { ComponentType } from '@/engine/ecs/ComponentType';

export class OrbitalSystem implements IGameSystem {
  constructor(private registry: IEntityRegistry) {}

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

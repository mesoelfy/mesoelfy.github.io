import { IGameSystem, IInputService, IEntityRegistry, IInteractionSystem, IVitalsRead } from '@/engine/interfaces';
import { Tag } from '@/engine/ecs/types';
import { TransformData } from '@/engine/ecs/components/TransformData';
import { AIStateData } from '@/engine/ecs/components/AIStateData';
import { ComponentType } from '@/engine/ecs/ComponentType';

export class PlayerMovementSystem implements IGameSystem {
  constructor(
    private input: IInputService,
    private registry: IEntityRegistry,
    private interaction: IInteractionSystem,
    private vitals: IVitalsRead
  ) {}

  update(delta: number, time: number): void {
    let playerEntity = null;
    for (const p of this.registry.getByTag(Tag.PLAYER)) { playerEntity = p; break; }
    if (!playerEntity) return;

    const transform = playerEntity.getComponent<TransformData>(ComponentType.Transform);
    const cursor = this.input.getCursor();
    
    if (transform) { 
        transform.x = cursor.x; 
        transform.y = cursor.y; 
    }

    if (this.vitals.isGameOver || this.vitals.playerHealth <= 0) return;

    const stateComp = playerEntity.getComponent<AIStateData>(ComponentType.State);
    if (stateComp) {
        stateComp.current = this.interaction.repairState !== 'IDLE' ? 'REBOOTING' : 'ACTIVE';
    }
  }

  teardown(): void {}
}

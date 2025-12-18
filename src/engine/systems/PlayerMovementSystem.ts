import { IGameSystem, IInputService, IEntityRegistry, IInteractionSystem, IGameStateSystem } from '@/engine/interfaces';
import { Tag } from '@/engine/ecs/types';
import { TransformData } from '@/engine/ecs/components/TransformData';
import { AIStateData } from '@/engine/ecs/components/AIStateData';
import { ComponentType } from '@/engine/ecs/ComponentType';

export class PlayerMovementSystem implements IGameSystem {
  constructor(
    private input: IInputService,
    private registry: IEntityRegistry,
    private interaction: IInteractionSystem,
    private gameSystem: IGameStateSystem
  ) {}

  update(delta: number, time: number): void {
    let playerEntity = null;
    for (const p of this.registry.getByTag(Tag.PLAYER)) { playerEntity = p; break; }
    if (!playerEntity) return;

    const transform = playerEntity.getComponent<TransformData>(ComponentType.Transform);
    const cursor = this.input.getCursor();
    
    // 1. Position Sync
    if (transform) { 
        transform.x = cursor.x; 
        transform.y = cursor.y; 
    }

    if (this.gameSystem.isGameOver || this.gameSystem.playerHealth <= 0) return;

    // 2. Logic State Sync
    const stateComp = playerEntity.getComponent<AIStateData>(ComponentType.State);
    if (stateComp) {
        stateComp.current = this.interaction.repairState !== 'IDLE' ? 'REBOOTING' : 'ACTIVE';
    }
  }

  teardown(): void {}
}

import { EnemyLogic } from './types';

class AIRegistryController {
  private behaviors = new Map<string, EnemyLogic>();

  public register(id: string, logic: EnemyLogic) {
    if (this.behaviors.has(id)) {
        console.warn(`[AIRegistry] Overwriting behavior for ${id}`);
    }
    this.behaviors.set(id, logic);
  }

  public get(id: string): EnemyLogic | undefined {
    return this.behaviors.get(id);
  }
}

export const AIRegistry = new AIRegistryController();

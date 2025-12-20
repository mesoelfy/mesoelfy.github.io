import { EnemyLogic } from './types';

class AIRegistryController {
  private behaviors = new Map<string, EnemyLogic>();

  public register(id: string, logic: EnemyLogic) {
    // Overwriting is allowed (needed for HMR/React Strict Mode)
    this.behaviors.set(id, logic);
  }

  public get(id: string): EnemyLogic | undefined {
    return this.behaviors.get(id);
  }

  public clear() {
    this.behaviors.clear();
  }
}

export const AIRegistry = new AIRegistryController();

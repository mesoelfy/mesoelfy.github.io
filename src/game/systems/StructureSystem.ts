import { IGameSystem, IServiceLocator } from '../core/interfaces';
import { PanelRegistry } from './PanelRegistrySystem';

export class StructureSystem implements IGameSystem {
  private decayTimer = 0;
  // Decay logic runs at 10hz (every 0.1s)
  private readonly DECAY_INTERVAL = 0.1; 
  // FIXED: 1 HP per 0.1s = 10 DPS decay (10s to lose full bar)
  private readonly DECAY_AMOUNT = 1; 

  setup(locator: IServiceLocator): void {
    // No dependencies needed yet
  }

  update(delta: number, time: number): void {
    this.decayTimer += delta;
    
    if (this.decayTimer >= this.DECAY_INTERVAL) {
        this.processDecay();
        this.decayTimer = 0;
    }
  }

  private processDecay() {
      // Passive Rule: Destroyed panels lose residual charge (Health) over time
      const panels = PanelRegistry.getAllPanels();
      for (const p of panels) {
          if (p.isDestroyed && p.health > 0) {
               PanelRegistry.decayPanel(p.id, this.DECAY_AMOUNT);
          }
      }
  }

  teardown(): void {}
}

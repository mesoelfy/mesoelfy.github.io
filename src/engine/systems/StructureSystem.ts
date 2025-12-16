import { IGameSystem, IPanelSystem } from '@/engine/interfaces';

export class StructureSystem implements IGameSystem {
  private decayTimer = 0;
  private readonly DECAY_INTERVAL = 0.1; 
  private readonly DECAY_AMOUNT = 2; 

  constructor(private panelSystem: IPanelSystem) {}

  update(delta: number, time: number): void {
    this.decayTimer += delta;
    
    if (this.decayTimer >= this.DECAY_INTERVAL) {
        this.processDecay();
        this.decayTimer = 0;
    }
  }

  private processDecay() {
      const panels = this.panelSystem.getAllPanels();
      for (const p of panels) {
          if (p.isDestroyed && p.health > 0) {
               this.panelSystem.decayPanel(p.id, this.DECAY_AMOUNT);
          }
      }
  }

  teardown(): void {}
}

import { IGameSystem, IServiceLocator, IPanelSystem } from '@/core/interfaces';

export class StructureSystem implements IGameSystem {
  private panelSystem!: IPanelSystem;
  private decayTimer = 0;
  private readonly DECAY_INTERVAL = 0.1; 
  private readonly DECAY_AMOUNT = 2; 

  setup(locator: IServiceLocator): void {
    this.panelSystem = locator.getSystem<IPanelSystem>('PanelRegistrySystem');
  }

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

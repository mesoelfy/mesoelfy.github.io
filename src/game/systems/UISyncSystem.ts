import { IGameSystem, IServiceLocator } from '../core/interfaces';
import { useGameStore } from '../store/useGameStore';
import { GameStateSystem } from './GameStateSystem';
import { PanelRegistry } from './PanelRegistrySystem';
import { InteractionSystem } from './InteractionSystem';

export class UISyncSystem implements IGameSystem {
  private gameSystem!: GameStateSystem;
  private interactionSystem!: InteractionSystem;
  
  private readonly SYNC_INTERVAL = 0.1;
  private timeSinceLastSync = 0;

  setup(locator: IServiceLocator): void {
    this.gameSystem = locator.getSystem<GameStateSystem>('GameStateSystem');
    this.interactionSystem = locator.getSystem<InteractionSystem>('InteractionSystem');
  }

  update(delta: number, time: number): void {
    this.timeSinceLastSync += delta;
    if (this.timeSinceLastSync < this.SYNC_INTERVAL) return;
    this.timeSinceLastSync = 0;
    this.sync();
  }

  teardown(): void {}

  private sync() {
    const store = useGameStore.getState();
    
    // Sync Global State
    store.syncGameState({
        playerHealth: this.gameSystem.playerHealth,
        playerRebootProgress: this.gameSystem.playerRebootProgress,
        score: this.gameSystem.score,
        xp: this.gameSystem.xp,
        level: this.gameSystem.level,
        xpToNextLevel: this.gameSystem.xpToNextLevel,
        upgradePoints: this.gameSystem.upgradePoints,
        systemIntegrity: PanelRegistry.systemIntegrity,
        activeUpgrades: { ...this.gameSystem.activeUpgrades },
        
        // NEW: Sync Interaction Target so React knows what player is doing
        interactionTarget: this.interactionSystem.hoveringPanelId 
    });

    // Sync Panels
    const uiPanels: Record<string, any> = {};
    const panels = PanelRegistry.getAllPanels();
    
    for(const p of panels) {
        uiPanels[p.id] = {
            id: p.id,
            health: p.health,
            isDestroyed: p.isDestroyed
        };
    }
    
    store.syncPanels(uiPanels);
  }
}

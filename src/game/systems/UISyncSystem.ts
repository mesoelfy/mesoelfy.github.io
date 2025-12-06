import { IGameSystem, IServiceLocator } from '../core/interfaces';
import { useGameStore } from '../store/useGameStore';
import { GameStateSystem } from './GameStateSystem';
import { PanelRegistry } from './PanelRegistrySystem';

export class UISyncSystem implements IGameSystem {
  private gameSystem!: GameStateSystem;
  
  // Throttle configuration
  private readonly SYNC_INTERVAL = 0.1; // 10 times a second is enough for UI
  private timeSinceLastSync = 0;

  setup(locator: IServiceLocator): void {
    this.gameSystem = locator.getSystem<GameStateSystem>('GameStateSystem');
  }

  update(delta: number, time: number): void {
    this.timeSinceLastSync += delta;
    if (this.timeSinceLastSync < this.SYNC_INTERVAL) return;
    
    this.timeSinceLastSync = 0;
    this.sync();
  }

  teardown(): void {}

  private sync() {
    // We update the Zustand store with a single atomic update if possible,
    // or call the specific setters.
    // For performance, let's assume we add a "syncFromEngine" method to store
    // or just call setState directly via the hook's internal API (not exposed easily).
    // Let's use the setters we defined in the Store refactor (coming next).
    
    const store = useGameStore.getState();
    
    // 1. Game State
    store.syncGameState({
        playerHealth: this.gameSystem.playerHealth,
        playerRebootProgress: this.gameSystem.playerRebootProgress,
        score: this.gameSystem.score,
        xp: this.gameSystem.xp,
        level: this.gameSystem.level,
        xpToNextLevel: this.gameSystem.xpToNextLevel,
        upgradePoints: this.gameSystem.upgradePoints,
        systemIntegrity: PanelRegistry.systemIntegrity
    });

    // 2. Panel State
    // We construct the panels object that the UI expects
    // The UI expects: Record<string, { id, health, isDestroyed, element... }>
    // We only update health/isDestroyed.
    // This is the heaviest part. Optimization: Only update if changed?
    // For now, let's rely on Zustand's shallow comparison if we structure it right.
    
    const uiPanels: Record<string, any> = {};
    const panels = PanelRegistry.getAllPanels(); // Helper we made
    
    for(const p of panels) {
        uiPanels[p.id] = {
            id: p.id,
            health: p.health,
            isDestroyed: p.isDestroyed
            // We don't pass element ref back, the store already has it?
            // Actually, the Store needs the Element ref for its own logic?
            // No, Store logic is being deleted. UI uses the Ref from usePanelRegistry hook.
        };
    }
    
    store.syncPanels(uiPanels);
  }
}

import { IGameSystem, IServiceLocator } from '../core/interfaces';
import { useGameStore } from '../store/useGameStore';
import { GameStateSystem } from './GameStateSystem';
import { PanelRegistry } from './PanelRegistrySystem';
import { InteractionSystem } from './InteractionSystem';
import { TransientDOMService } from '@/game/services/TransientDOMService';

export class UISyncSystem implements IGameSystem {
  private gameSystem!: GameStateSystem;
  private interactionSystem!: InteractionSystem;
  
  private readonly SYNC_INTERVAL = 0.1; // 10Hz UI updates are plenty
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
    
    // 1. FAST PATH: Direct DOM Updates (No React Render)
    // We assume the DOM elements are registered via useTransientRef
    const formattedScore = this.gameSystem.score.toString().padStart(4, '0');
    TransientDOMService.update('score-display', formattedScore);
    
    // 2. SLOW PATH: React State Sync
    // Only update Zustand if values actually changed to prevent Virtual DOM trashing
    const shouldSyncReact = 
        store.playerHealth !== this.gameSystem.playerHealth || 
        store.playerRebootProgress !== this.gameSystem.playerRebootProgress || 
        store.xp !== this.gameSystem.xp || 
        store.score !== this.gameSystem.score ||
        store.level !== this.gameSystem.level ||
        store.upgradePoints !== this.gameSystem.upgradePoints ||
        store.interactionTarget !== this.interactionSystem.hoveringPanelId ||
        Math.abs(store.systemIntegrity - PanelRegistry.systemIntegrity) > 1.0; 

    if (shouldSyncReact) {
        store.syncGameState({
            playerHealth: this.gameSystem.playerHealth, 
            playerRebootProgress: this.gameSystem.playerRebootProgress, 
            level: this.gameSystem.level,
            xp: this.gameSystem.xp,
            score: this.gameSystem.score,
            xpToNextLevel: this.gameSystem.xpToNextLevel,
            upgradePoints: this.gameSystem.upgradePoints,
            activeUpgrades: { ...this.gameSystem.activeUpgrades },
            systemIntegrity: PanelRegistry.systemIntegrity,
            interactionTarget: this.interactionSystem.hoveringPanelId 
        });
    }

    // 3. Panel Sync (Slow path)
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

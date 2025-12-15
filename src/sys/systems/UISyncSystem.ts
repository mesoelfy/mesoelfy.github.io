import { IGameSystem, IServiceLocator, IPanelSystem, IInteractionSystem } from '@/engine/interfaces';
import { useGameStore } from '@/sys/state/game/useGameStore';
import { GameStateSystem } from './GameStateSystem';
import { TransientDOMService } from '@/sys/services/TransientDOMService';

export class UISyncSystem implements IGameSystem {
  private gameSystem!: GameStateSystem;
  private interactionSystem!: IInteractionSystem;
  private panelSystem!: IPanelSystem;
  
  private readonly SYNC_INTERVAL = 0.1; 
  private timeSinceLastSync = 0;

  setup(locator: IServiceLocator): void {
    this.gameSystem = locator.getSystem<GameStateSystem>('GameStateSystem');
    this.interactionSystem = locator.getSystem<IInteractionSystem>('InteractionSystem');
    this.panelSystem = locator.getSystem<IPanelSystem>('PanelRegistrySystem');
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
    const gs = this.gameSystem;
    
    const formattedScore = gs.score.toString().padStart(4, '0');
    TransientDOMService.update('score-display', formattedScore);
    
    const hasChanged = 
        store.playerHealth !== gs.playerHealth || 
        store.playerRebootProgress !== gs.playerRebootProgress || 
        store.xp !== gs.xp || 
        store.score !== gs.score ||
        store.level !== gs.level ||
        store.upgradePoints !== gs.upgradePoints ||
        store.interactionTarget !== this.interactionSystem.hoveringPanelId ||
        Math.abs(store.systemIntegrity - this.panelSystem.systemIntegrity) > 1.0; 

    if (hasChanged) {
        store.syncGameState({
            playerHealth: gs.playerHealth, 
            playerRebootProgress: gs.playerRebootProgress, 
            level: gs.level,
            xp: gs.xp,
            score: gs.score,
            xpToNextLevel: gs.xpToNextLevel,
            upgradePoints: gs.upgradePoints,
            activeUpgrades: { ...gs.activeUpgrades }, 
            systemIntegrity: this.panelSystem.systemIntegrity,
            interactionTarget: this.interactionSystem.hoveringPanelId 
        });
    }

    const uiPanels: Record<string, any> = {};
    const panels = this.panelSystem.getAllPanels();
    let panelsChanged = false;

    for(const p of panels) {
        const prev = store.panels[p.id];
        if (!prev || prev.health !== p.health || prev.isDestroyed !== p.isDestroyed) {
            uiPanels[p.id] = {
                id: p.id,
                health: p.health,
                isDestroyed: p.isDestroyed
            };
            panelsChanged = true;
        }
    }
    
    if (panelsChanged) {
        store.syncPanels(uiPanels);
    }
  }
}

import { IGameSystem, IGameStateSystem, IInteractionSystem, IPanelSystem } from '@/engine/interfaces';
import { useGameStore } from '@/engine/state/game/useGameStore';
import { TransientDOMService } from '@/engine/services/TransientDOMService';

export class UISyncSystem implements IGameSystem {
  private readonly SYNC_INTERVAL = 0.1; 
  private timeSinceLastSync = 0;

  constructor(
    private gameSystem: IGameStateSystem,
    private interactionSystem: IInteractionSystem,
    private panelSystem: IPanelSystem
  ) {}

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
    
    // 1. Transient DOM
    const formattedScore = gs.score.toString().padStart(4, '0');
    TransientDOMService.update('score-display', formattedScore);
    
    // 2. React State
    if (store.score !== gs.score) store.setScore(gs.score);
    if (store.playerHealth !== gs.playerHealth) store.setPlayerHealth(gs.playerHealth);
    if (store.playerRebootProgress !== gs.playerRebootProgress) store.setPlayerRebootProgress(gs.playerRebootProgress);
    if (Math.abs(store.systemIntegrity - this.panelSystem.systemIntegrity) > 1.0) {
        store.setSystemIntegrity(this.panelSystem.systemIntegrity);
    }

    if (store.xp !== gs.xp || store.level !== gs.level || store.upgradePoints !== gs.upgradePoints) {
        store.setProgressionData({
            xp: gs.xp,
            level: gs.level,
            nextXp: gs.xpToNextLevel,
            points: gs.upgradePoints
        });
    }

    // 3. Panel Sync
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

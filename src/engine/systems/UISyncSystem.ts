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
    // 1. FAST PATH (Every Frame) -> Transient DOM
    this.syncTransient();

    // 2. SLOW PATH (Throttled) -> React State
    this.timeSinceLastSync += delta;
    if (this.timeSinceLastSync >= this.SYNC_INTERVAL) {
        this.timeSinceLastSync = 0;
        this.syncReact();
    }
  }

  private syncTransient() {
      const gs = this.gameSystem;
      
      // Score
      const formattedScore = gs.score.toString().padStart(4, '0');
      TransientDOMService.update('score-display', formattedScore);

      // Level
      TransientDOMService.update('player-lvl-text', `LVL_${gs.level.toString().padStart(2, '0')}`);

      // Vitals
      const hpPercent = Math.max(0, gs.playerHealth / gs.maxPlayerHealth);
      const xpPercent = gs.xpToNextLevel > 0 ? (gs.xp / gs.xpToNextLevel) : 0;
      
      TransientDOMService.update('hp-progress', hpPercent);
      TransientDOMService.update('xp-progress', xpPercent);

      let hpColor = '#78F654'; 
      if (hpPercent < 0.3) hpColor = '#FF003C'; 
      else if (hpPercent < 0.6) hpColor = '#eae747'; 
      if (gs.playerHealth <= 0) hpColor = '#eae747'; // Use yellow for reboot state visually

      TransientDOMService.update('hp-color', hpColor);
  }

  private syncReact() {
    const store = useGameStore.getState();
    const gs = this.gameSystem;
    
    // We can be lazier here since transient handles the visuals
    if (Math.abs(store.score - gs.score) > 10) store.setScore(gs.score); // Only sync large score changes to React
    
    // Critical state changes still need React for conditional rendering (e.g. "Game Over" screen)
    if (store.playerHealth <= 0 && gs.playerHealth > 0) store.setPlayerHealth(gs.playerHealth);
    if (store.playerHealth > 0 && gs.playerHealth <= 0) store.setPlayerHealth(gs.playerHealth);
    
    if (Math.abs(store.playerRebootProgress - gs.playerRebootProgress) > 5) {
        store.setPlayerRebootProgress(gs.playerRebootProgress);
    }
    
    const engineIntegrity = this.panelSystem.systemIntegrity;
    if (Math.abs(store.systemIntegrity - engineIntegrity) > 1.0) {
        store.setSystemIntegrity(engineIntegrity);
    }

    if (store.interactionTarget !== this.interactionSystem.hoveringPanelId) {
        store.setInteractionTarget(this.interactionSystem.hoveringPanelId);
    }

    // Only sync progression if level changed (XP bar is now transient)
    if (store.level !== gs.level) {
        store.setProgressionData({
            xp: gs.xp,
            level: gs.level,
            nextXp: gs.xpToNextLevel,
            points: gs.upgradePoints
        });
    }

    // Panel Sync (Keep this throttled)
    const uiPanels: Record<string, any> = {};
    const panels = this.panelSystem.getAllPanels();
    let panelsChanged = false;

    for(const p of panels) {
        const prev = store.panels[p.id];
        if (!prev || prev.health !== p.health || prev.isDestroyed !== p.isDestroyed) {
            uiPanels[p.id] = { id: p.id, health: p.health, isDestroyed: p.isDestroyed };
            panelsChanged = true;
        }
    }
    
    if (panelsChanged) {
        store.syncPanels(uiPanels);
    }
  }

  teardown(): void {}
}

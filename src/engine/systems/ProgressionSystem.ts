import { IGameSystem, IGameEventService, IFastEventService } from '@/engine/interfaces';
import { GameEvents } from '@/engine/signals/GameEvents';
import { FastEvents } from '@/engine/signals/FastEventBus';
import { PLAYER_CONFIG } from '@/engine/config/PlayerConfig';
import { ServiceLocator } from '@/engine/services/ServiceLocator';
import { TransientDOMService } from '@/engine/services/TransientDOMService';
import { useGameStore } from '@/engine/state/game/useGameStore';

export class ProgressionSystem implements IGameSystem {
  public score: number = 0;
  public xp: number = 0;
  public level: number = 1;
  public xpToNextLevel: number = PLAYER_CONFIG.baseXpRequirement;
  public upgradePoints: number = 0;
  public activeUpgrades: Record<string, number> = {
    'OVERCLOCK': 0, 'EXECUTE': 0, 'FORK': 0,
    'SNIFFER': 0, 'BACKDOOR': 0, 'REPAIR_NANITES': 0
  };

  private fastEvents: IFastEventService;
  private readCursor = 0;

  constructor(private events: IGameEventService) {
    this.fastEvents = ServiceLocator.getFastEventBus();
    this.readCursor = this.fastEvents.getCursor();

    this.events.subscribe(GameEvents.UPGRADE_SELECTED, (p) => {
        this.applyUpgrade(p.option);
    });
    
    this.reset();
  }

  update(delta: number, time: number): void {
      this.readCursor = this.fastEvents.readEvents(this.readCursor, (id, a1, a2, a3, a4) => {
          if (id === FastEvents.ENEMY_DESTROYED) {
              // a1=id, a2=x, a3=y, a4=typeId
              this.addScore(1);
              this.addXp(10);
          }
      });
  }

  public addScore(amount: number) {
    this.score += amount;
    // PUSH: Visual Update (Zero React Render)
    TransientDOMService.update('score-display', this.score.toString().padStart(4, '0'));
    
    // PUSH: Store Update (Lazy - only if needed, or we can just do it on Game Over)
    // We update store occasionally if we want the UI to persist on pause, 
    // but for performance, we can skip frame-by-frame store updates.
  }

  public addXp(amount: number) {
    this.xp += amount;
    while (this.xp >= this.xpToNextLevel) {
        this.xp -= this.xpToNextLevel;
        this.level++;
        this.upgradePoints++;
        this.xpToNextLevel = Math.floor(this.xpToNextLevel * PLAYER_CONFIG.xpScalingFactor);
        
        // PUSH: Global Events
        this.events.emit(GameEvents.THREAT_LEVEL_UP, { level: this.level });
        
        // PUSH: Store Update (Low Frequency - Safe)
        this.syncStore();
    }
    
    // PUSH: Visual Update
    const xpPercent = this.xpToNextLevel > 0 ? (this.xp / this.xpToNextLevel) : 0;
    TransientDOMService.update('xp-progress', xpPercent);
  }

  public applyUpgrade(option: string) {
      if (this.upgradePoints > 0) {
          this.upgradePoints--;
          if (option === 'PURGE' || option === 'RESTORE' || option === 'DAEMON') {
              this.syncStore(); // Sync points reduction
              return;
          }
          this.activeUpgrades[option] = (this.activeUpgrades[option] || 0) + 1;
          this.syncStore();
      }
  }

  private syncStore() {
      // Direct store update for React UI (Upgrades menu, etc)
      useGameStore.getState().setProgressionData({
          xp: this.xp,
          level: this.level,
          nextXp: this.xpToNextLevel,
          points: this.upgradePoints
      });
  }

  public reset() {
      this.score = 0;
      this.xp = 0;
      this.level = 1;
      this.xpToNextLevel = PLAYER_CONFIG.baseXpRequirement;
      this.upgradePoints = 0;
      this.activeUpgrades = { 
        'OVERCLOCK': 0, 'EXECUTE': 0, 'FORK': 0,
        'SNIFFER': 0, 'BACKDOOR': 0, 'REPAIR_NANITES': 0
      };
      this.readCursor = this.fastEvents ? this.fastEvents.getCursor() : 0;
      
      // Reset Visuals
      TransientDOMService.update('score-display', "0000");
      TransientDOMService.update('xp-progress', 0);
      TransientDOMService.update('player-lvl-text', "LVL_01");
  }

  teardown(): void {}
}

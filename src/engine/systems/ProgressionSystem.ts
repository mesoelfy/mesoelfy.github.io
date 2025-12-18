import { IGameSystem, IGameEventService, IFastEventService } from '@/engine/interfaces';
import { GameEvents } from '@/engine/signals/GameEvents';
import { FastEvents, ENEMY_ID_MAP } from '@/engine/signals/FastEventBus';
import { PLAYER_CONFIG } from '@/engine/config/PlayerConfig';
import { ServiceLocator } from '@/engine/services/ServiceLocator';

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
              
              // We could reverse map ENEMY_ID_MAP to get string type if needed for specific logic
              // but for generic score it's not needed.
          }
      });
  }

  public addScore(amount: number) {
    this.score += amount;
  }

  public addXp(amount: number) {
    this.xp += amount;
    while (this.xp >= this.xpToNextLevel) {
        this.xp -= this.xpToNextLevel;
        this.level++;
        this.upgradePoints++;
        this.xpToNextLevel = Math.floor(this.xpToNextLevel * PLAYER_CONFIG.xpScalingFactor);
        this.events.emit(GameEvents.THREAT_LEVEL_UP, { level: this.level });
    }
  }

  public applyUpgrade(option: string) {
      if (this.upgradePoints > 0) {
          this.upgradePoints--;
          if (option === 'PURGE' || option === 'RESTORE' || option === 'DAEMON') return;
          this.activeUpgrades[option] = (this.activeUpgrades[option] || 0) + 1;
      }
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
  }

  teardown(): void {}
}

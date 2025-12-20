import { IGameSystem, IGameEventService, IFastEventService, IPanelSystem } from '@/engine/interfaces';
import { GameEvents } from '@/engine/signals/GameEvents';
import { FastEvents, REVERSE_SOUND_MAP, REVERSE_FX_MAP } from '@/engine/signals/FastEventBus';
import { ViewportHelper } from '@/engine/math/ViewportHelper';
import { PanelId } from '@/engine/config/PanelConfig';

export class FeedbackBridgeSystem implements IGameSystem {
  constructor(
    private events: IGameEventService,
    private fastEvents: IFastEventService,
    private panelSystem: IPanelSystem
  ) {
    this.setupRoutes();
  }

  update(): void {}
  teardown(): void {}

  private setupRoutes() {
    this.events.subscribe(GameEvents.PANEL_HEALED, (p) => {
        this.emitSound('loop_heal', this.getPanelX(p.id));
    });

    this.events.subscribe(GameEvents.PANEL_RESTORED, (p) => {
        const x = p.x !== undefined ? p.x : this.getPanelX(p.id);
        this.emitSound('fx_reboot_success', x);
        this.emitFX('REBOOT_HEAL', x, 0); 
    });

    this.events.subscribe(GameEvents.PANEL_DESTROYED, (p) => {
        const x = this.getPanelX(p.id);
        this.emitSound('fx_impact_heavy', x); 
        this.fastEvents.emit(FastEvents.DUCK_MUSIC, 80, 150);
        this.fastEvents.emit(FastEvents.CAM_SHAKE, 75); 
        this.fastEvents.emit(FastEvents.HIT_STOP, 100);
    });

    this.events.subscribe(GameEvents.GAME_OVER, () => {
        this.emitSound('fx_player_death');
        this.fastEvents.emit(FastEvents.DUCK_MUSIC, 100, 300);
        this.fastEvents.emit(FastEvents.CAM_SHAKE, 100);
        this.fastEvents.emit(FastEvents.HIT_STOP, 500);
    });

    this.events.subscribe(GameEvents.UPGRADE_SELECTED, () => {
        this.emitSound('fx_level_up');
    });
    
    this.events.subscribe(GameEvents.SPAWN_FX, (p) => {
        this.emitFX(p.type, p.x, p.y, p.angle);
    });
    
    this.events.subscribe(GameEvents.PLAY_SOUND, (p) => {
        this.emitSound(p.key, p.x);
    });
  }

  private emitSound(key: string, x: number = 0) {
      const id = REVERSE_SOUND_MAP[key];
      if (id) {
          const pan = this.calculatePan(x);
          this.fastEvents.emit(FastEvents.PLAY_SOUND, id, pan);
      }
  }

  private emitFX(key: string, x: number, y: number, angle: number = 0) {
      const id = REVERSE_FX_MAP[key];
      if (id) {
          this.fastEvents.emit(FastEvents.SPAWN_FX, id, x * 100, y * 100, angle * 100);
      }
  }

  private calculatePan(worldX: number): number {
      const halfWidth = ViewportHelper.viewport.width / 2;
      if (halfWidth === 0) return 0;
      return Math.floor(Math.max(-1, Math.min(1, worldX / halfWidth)) * 100);
  }

  private getPanelX(panelId: PanelId): number {
      const rect = this.panelSystem.getPanelRect(panelId);
      return rect ? rect.x : 0;
  }
}

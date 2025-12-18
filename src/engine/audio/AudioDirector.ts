import { IGameSystem, IPanelSystem, IGameEventService, IFastEventService, IAudioService } from '@/engine/interfaces';
import { GameEvents } from '@/engine/signals/GameEvents';
import { FastEvents, FX_ID_MAP, FX_IDS, ENEMY_ID_MAP } from '@/engine/signals/FastEventBus';
import { ViewportHelper } from '@/engine/math/ViewportHelper';

export class AudioDirector implements IGameSystem {
  private logTimer = 0;
  private readCursor = 0;
  
  constructor(
    private panelSystem: IPanelSystem,
    private events: IGameEventService,
    private fastEvents: IFastEventService,
    private audio: IAudioService
  ) {
    this.readCursor = this.fastEvents.getCursor();
    this.setupEventListeners();
  }

  update(delta: number, time: number): void {
    this.logTimer += delta;

    this.readCursor = this.fastEvents.readEvents(this.readCursor, (id, a1, a2, a3, a4) => {
        // 1. Explicit Play Sound Command
        if (id === FastEvents.PLAY_SOUND) {
            const key = FX_ID_MAP[a1];
            if (key) {
                this.audio.playSound(key.toLowerCase(), this.calculatePan(a2));
            }
        }
        
        // 2. Player Fired (Previously implicit or via separate mechanism)
        else if (id === FastEvents.PLAYER_FIRED) {
            // a1 = x
            this.audio.playSound('fx_player_fire', this.calculatePan(a1));
        }

        // 3. Enemy Destroyed
        else if (id === FastEvents.ENEMY_DESTROYED) {
            // a2=x, a4=typeId
            const pan = this.calculatePan(a2);
            // Kamikaze (ID 2) gets heavy impact
            if (a4 === ENEMY_ID_MAP['kamikaze']) {
                this.audio.playSound('fx_impact_heavy', pan);
            } else {
                this.audio.playSound('fx_impact_light', pan);
            }
        }

        // 4. Player Hit
        else if (id === FastEvents.PLAYER_HIT) {
            this.audio.playSound('fx_impact_heavy', 0);
            this.audio.duckMusic(0.7, 1.0);
        }
    });
  }

  private setupEventListeners() {
    // Only keeping UI/Panel events here. Combat events migrated to FastBus.

    this.events.subscribe(GameEvents.PANEL_HEALED, (p) => {
        const pan = this.getPanelPan(p.id);
        this.audio.playSound('loop_heal', pan);
    });

    this.events.subscribe(GameEvents.PANEL_RESTORED, (p) => {
        const pan = p.x !== undefined ? this.calculatePan(p.x) : this.getPanelPan(p.id);
        this.audio.playSound('fx_reboot_success', pan);
    });

    this.events.subscribe(GameEvents.PANEL_DESTROYED, (p) => {
        const pan = this.getPanelPan(p.id);
        this.audio.playSound('fx_impact_heavy', pan); 
        this.audio.duckMusic(0.8, 1.5);
    });

    this.events.subscribe(GameEvents.GAME_OVER, () => {
        this.audio.playSound('fx_impact_heavy');
        this.audio.duckMusic(1.0, 3.0);
    });

    this.events.subscribe(GameEvents.UPGRADE_SELECTED, () => {
        this.audio.playSound('fx_level_up');
    });
  }

  private calculatePan(worldX: number): number {
      const halfWidth = ViewportHelper.viewport.width / 2;
      if (halfWidth === 0) return 0;
      return Math.max(-1, Math.min(1, worldX / halfWidth));
  }

  private getPanelPan(panelId: string): number {
      const rect = this.panelSystem.getPanelRect(panelId);
      if (!rect) return 0;
      return this.calculatePan(rect.x);
  }

  teardown(): void {}
}

import { IGameSystem, IPanelSystem, IGameEventService, IFastEventService, IAudioService } from '@/engine/interfaces';
import { GameEvents } from '@/engine/signals/GameEvents';
import { FastEvents, SOUND_ID_MAP } from '@/engine/signals/FastEventBus';
import { ViewportHelper } from '@/engine/math/ViewportHelper';
import { AudioKey } from '@/engine/config/AssetKeys';
import { PanelId } from '@/engine/config/PanelConfig';

export class AudioDirector implements IGameSystem {
  constructor(
    private panelSystem: IPanelSystem,
    private events: IGameEventService,
    private fastEvents: IFastEventService,
    private audio: IAudioService
  ) {
    this.setupEventListeners();
  }

  update(delta: number, time: number): void {
    this.fastEvents.process((id, a1, a2) => {
        if (id === FastEvents.PLAY_SOUND) {
            const key = SOUND_ID_MAP[a1];
            if (key) {
                const pan = this.calculatePan(a2 / 100);
                this.audio.playSound(key as AudioKey, pan);
            }
        }
    });
  }

  private setupEventListeners() {
    this.events.subscribe(GameEvents.PLAY_SOUND, (p) => {
        const pan = p.x !== undefined ? this.calculatePan(p.x) : 0;
        this.audio.playSound(p.key as AudioKey, pan);
    });

    this.events.subscribe(GameEvents.PLAYER_FIRED, (p) => {
        this.audio.playSound('fx_player_fire', this.calculatePan(p.x));
    });

    this.events.subscribe(GameEvents.PLAYER_HIT, (p) => {
        this.audio.playSound('fx_impact_heavy', 0);
        this.audio.duckMusic(0.7, 1.0);
    });

    this.events.subscribe(GameEvents.ENEMY_DESTROYED, (p) => { 
        const pan = this.calculatePan(p.x);
        if (p.type === 'kamikaze') this.audio.playSound('fx_impact_heavy', pan);
        else this.audio.playSound('fx_impact_light', pan);
    });

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

  private getPanelPan(panelId: PanelId): number {
      const rect = this.panelSystem.getPanelRect(panelId);
      if (!rect) return 0;
      return this.calculatePan(rect.x);
  }

  teardown(): void {}
}

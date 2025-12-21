import { IGameSystem, IPanelSystem, IGameEventService, IFastEventService, IAudioService } from '@/engine/interfaces';
import { FastEventType, SOUND_LOOKUP, SoundCode, FLOAT_SCALAR } from '@/engine/signals/FastEventBus';
import { GameEvents } from '@/engine/signals/GameEvents';
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
    this.setupSubscriptions();
  }

  private setupSubscriptions() {
    this.events.subscribe(GameEvents.PANEL_HEALED, (p) => {
        this.playSpatial(p.id, 'loop_heal');
    });

    this.events.subscribe(GameEvents.PANEL_RESTORED, (p) => {
        if (p.x !== undefined) this.audio.playSound('fx_reboot_success', this.calculatePan(p.x));
        else this.playSpatial(p.id, 'fx_reboot_success');
    });

    this.events.subscribe(GameEvents.PANEL_DESTROYED, (p) => {
        this.playSpatial(p.id, 'fx_impact_heavy');
        this.audio.duckMusic(0.8, 1.5); 
    });

    this.events.subscribe(GameEvents.GAME_OVER, () => {
        this.audio.playSound('fx_player_death');
        this.audio.duckMusic(1.0, 3.0);
    });

    this.events.subscribe(GameEvents.UPGRADE_SELECTED, () => {
        this.audio.playSound('fx_level_up');
    });

    this.events.subscribe(GameEvents.PLAY_SOUND, (p) => {
        const pan = p.x !== undefined ? this.calculatePan(p.x) : 0;
        this.audio.playSound(p.key as AudioKey, pan);
    });
  }

  update(delta: number, time: number): void {
    // Poll Fast Bus for High-Frequency Combat Audio
    this.fastEvents.process((id, a1, a2, a3, a4) => {
        if (id === FastEventType.PLAY_SOUND) {
            // a1: SoundCode, a2: Pan * SCALAR
            const key = SOUND_LOOKUP[a1 as SoundCode];
            if (key) {
                const pan = this.calculatePan(a2 / FLOAT_SCALAR); 
                this.audio.playSound(key as AudioKey, pan);
            }
        }
        else if (id === FastEventType.DUCK_MUSIC) {
            // a1: Intensity, a2: Duration
            this.audio.duckMusic(a1 / FLOAT_SCALAR, a2 / FLOAT_SCALAR);
        }
    });
  }

  private playSpatial(panelId: PanelId, key: AudioKey) {
      const rect = this.panelSystem.getPanelRect(panelId);
      const x = rect ? rect.x : 0;
      this.audio.playSound(key, this.calculatePan(x));
  }

  private calculatePan(worldX: number): number {
      const halfWidth = ViewportHelper.viewport.width / 2;
      if (halfWidth === 0) return 0;
      return Math.max(-1, Math.min(1, worldX / halfWidth));
  }

  teardown(): void {}
}

import { IGameSystem, IPanelSystem, IGameEventService, IAudioService } from '@/engine/interfaces';
import { UnifiedEventService } from '@/engine/signals/UnifiedEventService';
import { FastEventType, SOUND_LOOKUP, SoundCode, FLOAT_SCALAR } from '@/engine/signals/FastEventBus';
import { GameEvents } from '@/engine/signals/GameEvents';
import { ViewportHelper } from '@/engine/math/ViewportHelper';
import { AudioKey } from '@/engine/config/AssetKeys';
import { PanelId } from '@/engine/config/PanelConfig';
import { AudioMixer } from './modules/AudioMixer';

export class AudioDirector implements IGameSystem {
  private _isPurging: boolean = false;
  
  constructor(
    private panelSystem: IPanelSystem,
    private events: IGameEventService,
    private audio: IAudioService
  ) {
    this.setupSubscriptions();
  }

  private setupSubscriptions() {
    this.events.subscribe(GameEvents.PLAYER_HIT, (p) => {
        const intensity = Math.min(0.9, 0.3 + (p.damage * 0.05));
        this.audio.duckMusic(intensity, 1.2);
    });

    this.events.subscribe(GameEvents.PANEL_HEALED, (p) => {
        this.playSpatial(p.id, 'loop_heal');
    });

    this.events.subscribe(GameEvents.PANEL_RESTORED, (p) => {
        if (p.x !== undefined) this.audio.playSound('fx_reboot_success', this.calculatePan(p.x));
        else this.playSpatial(p.id, 'fx_reboot_success');
    });

    this.events.subscribe(GameEvents.PANEL_DESTROYED, (p) => {
        this.playSpatial(p.id, 'fx_impact_heavy');
        this.audio.duckMusic(0.95, 2.5); 
    });

    this.events.subscribe(GameEvents.GAME_OVER, () => {
        this.audio.playSound('fx_player_death');
        this.audio.duckMusic(1.0, 5.0);
        this._isPurging = false; // Reset flag in case of repeat game overs
    });

    this.events.subscribe(GameEvents.UPGRADE_SELECTED, (p) => {
        if (p.option === 'PURGE') {
            this._isPurging = true; // TRIGGER AUDIO RESURRECTION
        }
        this.audio.playSound('fx_level_up');
    });

    this.events.subscribe(GameEvents.ZEN_MODE_ENABLED, () => {
        this._isPurging = false;
    });

    this.events.subscribe(GameEvents.GAME_START, () => {
        this._isPurging = false;
    });

    this.events.subscribe(GameEvents.PLAY_SOUND, (p) => {
        const pan = p.x !== undefined ? this.calculatePan(p.x) : 0;
        this.audio.playSound(p.key as AudioKey, pan);
    });
  }

  update(delta: number, time: number): void {
    // 1. Process Global Master Filter
    // If we are purging, we force integrity to 1.0 to "open" the filter.
    const integrity = this._isPurging ? 1.0 : (this.panelSystem.systemIntegrity / 100);
    
    const mixer = (this.audio as any).mixer as AudioMixer;
    if (mixer) {
        mixer.updateMasterFilter(integrity);
    }

    // 2. Process Fast Events
    const unified = this.events as UnifiedEventService;
    if (unified && typeof unified.processFastEvents === 'function') {
        unified.processFastEvents((id, a1, a2, a3, a4) => {
            if (id === FastEventType.PLAY_SOUND) {
                const key = SOUND_LOOKUP[a1 as SoundCode];
                if (key) {
                    const pan = this.calculatePan(a2 / FLOAT_SCALAR); 
                    this.audio.playSound(key as AudioKey, pan);
                }
            }
            else if (id === FastEventType.DUCK_MUSIC) {
                this.audio.duckMusic(a1 / FLOAT_SCALAR, a2 / FLOAT_SCALAR);
            }
        });
    }
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

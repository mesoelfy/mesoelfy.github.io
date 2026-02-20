import { IGameSystem, IPanelSystem, IGameEventService, IAudioService } from '@/engine/interfaces';
import { UnifiedEventService } from '@/engine/signals/UnifiedEventService';
import { FastEventType, SOUND_LOOKUP, SoundCode, FLOAT_SCALAR } from '@/engine/signals/FastEventBus';
import { GameEvents } from '@/engine/signals/GameEvents';
import { ViewportHelper } from '@/engine/math/ViewportHelper';
import { AudioKey } from '@/engine/config/AssetKeys';
import { PanelId } from '@/engine/config/PanelConfig';

export class AudioDirector implements IGameSystem {
  private _isPurging: boolean = false;
  private _isZen: boolean = false;
  private unsubs: (() => void)[] = [];
  
  constructor(
    private panelSystem: IPanelSystem,
    private events: IGameEventService, 
    private audio: IAudioService
  ) {
    this.setupSubscriptions();
  }

  private setupSubscriptions() {
    this.unsubs.push(this.events.subscribe(GameEvents.PANEL_HEALED, (p) => {
        this.playSpatial(p.id, 'loop_heal');
    }));

    this.unsubs.push(this.events.subscribe(GameEvents.PANEL_RESTORED, (p) => {
        if (p.x !== undefined) this.audio.playSound('fx_reboot_success', this.calculatePan(p.x));
        else this.playSpatial(p.id, 'fx_reboot_success');
    }));

    this.unsubs.push(this.events.subscribe(GameEvents.PANEL_DESTROYED, (p) => {
        this.playSpatial(p.id, 'fx_impact_heavy');
        this.audio.duckMusic(0.8, 1.5); 
    }));

    this.unsubs.push(this.events.subscribe(GameEvents.PLAYER_HIT, (p) => {
        const intensity = p.damage > 5 ? 0.8 : 0.6;
        const duration = p.damage > 5 ? 1.0 : 0.5;
        this.audio.duckMusic(intensity, duration);
    }));

    this.unsubs.push(this.events.subscribe(GameEvents.GAME_OVER, () => {
        this.audio.playSound('fx_player_death');
        this.audio.duckMusic(1.0, 3.0);
        this._isPurging = false;
    }));

    this.unsubs.push(this.events.subscribe(GameEvents.UPGRADE_SELECTED, (p) => {
        const isGameOver = this.panelSystem.systemIntegrity <= 0;
        if (p.option === 'PURGE' && isGameOver) {
            this._isPurging = true;
        }
        this.audio.playSound('fx_level_up');
    }));

    this.unsubs.push(this.events.subscribe(GameEvents.ZEN_MODE_ENABLED, () => {
        this._isPurging = false;
        this._isZen = true; 
    }));

    this.unsubs.push(this.events.subscribe(GameEvents.GAME_START, () => {
        this._isPurging = false;
        this._isZen = false;
    }));

    this.unsubs.push(this.events.subscribe(GameEvents.PLAY_SOUND, (p) => {
        const pan = p.x !== undefined ? this.calculatePan(p.x) : 0;
        this.audio.playSound(p.key as AudioKey, pan);
    }));
  }

  update(delta: number, time: number): void {
    let integrity = this.panelSystem.systemIntegrity / 100;
    let timeConstant = 0.05; 

    if (this._isPurging) {
        integrity = 1.0;
        timeConstant = 2.0; 
    } else if (this._isZen) {
        integrity = 1.0;
    }

    // Call abstraction instead of casting to implementation
    this.audio.updateMasterFilter(integrity, timeConstant);

    const unified = this.events as UnifiedEventService;
    if (unified.processFastEvents) {
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

  teardown(): void {
      this.unsubs.forEach(u => u());
      this.unsubs = [];
  }
}

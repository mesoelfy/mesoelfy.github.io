import { IGameSystem, IServiceLocator } from '../core/interfaces';
import { GameEventBus } from '../events/GameEventBus';
import { GameEvents } from '../events/GameEvents';
import { AudioSystem } from '@/core/audio/AudioSystem';
import { FastEventBus, FastEvents, FX_ID_MAP } from '../core/FastEventBus';

export class AudioDirectorSystem implements IGameSystem {
  
  setup(locator: IServiceLocator): void {
    this.setupEventListeners();
  }

  update(delta: number, time: number): void {
    // Process High Frequency Audio Events (from FastEventBus)
    FastEventBus.processEvents((id, a1, a2, a3, a4) => {
        if (id === FastEvents.PLAY_SOUND) {
            // Map ID back to string key (e.g. "FX_PLAYER_FIRE")
            const key = FX_ID_MAP[a1];
            if (key) {
                // Config keys are lowercase (e.g. "fx_player_fire")
                const audioKey = key.toLowerCase();
                AudioSystem.playSound(audioKey);
            }
        }
    });
  }

  private setupEventListeners() {
    // Legacy Events (Low Frequency)
    GameEventBus.subscribe(GameEvents.PLAYER_HIT, (p) => {
        AudioSystem.playSound('fx_impact_heavy'); 
        AudioSystem.duckMusic(0.7, 1.0);
    });

    GameEventBus.subscribe(GameEvents.ENEMY_DESTROYED, (p) => { 
        if (p.type === 'kamikaze') AudioSystem.playSound('fx_impact_heavy');
        else AudioSystem.playSound('fx_impact_light');
    });

    GameEventBus.subscribe(GameEvents.GAME_OVER, () => {
        AudioSystem.playSound('fx_impact_heavy');
        AudioSystem.duckMusic(1.0, 3.0);
    });

    GameEventBus.subscribe(GameEvents.PANEL_HEALED, () => {
        AudioSystem.playSound('loop_heal');
    });

    GameEventBus.subscribe(GameEvents.PANEL_DESTROYED, () => {
        AudioSystem.playSound('fx_impact_heavy'); 
        AudioSystem.duckMusic(0.8, 1.5);
    });

    GameEventBus.subscribe(GameEvents.UPGRADE_SELECTED, () => {
        AudioSystem.playSound('fx_level_up');
    });
    
    GameEventBus.subscribe(GameEvents.ZEN_MODE_ENABLED, () => {
        // ...
    });
  }

  teardown(): void {
  }
}

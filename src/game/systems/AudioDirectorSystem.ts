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
            // Note: We need a mapping for ID -> Key if we use FastBus for audio.
            // Currently mostly used for VFX, but ready for expansion.
        }
    });
  }

  private setupEventListeners() {
    // 1. Player Actions
    GameEventBus.subscribe(GameEvents.PLAYER_FIRED, () => {
        AudioSystem.playSound('fx_player_fire');
    });

    GameEventBus.subscribe(GameEvents.PLAYER_HIT, (p) => {
        AudioSystem.playSound('fx_impact_heavy'); 
        // Duck music on heavy impact
        AudioSystem.duckMusic(0.7, 1.0);
    });

    // 2. Enemy Interactions
    GameEventBus.subscribe(GameEvents.ENEMY_DESTROYED, (p) => { 
        if (p.type === 'kamikaze') AudioSystem.playSound('fx_impact_heavy');
        else AudioSystem.playSound('fx_impact_light');
    });

    // 3. UI / System State
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
    
    // 4. Ambient / Music Control
    GameEventBus.subscribe(GameEvents.ZEN_MODE_ENABLED, () => {
        // Switch to calmer ambience? 
        // For now, standard behavior.
    });
  }

  teardown(): void {
    // No explicit cleanup needed as EventBus clears on reload, 
    // but in a strict engine we would unsubscribe here.
  }
}

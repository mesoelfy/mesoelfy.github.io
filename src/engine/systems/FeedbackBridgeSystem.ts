import { IGameSystem, IGameEventService, IFastEventService, IPanelSystem } from '@/engine/interfaces';
import { GameEvents } from '@/engine/signals/GameEvents';
import { FastEvents, REVERSE_SOUND_MAP, REVERSE_FX_MAP } from '@/engine/signals/FastEventBus';
import { ViewportHelper } from '@/engine/math/ViewportHelper';

/**
 * BRIDGES 'Logic' (GameEvents) -> 'Feedback' (FastEvents)
 * Decouples game rules from audio/visual implementation.
 */
export class FeedbackBridgeSystem implements IGameSystem {
  
  constructor(
    private events: IGameEventService,
    private fastEvents: IFastEventService,
    private panelSystem: IPanelSystem
  ) {
    this.setupRoutes();
  }

  update(delta: number, time: number): void {}
  teardown(): void {}

  private setupRoutes() {
    // --- PLAYER FEEDBACK ---
    this.events.subscribe(GameEvents.PLAYER_FIRED, (p) => {
        this.emitSound('fx_player_fire', p.x);
    });

    this.events.subscribe(GameEvents.PLAYER_HIT, (p) => {
        // Heavy impact + Ducking + Shake
        this.emitSound('fx_impact_heavy');
        this.fastEvents.emit(FastEvents.DUCK_MUSIC, 70, 100); // 0.7 intensity, 1.0s
        
        // Trauma logic moved from ShakeSystem to here
        const trauma = p.damage >= 5 ? 40 : 30; // 0.4 or 0.3
        this.fastEvents.emit(FastEvents.CAM_SHAKE, trauma);
        
        // Hitstop for heavy hits
        if (p.damage > 10) this.fastEvents.emit(FastEvents.HIT_STOP, 50);
    });

    // --- ENEMY FEEDBACK ---
    this.events.subscribe(GameEvents.ENEMY_DESTROYED, (p) => { 
        if (p.type === 'kamikaze') this.emitSound('fx_impact_heavy', p.x);
        else this.emitSound('fx_impact_light', p.x);
    });

    // --- PANEL FEEDBACK ---
    this.events.subscribe(GameEvents.PANEL_HEALED, (p) => {
        const x = this.getPanelX(p.id);
        this.emitSound('loop_heal', x);
        // Visuals usually handled by InteractionSystem spawning particles directly
    });

    this.events.subscribe(GameEvents.PANEL_RESTORED, (p) => {
        const x = p.x !== undefined ? p.x : this.getPanelX(p.id);
        this.emitSound('fx_reboot_success', x);
        this.emitFX('REBOOT_HEAL', x, 0); // 0 Y assumed if not provided
    });

    this.events.subscribe(GameEvents.PANEL_DESTROYED, (p) => {
        const x = this.getPanelX(p.id);
        this.emitSound('fx_impact_heavy', x); 
        this.fastEvents.emit(FastEvents.DUCK_MUSIC, 80, 150);
        this.fastEvents.emit(FastEvents.CAM_SHAKE, 75); // 0.75
        this.fastEvents.emit(FastEvents.HIT_STOP, 100);
    });

    // --- GLOBAL STATE ---
    this.events.subscribe(GameEvents.GAME_OVER, () => {
        this.emitSound('fx_player_death');
        this.fastEvents.emit(FastEvents.DUCK_MUSIC, 100, 300);
        this.fastEvents.emit(FastEvents.CAM_SHAKE, 100);
        this.fastEvents.emit(FastEvents.HIT_STOP, 500);
    });

    this.events.subscribe(GameEvents.UPGRADE_SELECTED, () => {
        this.emitSound('fx_level_up');
    });
    
    this.events.subscribe(GameEvents.HEARTBEAT, (p) => {
        // Pulse Effect? We don't have a FastEvent for generic screen pulse yet, 
        // usually handled by React UI state, but sound is here.
        // GameStateSystem plays sound directly currently. We can move it here if we emit event.
        // Keeping GameStateSystem logic for now as it uses timers.
    });
    
    this.events.subscribe(GameEvents.TRAUMA_ADDED, (p) => {
        this.fastEvents.emit(FastEvents.CAM_SHAKE, p.amount * 100);
    });
    
    this.events.subscribe(GameEvents.SPAWN_FX, (p) => {
        // Bridge legacy/slow spawn requests
        this.emitFX(p.type, p.x, p.y, p.angle);
    });
    
    this.events.subscribe(GameEvents.PLAY_SOUND, (p) => {
        this.emitSound(p.key, p.x);
    });
  }

  // --- HELPERS ---

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
      // Result x100 for integer packing
      return Math.floor(Math.max(-1, Math.min(1, worldX / halfWidth)) * 100);
  }

  private getPanelX(panelId: string): number {
      const rect = this.panelSystem.getPanelRect(panelId);
      return rect ? rect.x : 0;
  }
}

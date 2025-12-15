import { IGameSystem, IServiceLocator, IPanelSystem } from '@/engine/interfaces';
import { GameEventBus } from '@/engine/signals/GameEventBus';
import { GameEvents } from '@/engine/signals/GameEvents';
import { AudioSystem } from './AudioSystem';
import { FastEventBus, FastEvents, FX_ID_MAP } from '@/engine/signals/FastEventBus';
import { ViewportHelper } from '@/engine/math/ViewportHelper';

export class AudioDirector implements IGameSystem {
  private logTimer = 0;
  private readCursor = 0;
  private panelSystem!: IPanelSystem;
  
  setup(locator: IServiceLocator): void {
    this.panelSystem = locator.getSystem<IPanelSystem>('PanelRegistrySystem');
    this.readCursor = FastEventBus.getCursor();
    this.setupEventListeners();
  }

  update(delta: number, time: number): void {
    this.logTimer += delta;

    this.readCursor = FastEventBus.readEvents(this.readCursor, (id, a1, a2, a3, a4) => {
        if (id === FastEvents.PLAY_SOUND) {
            const key = FX_ID_MAP[a1];
            
            if (this.logTimer > 1.0) {
                GameEventBus.emit(GameEvents.LOG_DEBUG, { 
                    msg: `RECV SOUND ID: ${a1} -> KEY: ${key}`, 
                    source: 'AudioDirector' 
                });
                this.logTimer = 0;
            }

            if (key) {
                const audioKey = key.toLowerCase();
                const pan = this.calculatePan(a2); 
                AudioSystem.playSound(audioKey, pan);
            }
        }
    });
  }

  private setupEventListeners() {
    GameEventBus.subscribe(GameEvents.PLAYER_HIT, (p) => {
        AudioSystem.playSound('fx_impact_heavy', 0);
        AudioSystem.duckMusic(0.7, 1.0);
    });

    GameEventBus.subscribe(GameEvents.ENEMY_DESTROYED, (p) => { 
        const pan = this.calculatePan(p.x);
        if (p.type === 'kamikaze') AudioSystem.playSound('fx_impact_heavy', pan);
        else AudioSystem.playSound('fx_impact_light', pan);
    });

    GameEventBus.subscribe(GameEvents.PANEL_HEALED, (p) => {
        const pan = this.getPanelPan(p.id);
        AudioSystem.playSound('loop_heal', pan);
    });

    GameEventBus.subscribe(GameEvents.PANEL_RESTORED, (p) => {
        const pan = p.x !== undefined ? this.calculatePan(p.x) : this.getPanelPan(p.id);
        AudioSystem.playSound('fx_reboot_success', pan);
    });

    GameEventBus.subscribe(GameEvents.PANEL_DESTROYED, (p) => {
        const pan = this.getPanelPan(p.id);
        AudioSystem.playSound('fx_impact_heavy', pan); 
        AudioSystem.duckMusic(0.8, 1.5);
    });

    GameEventBus.subscribe(GameEvents.GAME_OVER, () => {
        AudioSystem.playSound('fx_impact_heavy');
        AudioSystem.duckMusic(1.0, 3.0);
    });

    GameEventBus.subscribe(GameEvents.UPGRADE_SELECTED, () => {
        AudioSystem.playSound('fx_level_up');
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

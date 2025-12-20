import { IGameSystem, IPanelSystem, IGameEventService, IFastEventService, IAudioService } from '@/engine/interfaces';
import { FastEventType, SOUND_LOOKUP, SoundCode } from '@/engine/signals/FastEventBus';
import { ViewportHelper } from '@/engine/math/ViewportHelper';
import { AudioKey } from '@/engine/config/AssetKeys';
import { PanelId } from '@/engine/config/PanelConfig';

export class AudioDirector implements IGameSystem {
  
  constructor(
    private panelSystem: IPanelSystem,
    private events: IGameEventService,
    private fastEvents: IFastEventService,
    private audio: IAudioService
  ) {}

  update(delta: number, time: number): void {
    // READ ONLY FROM FAST BUS
    // The bus is cleared at the end of every frame by GameEngine, 
    // so we process everything currently in the buffer.
    this.fastEvents.process((id, a1, a2, a3, a4) => {
        if (id === FastEventType.PLAY_SOUND) {
            // a1: SoundCode, a2: Pan * 100
            const key = SOUND_LOOKUP[a1 as SoundCode];
            if (key) {
                const pan = this.calculatePan(a2 / 100); 
                this.audio.playSound(key as AudioKey, pan);
            }
        }
        else if (id === FastEventType.DUCK_MUSIC) {
            // a1: Intensity * 100, a2: Duration * 100
            this.audio.duckMusic(a1 / 100, a2 / 100);
        }
    });
  }

  private calculatePan(worldX: number): number {
      const halfWidth = ViewportHelper.viewport.width / 2;
      if (halfWidth === 0) return 0;
      return Math.max(-1, Math.min(1, worldX / halfWidth));
  }

  teardown(): void {}
}

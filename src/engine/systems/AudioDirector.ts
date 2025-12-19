import { IGameSystem, IPanelSystem, IGameEventService, IFastEventService, IAudioService } from '@/engine/interfaces';
import { FastEvents, SOUND_ID_MAP } from '@/engine/signals/FastEventBus';
import { ViewportHelper } from '@/engine/math/ViewportHelper';
import { AudioKey } from '@/engine/config/AssetKeys';

export class AudioDirector implements IGameSystem {
  private readCursor = 0;
  
  constructor(
    private panelSystem: IPanelSystem,
    private events: IGameEventService,
    private fastEvents: IFastEventService,
    private audio: IAudioService
  ) {
    this.readCursor = this.fastEvents.getCursor();
  }

  update(delta: number, time: number): void {
    // READ ONLY FROM FAST BUS
    // Logic -> Bridge -> FastBus -> AudioDirector
    // Combat -> FastBus -> AudioDirector
    
    this.readCursor = this.fastEvents.readEvents(this.readCursor, (id, a1, a2, a3, a4) => {
        if (id === FastEvents.PLAY_SOUND) {
            // a1: SoundID, a2: Pan * 100
            const key = SOUND_ID_MAP[a1];
            if (key) {
                const pan = this.calculatePan(a2 / 100); 
                this.audio.playSound(key as AudioKey, pan);
            }
        }
        else if (id === FastEvents.DUCK_MUSIC) {
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

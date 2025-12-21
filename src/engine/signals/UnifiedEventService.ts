import { IGameEventService, IFastEventService } from '@/engine/interfaces';
import { GameEvents, GameEventPayloads } from './GameEvents';
import { SoundCode, FXCode, getFXCode, getSoundCode } from './FastEventBus';

export class UnifiedEventService implements IGameEventService {
  constructor(private slowBus: IGameEventService, private fastBus: IFastEventService) {}

  public subscribe<T extends GameEvents>(event: T, handler: (payload: GameEventPayloads[T]) => void): () => void {
    return this.slowBus.subscribe(event, handler);
  }

  public emit<T extends GameEvents>(event: T, payload: GameEventPayloads[T]): void {
    if (event === GameEvents.SPAWN_FX) {
        const p = payload as GameEventPayloads[GameEvents.SPAWN_FX];
        const code = getFXCode(p.type);
        if (code !== FXCode.NONE) {
            this.fastBus.spawnFX(code, p.x, p.y, p.angle || 0);
            return;
        }
    }
    if (event === GameEvents.PLAY_SOUND) {
        const p = payload as GameEventPayloads[GameEvents.PLAY_SOUND];
        const code = getSoundCode(p.key);
        if (code !== SoundCode.NONE) {
            this.fastBus.playSound(code, p.x !== undefined ? p.x : 0);
            return;
        }
    }
    if (event === GameEvents.TRAUMA_ADDED) {
        const p = payload as GameEventPayloads[GameEvents.TRAUMA_ADDED];
        this.fastBus.camShake(p.amount);
        return;
    }
    this.slowBus.emit(event, payload);
  }

  public clear() {
    this.slowBus.clear();
    this.fastBus.clear();
  }

  public processFastEvents(callback: (id: number, a1: number, a2: number, a3: number, a4: number) => void) {
      this.fastBus.process(callback);
  }
}

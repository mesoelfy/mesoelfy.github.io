import { IGameEventService, IFastEventService } from '@/engine/interfaces';
import { GameEvents, GameEventPayloads, FXVariant } from './GameEvents';
import { FastEventType, SoundCode, FXCode, FLOAT_SCALAR, getFXCode, getSoundCode } from './FastEventBus';
import { PanelId } from '@/engine/config/PanelConfig';

export class UnifiedEventService implements IGameEventService {
  constructor(
    private slowBus: IGameEventService,
    private fastBus: IFastEventService
  ) {}

  public subscribe<T extends GameEvents>(event: T, handler: (payload: GameEventPayloads[T]) => void): () => void {
    return this.slowBus.subscribe(event, handler);
  }

  public emit<T extends GameEvents>(event: T, payload: GameEventPayloads[T]): void {
    // --- FAST PATH ROUTING ---
    
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
            // We interpret 'x' as pan info if provided, else 0
            const pan = p.x !== undefined ? p.x : 0; 
            // Note: The FastBus usually expects a pan value, but we might need to 
            // recalculate pan in the consumer if we only pass X. 
            // However, the original fastBus.playSound took 'pan'. 
            // We will assume 'x' here needs to be processed by the consumer or 
            // passed as raw pan if pre-calculated. 
            // To be safe and compatible with legacy FastBus usage:
            this.fastBus.playSound(code, pan);
            return;
        }
    }

    if (event === GameEvents.TRAUMA_ADDED) {
        const p = payload as GameEventPayloads[GameEvents.TRAUMA_ADDED];
        this.fastBus.camShake(p.amount);
        return;
    }

    // --- SLOW PATH (Default) ---
    this.slowBus.emit(event, payload);
  }

  public clear() {
    this.slowBus.clear();
    this.fastBus.clear();
  }

  // --- EXPOSE FAST BUS FOR CONSUMERS (READERS) ---
  // Readers (Directors) still need to poll the buffer efficiently
  public processFastEvents(callback: (id: number, a1: number, a2: number, a3: number, a4: number) => void) {
      this.fastBus.process(callback);
  }
}

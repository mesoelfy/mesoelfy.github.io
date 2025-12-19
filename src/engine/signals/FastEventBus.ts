import { IFastEventService } from '@/engine/interfaces';

// Numeric OpCodes for zero-allocation handling
export enum FastEvents {
  NONE = 0,
  PLAY_SOUND = 1,  // Arg1: SoundID, Arg2: Pan (x * 100)
  SPAWN_FX = 2,    // Arg1: FX_ID, Arg2: x * 100, Arg3: y * 100, Arg4: angle * 100
  CAM_SHAKE = 3,   // Arg1: Intensity * 100
  HIT_STOP = 4     // Arg1: Duration (ms)
}

// Maps Numeric IDs back to String Keys for lookup (Audio/VFX Manifests)
export const SOUND_ID_MAP: Record<number, string> = {
  1: 'fx_player_fire',
  2: 'fx_impact_light',
  3: 'fx_impact_heavy',
  4: 'fx_enemy_fire',
  5: 'ui_click',
  6: 'ui_hover',
  7: 'loop_drill',
  8: 'fx_reboot_success',
  9: 'fx_level_up'
};

export const FX_ID_MAP: Record<number, string> = {
  1: 'EXPLOSION_PURPLE',
  2: 'EXPLOSION_YELLOW',
  3: 'EXPLOSION_RED',
  4: 'IMPACT_WHITE',
  5: 'IMPACT_RED',
  6: 'DRILL_SPARKS',
  7: 'HUNTER_RECOIL',
  8: 'CLASH_YELLOW',
  9: 'EXPLOSION_PURPLE_DIR',
  10: 'EXPLOSION_YELLOW_DIR',
  11: 'EXPLOSION_RED_DIR'
};

// Reverse maps for Emitters
export const REVERSE_SOUND_MAP: Record<string, number> = Object.fromEntries(
  Object.entries(SOUND_ID_MAP).map(([k, v]) => [v, Number(k)])
);

export const REVERSE_FX_MAP: Record<string, number> = Object.fromEntries(
  Object.entries(FX_ID_MAP).map(([k, v]) => [v, Number(k)])
);

const BUFFER_SIZE = 4096; // Max events per frame * params
const EVENT_STRIDE = 5;   // ID + 4 Args

export class FastEventBusImpl implements IFastEventService {
  private buffer = new Int32Array(BUFFER_SIZE);
  private cursor = 0;

  public emit(eventId: number, a1: number = 0, a2: number = 0, a3: number = 0, a4: number = 0) {
    if (this.cursor + EVENT_STRIDE >= BUFFER_SIZE) {
      // Buffer overflow - wrap around or drop? 
      // For visual FX, dropping is safer than overwriting unread data if readers are slow.
      // But typically we reset cursor every frame.
      return; 
    }

    this.buffer[this.cursor++] = eventId;
    this.buffer[this.cursor++] = a1;
    this.buffer[this.cursor++] = a2;
    this.buffer[this.cursor++] = a3;
    this.buffer[this.cursor++] = a4;
  }

  // Returns the cursor position at the end of the frame, so readers know where to stop
  public getCursor(): number {
    return this.cursor;
  }

  public clear() {
    this.cursor = 0;
  }

  public readEvents(startCursor: number, handler: (id: number, a1: number, a2: number, a3: number, a4: number) => void): number {
    let ptr = startCursor; // In case we want multiple readers tracking their own read head (unlikely here)
    // Actually, since we clear every frame, readers just read 0 to currentCursor
    // But keeping the signature flexible.
    
    // For this architecture: Systems run sequentially. 
    // Readers should read ONLY what hasn't been processed if they run mid-frame?
    // Simplified: We assume systems run AFTER logic phase.
    
    // Actually, readers just iterate the buffer.
    // The previous architecture cleared the bus at the end of the frame.
    return this.cursor;
  }
  
  public process(callback: (id: number, a1: number, a2: number, a3: number, a4: number) => void) {
      for(let i=0; i<this.cursor; i+=EVENT_STRIDE) {
          callback(
              this.buffer[i],
              this.buffer[i+1],
              this.buffer[i+2],
              this.buffer[i+3],
              this.buffer[i+4]
          );
      }
  }
}

// Ring Buffer Size
const BUFFER_SIZE = 2048; 
const MASK = BUFFER_SIZE - 1;

const STRIDE = 5; 

export const FastEvents = {
  SPAWN_FX: 1,      // [ID, TYPE_ID, X, Y, ANGLE]
  TRAUMA: 2,        // [ID, AMOUNT, 0, 0, 0]
  PLAY_SOUND: 3,    // [ID, SOUND_ID, 0, 0, 0]
} as const;

export const FX_IDS: Record<string, number> = {
  'EXPLOSION_PURPLE': 1,
  'EXPLOSION_YELLOW': 2,
  'EXPLOSION_RED': 3,
  'IMPACT_WHITE': 4,
  'IMPACT_RED': 5,
  'CLASH_YELLOW': 6,
  'DRILL_SPARKS': 7,
  'HUNTER_RECOIL': 8,
  'REBOOT_HEAL': 9,
  'PURGE_BLAST': 10,
  
  // AUDIO MAPPINGS (New)
  'FX_PLAYER_FIRE': 50,
  'FX_IMPACT_HEAVY': 51,
  'FX_IMPACT_LIGHT': 52
};

export const FX_ID_MAP = Object.entries(FX_IDS).reduce((acc, [k, v]) => {
  acc[v] = k;
  return acc;
}, {} as Record<number, string>);

class FastEventBusController {
  private buffer = new Float32Array(BUFFER_SIZE * STRIDE);
  private writeCursor = 0;
  private readCursor = 0;

  public emit(eventId: number, arg1: number = 0, arg2: number = 0, arg3: number = 0, arg4: number = 0) {
    const ptr = (this.writeCursor & MASK) * STRIDE;
    
    this.buffer[ptr] = eventId;
    this.buffer[ptr + 1] = arg1;
    this.buffer[ptr + 2] = arg2;
    this.buffer[ptr + 3] = arg3;
    this.buffer[ptr + 4] = arg4;

    this.writeCursor++;
  }

  public processEvents(handler: (eventId: number, a1: number, a2: number, a3: number, a4: number) => void) {
    while (this.readCursor < this.writeCursor) {
      const ptr = (this.readCursor & MASK) * STRIDE;
      
      const id = this.buffer[ptr];
      const a1 = this.buffer[ptr + 1];
      const a2 = this.buffer[ptr + 2];
      const a3 = this.buffer[ptr + 3];
      const a4 = this.buffer[ptr + 4];

      handler(id, a1, a2, a3, a4);
      
      this.readCursor++;
    }
  }
}

export const FastEventBus = new FastEventBusController();

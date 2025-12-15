const BUFFER_SIZE = 2048; 
const MASK = BUFFER_SIZE - 1;
const STRIDE = 5; 

export const FastEvents = {
  SPAWN_FX: 1,
  TRAUMA: 2,
  PLAY_SOUND: 3,
} as const;

export const FX_IDS: Record<string, number> = {
  // VISUALS
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
  'LASER_SIGHT': 11, // Added
  
  // AUDIO
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

  public emit(eventId: number, arg1: number = 0, arg2: number = 0, arg3: number = 0, arg4: number = 0) {
    if (isNaN(arg1)) return;
    const ptr = (this.writeCursor & MASK) * STRIDE;
    this.buffer[ptr] = eventId;
    this.buffer[ptr + 1] = arg1;
    this.buffer[ptr + 2] = arg2;
    this.buffer[ptr + 3] = arg3;
    this.buffer[ptr + 4] = arg4;
    this.writeCursor++;
  }

  public readEvents(fromCursor: number, handler: (eventId: number, a1: number, a2: number, a3: number, a4: number) => void): number {
    let current = fromCursor;
    if (this.writeCursor - current > BUFFER_SIZE) current = this.writeCursor - BUFFER_SIZE;
    while (current < this.writeCursor) {
      const ptr = (current & MASK) * STRIDE;
      handler(this.buffer[ptr], this.buffer[ptr + 1], this.buffer[ptr + 2], this.buffer[ptr + 3], this.buffer[ptr + 4]);
      current++;
    }
    return current;
  }
  
  public getCursor() { return this.writeCursor; }
}

export const FastEventBus = new FastEventBusController();

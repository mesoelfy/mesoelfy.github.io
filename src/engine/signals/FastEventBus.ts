import { IFastEventService } from '@/engine/interfaces';
import { SYS_LIMITS } from '@/engine/config/constants/SystemConstants';
import { AudioKey, VFXKey } from '@/engine/config/AssetKeys';

// --- CONSTANTS ---
// The "Magic Number" is now a defined constant.
// We scale floats by 100 to store them as integers (2 decimal precision).
export const FLOAT_SCALAR = 100;

export enum FastEventType {
  NONE = 0,
  PLAY_SOUND = 1,
  SPAWN_FX = 2,
  CAM_SHAKE = 3,
  HIT_STOP = 4,
  DUCK_MUSIC = 5
}

export enum SoundCode {
  NONE = 0,
  FX_PLAYER_FIRE = 1,
  FX_IMPACT_LIGHT = 2,
  FX_IMPACT_HEAVY = 3,
  FX_ENEMY_FIRE = 4,
  UI_CLICK = 5,
  UI_HOVER = 6,
  LOOP_DRILL = 7,
  FX_REBOOT_SUCCESS = 8,
  FX_LEVEL_UP = 9,
  LOOP_HEAL = 10,
  LOOP_WARNING = 11,
  FX_TELEPORT = 12,
  FX_EXHAUST_SIZZLE = 13,
  FX_PLAYER_DEATH = 14
}

export enum FXCode {
  NONE = 0,
  EXPLOSION_PURPLE = 1,
  EXPLOSION_YELLOW = 2,
  EXPLOSION_RED = 3,
  IMPACT_WHITE = 4,
  IMPACT_RED = 5,
  DRILL_SPARKS = 6,
  HUNTER_RECOIL = 7,
  CLASH_YELLOW = 8,
  EXPLOSION_PURPLE_DIR = 9,
  EXPLOSION_YELLOW_DIR = 10,
  EXPLOSION_RED_DIR = 11,
  REBOOT_HEAL = 12,
  PURGE_BLAST = 13,
  ENGINE_FLARE = 14
}

export const SOUND_LOOKUP: Record<SoundCode, AudioKey | null> = {
  [SoundCode.NONE]: null,
  [SoundCode.FX_PLAYER_FIRE]: 'fx_player_fire',
  [SoundCode.FX_IMPACT_LIGHT]: 'fx_impact_light',
  [SoundCode.FX_IMPACT_HEAVY]: 'fx_impact_heavy',
  [SoundCode.FX_ENEMY_FIRE]: 'fx_enemy_fire',
  [SoundCode.UI_CLICK]: 'ui_click',
  [SoundCode.UI_HOVER]: 'ui_hover',
  [SoundCode.LOOP_DRILL]: 'loop_drill',
  [SoundCode.FX_REBOOT_SUCCESS]: 'fx_reboot_success',
  [SoundCode.FX_LEVEL_UP]: 'fx_level_up',
  [SoundCode.LOOP_HEAL]: 'loop_heal',
  [SoundCode.LOOP_WARNING]: 'loop_warning',
  [SoundCode.FX_TELEPORT]: 'fx_teleport',
  [SoundCode.FX_EXHAUST_SIZZLE]: 'fx_exhaust_sizzle',
  [SoundCode.FX_PLAYER_DEATH]: 'fx_player_death'
};

export const FX_LOOKUP: Record<FXCode, VFXKey | null> = {
  [FXCode.NONE]: null,
  [FXCode.EXPLOSION_PURPLE]: 'EXPLOSION_PURPLE',
  [FXCode.EXPLOSION_YELLOW]: 'EXPLOSION_YELLOW',
  [FXCode.EXPLOSION_RED]: 'EXPLOSION_RED',
  [FXCode.IMPACT_WHITE]: 'IMPACT_WHITE',
  [FXCode.IMPACT_RED]: 'IMPACT_RED',
  [FXCode.DRILL_SPARKS]: 'DRILL_SPARKS',
  [FXCode.HUNTER_RECOIL]: 'HUNTER_RECOIL',
  [FXCode.CLASH_YELLOW]: 'CLASH_YELLOW',
  [FXCode.EXPLOSION_PURPLE_DIR]: 'EXPLOSION_PURPLE_DIR',
  [FXCode.EXPLOSION_YELLOW_DIR]: 'EXPLOSION_YELLOW_DIR',
  [FXCode.EXPLOSION_RED_DIR]: 'EXPLOSION_RED_DIR',
  [FXCode.REBOOT_HEAL]: 'REBOOT_HEAL',
  [FXCode.PURGE_BLAST]: 'PURGE_BLAST',
  [FXCode.ENGINE_FLARE]: 'ENGINE_FLARE'
};

export const getSoundCode = (key: string): SoundCode => {
    // Reverse lookup (Optimization: Could be cached map if perf becomes issue)
    for (const [code, val] of Object.entries(SOUND_LOOKUP)) {
        if (val === key) return Number(code) as SoundCode;
    }
    return SoundCode.NONE;
};

export const getFXCode = (key: string): FXCode => {
    for (const [code, val] of Object.entries(FX_LOOKUP)) {
        if (val === key) return Number(code) as FXCode;
    }
    return FXCode.NONE;
};

const EVENT_STRIDE = 5;

export class FastEventBusImpl implements IFastEventService {
  private buffer = new Int32Array(SYS_LIMITS.EVENT_BUFFER_SIZE);
  private cursor = 0;

  // --- PRIMITIVE ACCESS (Internal) ---
  private emitRaw(eventId: number, a1: number = 0, a2: number = 0, a3: number = 0, a4: number = 0) {
    if (this.cursor + EVENT_STRIDE >= SYS_LIMITS.EVENT_BUFFER_SIZE) return; 

    this.buffer[this.cursor++] = eventId;
    this.buffer[this.cursor++] = a1;
    this.buffer[this.cursor++] = a2;
    this.buffer[this.cursor++] = a3;
    this.buffer[this.cursor++] = a4;
  }

  // --- TYPED FACADE (Public) ---
  
  public spawnFX(code: FXCode, x: number, y: number, angle: number = 0) {
    this.emitRaw(
      FastEventType.SPAWN_FX, 
      code, 
      Math.round(x * FLOAT_SCALAR), 
      Math.round(y * FLOAT_SCALAR), 
      Math.round(angle * FLOAT_SCALAR)
    );
  }

  public playSound(code: SoundCode, pan: number = 0) {
    this.emitRaw(
      FastEventType.PLAY_SOUND, 
      code, 
      Math.round(pan * FLOAT_SCALAR)
    );
  }

  public camShake(amount: number) {
    this.emitRaw(
      FastEventType.CAM_SHAKE, 
      Math.round(amount * FLOAT_SCALAR)
    );
  }

  public hitStop(ms: number) {
    // MS is an integer, no scaling needed usually, but keeping raw for consistency if needed later
    this.emitRaw(FastEventType.HIT_STOP, ms);
  }

  public duckMusic(intensity: number, duration: number) {
    this.emitRaw(
      FastEventType.DUCK_MUSIC, 
      Math.round(intensity * FLOAT_SCALAR), 
      Math.round(duration * FLOAT_SCALAR)
    );
  }

  // --- PROCESSING ---

  public getCursor(): number {
    return this.cursor;
  }

  public clear() {
    this.cursor = 0;
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

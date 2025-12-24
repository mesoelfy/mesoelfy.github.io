import { PLAYER_CONFIG } from '@/engine/config/PlayerConfig';
import { WAVE_CONFIG } from '@/engine/config/WaveConfig';
import { WorldConfig } from '@/engine/config/WorldConfig';
import { PhysicsConfig } from '@/engine/config/PhysicsConfig';
import { ENEMIES } from '@/engine/config/defs/Enemies';

type PlayerConfigType = typeof PLAYER_CONFIG;
type WorldConfigType = typeof WorldConfig;
type PhysicsConfigType = typeof PhysicsConfig;
type WaveConfigType = typeof WAVE_CONFIG;
type EnemiesConfigType = typeof ENEMIES;

class ConfigServiceController {
  public player: PlayerConfigType = { ...PLAYER_CONFIG };
  public world: WorldConfigType = { ...WorldConfig };
  public physics: PhysicsConfigType = { ...PhysicsConfig };
  public waves: WaveConfigType = { ...WAVE_CONFIG };
  public enemies: EnemiesConfigType = { ...ENEMIES };

  public reset() {
    this.player = { ...PLAYER_CONFIG };
    this.world = { ...WorldConfig };
    this.physics = { ...PhysicsConfig };
    this.waves = { ...WAVE_CONFIG };
    this.enemies = { ...ENEMIES };
  }
}

export const ConfigService = new ConfigServiceController();

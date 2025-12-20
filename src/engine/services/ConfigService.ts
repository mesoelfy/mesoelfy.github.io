import { PLAYER_CONFIG } from '@/engine/config/PlayerConfig';
import { WAVE_CONFIG } from '@/engine/config/WaveConfig';
import { WorldConfig } from '@/engine/config/WorldConfig';
import { PhysicsConfig } from '@/engine/config/PhysicsConfig';

type PlayerConfigType = typeof PLAYER_CONFIG;
type WorldConfigType = typeof WorldConfig;
type PhysicsConfigType = typeof PhysicsConfig;
type WaveConfigType = typeof WAVE_CONFIG;

class ConfigServiceController {
  public player: PlayerConfigType = { ...PLAYER_CONFIG };
  public world: WorldConfigType = { ...WorldConfig };
  public physics: PhysicsConfigType = { ...PhysicsConfig };
  public waves: WaveConfigType = { ...WAVE_CONFIG };

  public reset() {
    this.player = { ...PLAYER_CONFIG };
    this.world = { ...WorldConfig };
    this.physics = { ...PhysicsConfig };
    this.waves = { ...WAVE_CONFIG };
  }
}

export const ConfigService = new ConfigServiceController();

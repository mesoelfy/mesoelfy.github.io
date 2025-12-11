// Default Static Configs
import { PLAYER_CONFIG } from '../config/PlayerConfig';
import { ENEMY_CONFIG, WAVE_CONFIG } from '../config/EnemyConfig';
import { WorldConfig } from '../config/WorldConfig';
import { AI_CONFIG } from '../config/AIConfig';
import { PhysicsConfig } from '../config/PhysicsConfig';

// Types (Inferred)
type PlayerConfigType = typeof PLAYER_CONFIG;
type EnemyConfigType = typeof ENEMY_CONFIG;
type WorldConfigType = typeof WorldConfig;
type AIConfigType = typeof AI_CONFIG;
type PhysicsConfigType = typeof PhysicsConfig;
type WaveConfigType = typeof WAVE_CONFIG;

class ConfigServiceController {
  // Mutable State
  public player: PlayerConfigType = { ...PLAYER_CONFIG };
  public enemies: EnemyConfigType = JSON.parse(JSON.stringify(ENEMY_CONFIG));
  public world: WorldConfigType = { ...WorldConfig };
  public ai: AIConfigType = JSON.parse(JSON.stringify(AI_CONFIG));
  public physics: PhysicsConfigType = { ...PhysicsConfig };
  public waves: WaveConfigType = { ...WAVE_CONFIG };

  public reset() {
    this.player = { ...PLAYER_CONFIG };
    this.enemies = JSON.parse(JSON.stringify(ENEMY_CONFIG));
    this.world = { ...WorldConfig };
    this.ai = JSON.parse(JSON.stringify(AI_CONFIG));
    this.physics = { ...PhysicsConfig };
    this.waves = { ...WAVE_CONFIG };
  }

  // Example: Runtime difficulty tweak
  public setGlobalDifficulty(multiplier: number) {
    for (const key in this.enemies) {
        const enemy = this.enemies[key as keyof EnemyConfigType];
        enemy.hp = Math.ceil(ENEMY_CONFIG[key as keyof EnemyConfigType].hp * multiplier);
        enemy.damage = Math.ceil(ENEMY_CONFIG[key as keyof EnemyConfigType].damage * multiplier);
    }
  }
}

export const ConfigService = new ConfigServiceController();

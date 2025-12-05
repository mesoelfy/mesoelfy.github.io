import { ServiceLocator } from '../core/ServiceLocator';
import { useGameStore } from '../store/useGameStore';
import { ViewportHelper } from '../utils/ViewportHelper';
import { EnemyTypes } from '../config/Identifiers';

export class BreachSystem {
  private lastSpawnTime = 0;
  private SPAWN_INTERVAL = 3.0; // Seconds between breach waves

  public update(time: number) {
    if (!useGameStore.getState().isPlaying) return;

    if (time > this.lastSpawnTime + this.SPAWN_INTERVAL) {
      this.spawnBreachEnemies();
      this.lastSpawnTime = time;
    }
  }

  private spawnBreachEnemies() {
    const panels = useGameStore.getState().panels;
    
    // Find dead panels
    const destroyedPanels = Object.values(panels).filter(p => p.isDestroyed);
    
    if (destroyedPanels.length === 0) return;

    for (const p of destroyedPanels) {
      const rect = ViewportHelper.getPanelWorldRect(p);
      if (!rect) continue;

      // Spawn a fast Muncher or Kamikaze from the center of the dead panel
      // We manually inject the spawn via EntitySystem
      const type = Math.random() > 0.5 ? EnemyTypes.MUNCHER : EnemyTypes.KAMIKAZE;
      const sys = ServiceLocator.entitySystem;
      
      // Manually push to array to override the random position logic in spawnEnemy()
      // OR better: Add a spawnAt() method to EntitySystem. 
      // For now, we will use the internal spawn logic but modify the position immediately after.
      
      // Cleaner approach: Just instantiate data here and push to system.
      // But EntitySystem encapsulates ID logic.
      
      // Let's create a specific spawn method in EntitySystem for this or hack it.
      // Since we want to stick to patterns, let's look at EntitySystem.
      // It lacks a "SpawnAt" method. We will access the array directly for now 
      // to avoid modifying EntitySystem again in this step, but ideal refactor adds spawnAt().
      
      // Actually, let's just modify EntitySystem in the next block if needed.
      // For now, we spawn normally and move it.
      
      sys.spawnEnemy(type);
      const enemy = sys.enemies[sys.enemies.length - 1];
      if (enemy) {
        enemy.x = rect.x;
        enemy.y = rect.y;
        // Give them a little outward velocity immediately
        enemy.vx = (Math.random() - 0.5) * 10;
        enemy.vy = (Math.random() - 0.5) * 10;
      }
    }
  }
}

import { useGameStore } from '../store/useGameStore';
import { GameEventBus } from '../events/GameEventBus';
import { FXManager } from '../systems/FXManager';
import { ServiceLocator } from './ServiceLocator';
import { EntitySystem } from '../systems/EntitySystem';
import { CollisionSystem } from '../systems/CollisionSystem';
import { WaveSystem } from '../systems/WaveSystem';
import { InteractionSystem } from '../systems/InteractionSystem';
import { ViewportHelper } from '../utils/ViewportHelper';

class GameEngineCore {
  private entitySystem: EntitySystem;
  private collisionSystem: CollisionSystem;
  private waveSystem: WaveSystem;
  private interactionSystem: InteractionSystem;
  
  public isRepairing = false;
  private lastFireTime = 0;
  private lastDamageTime = 0; // Tick tracker
  
  private fireRate = 0.15; 
  private cursor = { x: 0, y: 0 };

  // State Tracking for Edge Detection
  private prevPanelHealth: Record<string, number> = {};

  constructor() {
    // 1. Initialize Systems
    FXManager.init();
    this.entitySystem = new EntitySystem();
    this.collisionSystem = new CollisionSystem(this.entitySystem);
    this.waveSystem = new WaveSystem();
    this.interactionSystem = new InteractionSystem();

    // 2. Register to Locator
    ServiceLocator.registerEntitySystem(this.entitySystem);
    ServiceLocator.registerCollisionSystem(this.collisionSystem);
    ServiceLocator.registerWaveSystem(this.waveSystem);
    ServiceLocator.registerFXManager(FXManager);
  }

  // --- PUBLIC ACCESSORS ---
  public get enemies() { return this.entitySystem.enemies; }
  public get bullets() { return this.entitySystem.bullets; }
  public get enemyBullets() { return this.entitySystem.enemyBullets; }
  public get particles() { return this.entitySystem.particles; }

  public updateViewport(vpW: number, vpH: number, screenW: number, screenH: number) {
    ViewportHelper.update(vpW, vpH, screenW, screenH);
  }

  public updateCursor(x: number, y: number) {
    this.cursor = { x, y };
  }

  // --- MAIN LOOP ---
  public update(delta: number, time: number) {
    const { threatLevel } = useGameStore.getState();

    // 1. Systems Update
    this.checkPanelStates();
    
    // 2. Wave Logic
    this.waveSystem.update(time, threatLevel);

    // 3. Interaction Logic
    this.isRepairing = this.interactionSystem.update(time, this.cursor);

    // 4. Player Input (Auto-Fire)
    if (time > this.lastFireTime + this.fireRate) {
      this.attemptFire();
      this.lastFireTime = time;
    }

    // 5. Physics & Entities
    const doDamageTick = time > this.lastDamageTime + 0.5; 
    if (doDamageTick) this.lastDamageTime = time;

    this.entitySystem.update(delta, time, this.cursor, doDamageTick);
    this.collisionSystem.update(this.cursor);
  }

  private checkPanelStates() {
    const panels = useGameStore.getState().panels;
    for (const id in panels) {
      const currentHealth = panels[id].health;
      const prevHealth = this.prevPanelHealth[id]; 
      if (prevHealth !== undefined && prevHealth > 0 && currentHealth <= 0) {
        GameEventBus.emit('PANEL_DESTROYED', { id });
      }
      this.prevPanelHealth[id] = currentHealth;
    }
  }

  private attemptFire() {
    // Ideally moves to a PlayerSystem later
    let nearestDist = Infinity;
    const RANGE = 12; 
    let hasTarget = false;

    for (const e of this.entitySystem.enemies) {
      if (!e.active) continue;
      const dx = e.x - this.cursor.x;
      const dy = e.y - this.cursor.y;
      const dist = dx*dx + dy*dy;

      if (dist < (RANGE * RANGE)) {
        hasTarget = true;
        break; 
      }
    }

    if (hasTarget) {
      let targetEnemy: any = null;
      for (const e of this.entitySystem.enemies) {
        if (!e.active) continue;
        const dx = e.x - this.cursor.x;
        const dy = e.y - this.cursor.y;
        const dist = dx*dx + dy*dy;
        if (dist < nearestDist) {
          nearestDist = dist;
          targetEnemy = e;
        }
      }

      if (targetEnemy) {
        const dx = targetEnemy.x - this.cursor.x;
        const dy = targetEnemy.y - this.cursor.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        const SPEED = 45;
        
        this.entitySystem.spawnBullet(
            this.cursor.x, 
            this.cursor.y, 
            (dx / dist) * SPEED, 
            (dy / dist) * SPEED, 
            false, 
            1.5, 
            0.2
        );
        
        GameEventBus.emit('PLAYER_FIRED', { x: this.cursor.x, y: this.cursor.y });
      }
    }
  }
}

export const GameEngine = new GameEngineCore();

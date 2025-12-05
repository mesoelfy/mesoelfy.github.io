import { useGameStore } from '../store/useGameStore';
import { GameEventBus } from '../events/GameEventBus';
import { FXManager } from '../systems/FXManager';
import { ServiceLocator } from './ServiceLocator';
import { EntitySystem } from '../systems/EntitySystem';
import { CollisionSystem } from '../systems/CollisionSystem';
import { WAVE_CONFIG } from '../config/EnemyConfig';
import { Enemy } from '../types/game.types';

class GameEngineCore {
  private entitySystem: EntitySystem;
  private collisionSystem: CollisionSystem;
  
  public isRepairing = false;
  
  private lastSpawnTime = 0;
  private lastFireTime = 0;
  private lastRepairTime = 0;
  
  // FIX: Restore damage tick tracking
  private lastDamageTime = 0;
  
  private fireRate = 0.15; 
  private cursor = { x: 0, y: 0 };
  private viewport = { width: 1, height: 1 };
  private screenSize = { width: 1, height: 1 };

  private prevPanelHealth: Record<string, number> = {};

  constructor() {
    FXManager.init();
    this.entitySystem = new EntitySystem();
    this.collisionSystem = new CollisionSystem(this.entitySystem);

    ServiceLocator.registerEntitySystem(this.entitySystem);
    ServiceLocator.registerCollisionSystem(this.collisionSystem);
    ServiceLocator.registerFXManager(FXManager);
  }

  public get enemies() { return this.entitySystem.enemies; }
  public get bullets() { return this.entitySystem.bullets; }
  public get enemyBullets() { return this.entitySystem.enemyBullets; }
  public get particles() { return this.entitySystem.particles; }

  public updateViewport(vpW: number, vpH: number, screenW: number, screenH: number) {
    this.viewport = { width: vpW, height: vpH };
    this.screenSize = { width: screenW, height: screenH };
  }

  public updateCursor(x: number, y: number) {
    this.cursor = { x, y };
  }

  public update(delta: number, time: number) {
    const { threatLevel } = useGameStore.getState();

    this.checkPanelStates();

    if (time > this.lastSpawnTime + (WAVE_CONFIG.baseSpawnInterval / threatLevel)) {
      this.spawnEnemy();
      this.lastSpawnTime = time;
    }

    this.attemptRepair(time);

    if (time > this.lastFireTime + this.fireRate) {
      this.attemptFire();
      this.lastFireTime = time;
    }

    // FIX: Calculate Damage Tick
    const doDamageTick = time > this.lastDamageTime + 0.5; 
    if (doDamageTick) this.lastDamageTime = time;

    // FIX: Pass tick to system
    this.entitySystem.update(delta, time, this.cursor, this.viewport, doDamageTick);
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

  private spawnEnemy() {
    const rand = Math.random();
    let type: Enemy['type'] = 'muncher';
    if (rand < 0.50) type = 'muncher';
    else if (rand < 0.80) type = 'kamikaze';
    else type = 'hunter';

    this.entitySystem.spawnEnemy(type);
  }

  private attemptFire() {
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

  private attemptRepair(time: number) {
    const getRect = (panel: any) => {
        if (!panel.element) return null;
        const rect = panel.element.getBoundingClientRect();
        if (rect.width === 0) return null;
        const sw = window.innerWidth; 
        const sh = window.innerHeight;
        const vw = this.viewport.width;
        const vh = this.viewport.height;
        
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const wx = (cx / sw) * vw - (vw / 2);
        const wy = -((cy / sh) * vh - (vh / 2));
        const wWidth = (rect.width / sw) * vw;
        const wHeight = (rect.height / sh) * vh;
        return {
            id: panel.id,
            left: wx - wWidth / 2, right: wx + wWidth / 2,
            top: wy + wHeight / 2, bottom: wy - wHeight / 2,
        };
    };

    const panels = useGameStore.getState().panels;
    const healFn = useGameStore.getState().healPanel;
    const REPAIR_RATE = 0.05; 

    if (time < this.lastRepairTime + REPAIR_RATE) return;

    let isHoveringPanel = false;

    for (const pKey in panels) {
      const p = panels[pKey];
      if (p.isDestroyed || p.health >= 1000) continue;

      const r = getRect(p);
      if (!r) continue;

      if (
        this.cursor.x >= r.left && 
        this.cursor.x <= r.right && 
        this.cursor.y >= r.bottom && 
        this.cursor.y <= r.top
      ) {
        isHoveringPanel = true;
        healFn(p.id, 10); 
        this.lastRepairTime = time;
        GameEventBus.emit('PANEL_HEALED', { id: p.id, amount: 10 });
        
        if (Math.random() > 0.6) {
            this.entitySystem.spawnParticle(this.cursor.x, this.cursor.y, '#00F0FF', 1);
        }
        break; 
      }
    }
    this.isRepairing = isHoveringPanel;
  }
}

export const GameEngine = new GameEngineCore();

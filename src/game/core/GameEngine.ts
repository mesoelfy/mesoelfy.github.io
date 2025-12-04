import * as THREE from 'three';
import { useGameStore } from '../store/useGameStore';
import { GameEventBus } from '../events/GameEventBus';
import { FXManager } from '../systems/FXManager';
import { ENEMY_CONFIG, WAVE_CONFIG } from '../config/EnemyConfig';
import { Behaviors, AIContext } from '../logic/ai/EnemyBehaviors';

export interface Entity {
  id: number;
  x: number;
  y: number;
  radius: number;
  active: boolean;
}

export interface Enemy extends Entity {
  vx: number;
  vy: number;
  hp: number;
  type: 'muncher' | 'kamikaze' | 'hunter';
  state?: 'orbit' | 'charge' | 'fire';
  stateTimer?: number;
  targetId?: string; 
  isEating?: boolean;
  orbitAngle?: number; 
}

export interface Bullet extends Entity {
  vx: number;
  vy: number;
  life: number;
  isEnemy?: boolean;
}

export interface Particle extends Entity {
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
}

class GameEngineCore {
  public enemies: Enemy[] = [];
  public bullets: Bullet[] = [];
  public enemyBullets: Bullet[] = [];
  public particles: Particle[] = [];
  
  public isRepairing = false;
  
  private lastSpawnTime = 0;
  private lastFireTime = 0;
  private lastDamageTime = 0;
  private lastRepairTime = 0;
  
  private fireRate = 0.15; 
  private cursor = { x: 0, y: 0 };
  
  private idCounter = 0;
  private viewport = { width: 1, height: 1 };
  private screenSize = { width: 1, height: 1 };

  // State Tracking for Edge Detection
  private prevPanelHealth: Record<string, number> = {};

  constructor() {
    FXManager.init();
  }

  public updateViewport(vpW: number, vpH: number, screenW: number, screenH: number) {
    this.viewport = { width: vpW, height: vpH };
    this.screenSize = { width: screenW, height: screenH };
  }

  public updateCursor(x: number, y: number) {
    this.cursor = { x, y };
  }

  private getPanelWorldRect(panel: any) {
    if (!panel.element) return null;

    const rect = panel.element.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) return null;

    const { width: vw, height: vh } = this.viewport;
    const { width: sw, height: sh } = this.screenSize;
    
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    
    const wx = (cx / sw) * vw - (vw / 2);
    const wy = -((cy / sh) * vh - (vh / 2));
    const wWidth = (rect.width / sw) * vw;
    const wHeight = (rect.height / sh) * vh;

    return {
      id: panel.id,
      x: wx, y: wy,
      width: wWidth, height: wHeight,
      left: wx - wWidth / 2, right: wx + wWidth / 2,
      top: wy + wHeight / 2, bottom: wy - wHeight / 2,
    };
  }

  public update(delta: number, time: number) {
    const { threatLevel } = useGameStore.getState();

    // 1. Check Panel Deaths (Global Check)
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

    const doDamageTick = time > this.lastDamageTime + 0.5; 
    if (doDamageTick) this.lastDamageTime = time;

    this.updateEnemies(delta, time, doDamageTick);
    this.updateBullets(this.bullets, delta);
    this.updateBullets(this.enemyBullets, delta);
    this.updateParticles(delta);
    
    this.checkCollisions();
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

  private attemptRepair(time: number) {
    const panels = useGameStore.getState().panels;
    const healFn = useGameStore.getState().healPanel;
    const REPAIR_RATE = 0.05; 

    if (time < this.lastRepairTime + REPAIR_RATE) return;

    let isHoveringPanel = false;

    for (const pKey in panels) {
      const p = panels[pKey];
      if (p.isDestroyed || p.health >= 1000) continue;

      const r = this.getPanelWorldRect(p);
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
        if (Math.random() > 0.6) this.explode(this.cursor.x, this.cursor.y, 1, '#00F0FF');
        break; 
      }
    }
    this.isRepairing = isHoveringPanel;
  }

  // --- LOGIC REFACTOR START ---
  // The logic inside this function has been extracted to strategies.
  private updateEnemies(delta: number, time: number, doDamageTick: boolean) {
    const panels = useGameStore.getState().panels;
    
    // Prepare Context for AI
    const worldPanels = Object.values(panels)
      .filter(p => !p.isDestroyed)
      .map(p => this.getPanelWorldRect(p))
      .filter(r => r !== null);

    const ctx: AIContext = {
      playerPos: this.cursor,
      panels: worldPanels,
      delta: delta,
      time: time,
      spawnProjectile: (x, y, vx, vy) => this.spawnEnemyBullet(x, y, vx, vy),
      triggerExplosion: (x, y, color) => this.explode(x, y, 20, color),
      emitEvent: (name, payload) => {
        if (name === 'PLAYER_HIT') GameEventBus.emit('PLAYER_HIT', payload);
      },
      damagePanel: (id, amount) => {
        if (doDamageTick) {
          const currentHp = panels[id].health;
          useGameStore.getState().damagePanel(id, amount);
          this.explode(this.cursor.x, this.cursor.y, 1, '#9E4EA5'); // Fallback visual pos? Strategy should pass pos
          
          if (currentHp > 0) {
             GameEventBus.emit('PANEL_DAMAGED', { 
                id: id, 
                amount: amount, 
                currentHealth: currentHp - amount
             });
          }
        }
      }
    };

    for (const e of this.enemies) {
      if (!e.active) continue;

      const behavior = Behaviors[e.type];
      if (behavior) {
        behavior.update(e, ctx);
      }

      // Handle Muncher Damage Logic specifically here if not in Strategy?
      // Strategy sets 'isEating'. We handle the tick damage application here or in strategy?
      // In Strategy file we commented it out. Let's re-integrate basic tick logic in Strategy
      // or keep it here.
      // Ideally Strategy does it via `damagePanel` callback in Context.
      
      // Let's add specific logic for Muncher eating here if we want to keep the tick logic centralized
      // OR update the Strategy to use the callback properly.
      // Updated Strategy above assumes callback.
      // However, Muncher Strategy needs to know WHICH panel it is eating.
      
      // RE-INTEGRATION FIX:
      // The strategy calculates targetX/targetY.
      // To strictly follow Strategy pattern, the strategy should call context.damagePanel().
      // For now, let's keep the isEating logic in the loop if needed, OR trust the strategy.
      // The logic in strategy was: 
      // "if (distToEdge < 0.5) e.isEating = true"
      // But it didn't call damagePanel.
      
      // Let's patch:
      if (e.type === 'muncher' && e.isEating && doDamageTick) {
         // We need to find the panel again? Inefficient.
         // Better: Context passes panels, Strategy finds panel, Strategy calls damagePanel.
         // Let's update `MuncherBehavior` in next pass or trust the loop?
         
         // For this step, I will execute a quick search here to maintain functionality 
         // until Phase 2 of refactor.
         for (const p of worldPanels) {
            if (!p) continue;
            // Simple AABB check for eating range
            if (e.x >= p.left - 0.5 && e.x <= p.right + 0.5 &&
                e.y >= p.bottom - 0.5 && e.y <= p.top + 0.5) {
                  // Only damage valid panels
                  useGameStore.getState().damagePanel(p.id, ENEMY_CONFIG.muncher.damage);
                  this.explode(e.x, e.y, 1, '#9E4EA5');
                  GameEventBus.emit('PANEL_DAMAGED', { 
                    id: p.id, amount: ENEMY_CONFIG.muncher.damage, currentHealth: panels[p.id].health 
                  });
            }
         }
      }
    }
    
    this.enemies = this.enemies.filter(e => e.active);
  }
  // --- LOGIC REFACTOR END ---

  private spawnEnemy() {
    const angle = Math.random() * Math.PI * 2;
    const radius = 60; 
    const rand = Math.random();
    
    let type: Enemy['type'] = 'muncher';
    
    if (rand < 0.50) type = 'muncher';
    else if (rand < 0.80) type = 'kamikaze';
    else type = 'hunter';

    const config = ENEMY_CONFIG[type];

    const enemy: Enemy = {
      id: this.idCounter++,
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
      vx: 0, vy: 0,
      radius: config.radius,
      hp: config.hp,
      type,
      active: true,
      orbitAngle: Math.random() * Math.PI * 2
    };

    this.enemies.push(enemy);
    GameEventBus.emit('ENEMY_SPAWNED', { type: type, id: enemy.id });
  }

  private spawnEnemyBullet(x: number, y: number, vx: number, vy: number) {
    this.enemyBullets.push({
      id: this.idCounter++,
      x: x,
      y: y,
      vx: vx,
      vy: vy,
      radius: 0.9, 
      active: true,
      life: 3.0,
      isEnemy: true
    });
  }

  private attemptFire() {
    let nearestDist = Infinity;
    let targetEnemy: Enemy | null = null;
    const RANGE = 12; 

    for (const e of this.enemies) {
      if (!e.active) continue;
      const dx = e.x - this.cursor.x;
      const dy = e.y - this.cursor.y;
      const dist = dx*dx + dy*dy;

      if (dist < (RANGE * RANGE) && dist < nearestDist) {
        nearestDist = dist;
        targetEnemy = e;
      }
    }

    if (targetEnemy) {
      const dx = targetEnemy.x - this.cursor.x;
      const dy = targetEnemy.y - this.cursor.y;
      const dist = Math.sqrt(dx*dx + dy*dy);
      const SPEED = 45;

      this.bullets.push({
        id: this.idCounter++,
        x: this.cursor.x,
        y: this.cursor.y,
        vx: (dx / dist) * SPEED,
        vy: (dy / dist) * SPEED,
        radius: 0.2,
        active: true,
        life: 1.5,
        isEnemy: false
      });
      GameEventBus.emit('PLAYER_FIRED', { x: this.cursor.x, y: this.cursor.y });
    }
  }

  private updateBullets(list: Bullet[], delta: number) {
    for (const b of list) {
      if (!b.active) continue;
      b.x += b.vx * delta;
      b.y += b.vy * delta;
      b.life -= delta;
      if (b.life <= 0) b.active = false;
    }
    
    if (list === this.bullets) {
        this.bullets = this.bullets.filter(b => b.active);
    } else {
        this.enemyBullets = this.enemyBullets.filter(b => b.active);
    }
  }

  private checkCollisions() {
    for (const b of this.bullets) {
      if (!b.active) continue;
      for (const e of this.enemies) {
        if (!e.active) continue;
        const dx = b.x - e.x;
        const dy = b.y - e.y;
        const distSq = dx*dx + dy*dy;
        const radiusSum = b.radius + e.radius;

        if (distSq < radiusSum * radiusSum) {
          e.hp--;
          b.active = false;
          GameEventBus.emit('ENEMY_DAMAGED', { id: e.id, damage: 1, type: e.type });

          if (e.hp <= 0) {
            e.active = false;
            this.explode(e.x, e.y, 8, e.type === 'hunter' ? '#F7D277' : e.type === 'kamikaze' ? '#FF003C' : '#9E4EA5');
            GameEventBus.emit('ENEMY_DESTROYED', { id: e.id, type: e.type, x: e.x, y: e.y });
          } else {
            this.explode(b.x, b.y, 2, '#FFF');
          }
          break;
        }
      }
    }

    for (const eb of this.enemyBullets) {
        if (!eb.active) continue;
        const dx = eb.x - this.cursor.x;
        const dy = eb.y - this.cursor.y;
        const distSq = dx*dx + dy*dy;
        
        if (distSq < (eb.radius + 0.5) ** 2) {
            eb.active = false;
            GameEventBus.emit('PLAYER_HIT', { damage: 10 });
            this.explode(eb.x, eb.y, 5, '#FF003C');
        }
    }

    for (const pb of this.bullets) {
        if (!pb.active) continue;
        for (const eb of this.enemyBullets) {
            if (!eb.active) continue;
            
            const dx = pb.x - eb.x;
            const dy = pb.y - eb.y;
            const distSq = dx*dx + dy*dy;
            
            if (distSq < (pb.radius + eb.radius) ** 2) {
                pb.active = false;
                eb.active = false;
                
                GameEventBus.emit('PROJECTILE_CLASH', { x: eb.x, y: eb.y });
                this.explode(eb.x, eb.y, 6, '#F7D277');
                break;
            }
        }
    }
  }

  private updateParticles(delta: number) {
    for (const p of this.particles) {
      if (!p.active) continue;
      p.x += p.vx * delta;
      p.y += p.vy * delta;
      p.life -= delta;
      if (p.life <= 0) p.active = false;
    }
    this.particles = this.particles.filter(p => p.active);
  }

  private explode(x: number, y: number, count: number, color: string) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 10 + 5;
      this.particles.push({
        id: this.idCounter++,
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.5 + Math.random() * 0.5,
        maxLife: 1.0,
        active: true,
        radius: 0.1,
        color
      });
    }
  }
}

export const GameEngine = new GameEngineCore();

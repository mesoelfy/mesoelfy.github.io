import * as THREE from 'three';
import { useGameStore } from '../store/useGameStore';
import { GameEventBus } from '../events/GameEventBus';
import { FXManager } from '../systems/FXManager';

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

const HUNTER_OFFSET_DISTANCE = 1.6;

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
  
  private spawnInterval = 0.8; 
  private fireRate = 0.15; 
  private cursor = { x: 0, y: 0 };
  
  private idCounter = 0;
  private bounds = { width: 1920, height: 1080 };
  private viewport = { width: 1, height: 1 };
  private screenSize = { width: 1, height: 1 };

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

  // UPDATED: Now queries the live DOM element for perfect sync
  private getPanelWorldRect(panel: any) {
    if (!panel.element) return null;

    const rect = panel.element.getBoundingClientRect();
    
    // Safety check if element is off screen or detached
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

    if (time > this.lastSpawnTime + (this.spawnInterval / threatLevel)) {
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

  private updateEnemies(delta: number, time: number, doDamageTick: boolean) {
    const panels = useGameStore.getState().panels;
    const damageFn = useGameStore.getState().damagePanel;
    
    // Re-calculate world rects every frame to handle scrolling/animation
    const worldPanels = Object.values(panels)
      .map(p => this.getPanelWorldRect(p))
      .filter(r => r !== null);

    for (const e of this.enemies) {
      if (!e.active) continue;

      let targetX = 0;
      let targetY = 0;

      if (e.type === 'kamikaze') {
        targetX = this.cursor.x;
        targetY = this.cursor.y;
        
        const dx = targetX - e.x;
        const dy = targetY - e.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        
        if (dist < 1.0) {
           e.active = false;
           this.explode(e.x, e.y, 20, '#FF003C');
           GameEventBus.emit('PLAYER_HIT', { damage: 10 });
           continue; 
        }
      } 
      else if (e.type === 'hunter') {
        if (!e.state) e.state = 'orbit';
        if (!e.stateTimer) e.stateTimer = 2.0 + Math.random() * 2.0;

        e.stateTimer -= delta;

        if (e.state === 'orbit') {
          if (!e.orbitAngle) e.orbitAngle = Math.random() * Math.PI * 2;
          const speedVar = 0.7 + Math.sin(time * 0.8 + e.id) * 0.5;
          e.orbitAngle += delta * speedVar; 
          const breathe = Math.sin(time * 1.5 + e.id) * 5.5; 
          const orbitRadius = 12.5 + breathe; 
          
          targetX = this.cursor.x + Math.cos(e.orbitAngle) * orbitRadius;
          targetY = this.cursor.y + Math.sin(e.orbitAngle) * orbitRadius;

          if (e.stateTimer <= 0) {
            e.state = 'charge';
            e.stateTimer = 1.0; 
            e.vx = 0;
            e.vy = 0;
          }
        } 
        else if (e.state === 'charge') {
          targetX = e.x; 
          targetY = e.y;

          if (e.stateTimer <= 0) {
            e.state = 'fire';
          }
        }
        else if (e.state === 'fire') {
          const dx = this.cursor.x - e.x;
          const dy = this.cursor.y - e.y;
          const dist = Math.sqrt(dx*dx + dy*dy);
          const dirX = dist > 0 ? dx/dist : 0;
          const dirY = dist > 0 ? dy/dist : 1;
          
          const spawnX = e.x + (dirX * HUNTER_OFFSET_DISTANCE);
          const spawnY = e.y + (dirY * HUNTER_OFFSET_DISTANCE);

          this.spawnEnemyBullet(spawnX, spawnY);
          e.state = 'orbit';
          e.stateTimer = 3.0 + Math.random() * 2.0;
        }
      }
      else {
        // MUNCHER LOGIC
        let nearestDist = Infinity;
        let bestPanel: any = null;

        for (const p of worldPanels) {
          // Type guard for filter nulls
          if (!p) continue; 
          
          if (panels[p.id].isDestroyed) continue;
          if (p.id === 'feed') continue; 
          const dx = p.x - e.x;
          const dy = p.y - e.y;
          const dist = dx*dx + dy*dy;
          if (dist < nearestDist) {
            nearestDist = dist;
            bestPanel = p;
          }
        }

        if (bestPanel) {
          targetX = Math.max(bestPanel.left, Math.min(e.x, bestPanel.right));
          targetY = Math.max(bestPanel.bottom, Math.min(e.y, bestPanel.top));
          
          const dx = targetX - e.x;
          const dy = targetY - e.y;
          const distToEdge = Math.sqrt(dx*dx + dy*dy);

          if (distToEdge < 0.5) { 
            e.isEating = true;
            if (doDamageTick) {
              damageFn(bestPanel.id, 5); 
              this.explode(targetX, targetY, 1, '#9E4EA5');
              GameEventBus.emit('PANEL_DAMAGED', { 
                id: bestPanel.id, 
                amount: 5, 
                currentHealth: panels[bestPanel.id].health 
              });
            }
          } else {
            e.isEating = false;
          }
        } else {
          targetX = Math.sin(time) * 5;
          targetY = Math.cos(time) * 5;
        }
      }

      if (!e.isEating && e.state !== 'charge') {
        const dx = targetX - e.x;
        const dy = targetY - e.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        
        let speed = 8;
        if (e.type === 'hunter') speed = 12; 
        else if (e.type === 'kamikaze') speed = 12; 

        if (dist > 0.1) {
          e.vx = (dx / dist) * speed * delta;
          e.vy = (dy / dist) * speed * delta;
        }
        e.x += e.vx;
        e.y += e.vy;
      }
    }
    
    this.enemies = this.enemies.filter(e => e.active);
  }

  private spawnEnemy() {
    const angle = Math.random() * Math.PI * 2;
    const radius = 60; 
    const rand = Math.random();
    
    let type: Enemy['type'] = 'muncher';
    let hp = 2;
    let radiusHit = 0.5;

    if (rand < 0.50) {
      type = 'muncher';
      hp = 2;
    } else if (rand < 0.80) {
      type = 'kamikaze';
      hp = 1; 
    } else {
      type = 'hunter';
      hp = 3;
    }

    const enemy: Enemy = {
      id: this.idCounter++,
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
      vx: 0, vy: 0,
      radius: radiusHit,
      hp,
      type,
      active: true,
      orbitAngle: Math.random() * Math.PI * 2
    };

    this.enemies.push(enemy);
    GameEventBus.emit('ENEMY_SPAWNED', { type: type, id: enemy.id });
  }

  private spawnEnemyBullet(x: number, y: number) {
    const dx = this.cursor.x - x;
    const dy = this.cursor.y - y;
    const dist = Math.sqrt(dx*dx + dy*dy);
    const SPEED = 25; 

    this.enemyBullets.push({
      id: this.idCounter++,
      x: x,
      y: y,
      vx: (dx / dist) * SPEED,
      vy: (dy / dist) * SPEED,
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

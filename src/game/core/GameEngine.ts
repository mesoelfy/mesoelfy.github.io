import * as THREE from 'three';
import { useGameStore } from '../store/useGameStore';
import { domRectToWorldRect } from '../utils/coords';

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
  type: 'seeker' | 'kamikaze' | 'hunter';
  targetId?: string; 
  isEating?: boolean;
  orbitAngle?: number; 
}

export interface Bullet extends Entity {
  vx: number;
  vy: number;
  life: number;
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

  public updateViewport(vpW: number, vpH: number, screenW: number, screenH: number) {
    this.viewport = { width: vpW, height: vpH };
    this.screenSize = { width: screenW, height: screenH };
  }

  public updateCursor(x: number, y: number) {
    this.cursor = { x, y };
  }

  private getPanelWorldRect(panel: any) {
    const { width: vw, height: vh } = this.viewport;
    const { width: sw, height: sh } = this.screenSize;
    const cx = panel.x + panel.width / 2;
    const cy = panel.y + panel.height / 2;
    const wx = (cx / sw) * vw - (vw / 2);
    const wy = -((cy / sh) * vh - (vh / 2));
    const wWidth = (panel.width / sw) * vw;
    const wHeight = (panel.height / sh) * vh;

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
    this.updateBullets(delta);
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

      if (
        this.cursor.x >= r.left && 
        this.cursor.x <= r.right && 
        this.cursor.y >= r.bottom && 
        this.cursor.y <= r.top
      ) {
        isHoveringPanel = true;
        healFn(p.id, 10); 
        this.lastRepairTime = time;
        if (Math.random() > 0.6) {
           this.explode(this.cursor.x, this.cursor.y, 1, '#00F0FF');
        }
        break; 
      }
    }
    this.isRepairing = isHoveringPanel;
  }

  private updateEnemies(delta: number, time: number, doDamageTick: boolean) {
    const panels = useGameStore.getState().panels;
    const damageFn = useGameStore.getState().damagePanel;
    const worldPanels = Object.values(panels).map(p => this.getPanelWorldRect(p));

    for (const e of this.enemies) {
      if (!e.active) continue;

      let targetX = 0;
      let targetY = 0;

      // 1. KAMIKAZE: Chases Player
      if (e.type === 'kamikaze') {
        targetX = this.cursor.x;
        targetY = this.cursor.y;
        
        const dx = targetX - e.x;
        const dy = targetY - e.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        
        if (dist < 1.0) {
           e.active = false;
           this.explode(e.x, e.y, 20, '#FF003C');
           continue; 
        }
      } 
      
      // --- 2. HUNTER: Dynamic Orbit ---
      else if (e.type === 'hunter') {
        if (!e.orbitAngle) e.orbitAngle = Math.random() * Math.PI * 2;
        
        // UNIQUE FLAVOR: Variable Speed
        // Uses ID as offset so they don't sync. speed oscillates between 0.2 and 1.2
        const speedVar = 0.7 + Math.sin(time * 0.8 + e.id) * 0.5;
        e.orbitAngle += delta * speedVar; 

        // UNIQUE FLAVOR: Breathing Radius
        // Radius oscillates between 7 and 18 based on time and ID
        const breathe = Math.sin(time * 1.5 + e.id) * 5.5; 
        const orbitRadius = 12.5 + breathe; 
        
        targetX = this.cursor.x + Math.cos(e.orbitAngle) * orbitRadius;
        targetY = this.cursor.y + Math.sin(e.orbitAngle) * orbitRadius;
      }
      
      // 3. SEEKER: Targets Panels
      else {
        let nearestDist = Infinity;
        let bestPanel: any = null;

        for (const p of worldPanels) {
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
            if (e.type === 'seeker' && doDamageTick) {
              damageFn(bestPanel.id, 5); 
              this.explode(targetX, targetY, 1, '#9E4EA5'); 
            }
          } else {
            e.isEating = false;
          }
        } else {
          // Wander
          targetX = Math.sin(time) * 5;
          targetY = Math.cos(time) * 5;
        }
      }

      // Physics Move (Smoothing)
      if (!e.isEating) {
        const dx = targetX - e.x;
        const dy = targetY - e.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        
        let speed = 0;
        if (e.type === 'hunter') speed = 12; // Moderate to allow drift
        else if (e.type === 'kamikaze') speed = 12; 
        else speed = 8; 

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
    
    let type: Enemy['type'] = 'seeker';
    let hp = 2;
    let radiusHit = 0.5;

    // Equal Spawns for Dev
    if (rand < 0.33) {
      type = 'seeker';
      hp = 2;
    } else if (rand < 0.66) {
      type = 'hunter';
      hp = 3;
    } else {
      type = 'kamikaze';
      hp = 1; 
    }

    this.enemies.push({
      id: this.idCounter++,
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
      vx: 0, vy: 0,
      radius: radiusHit,
      hp,
      type,
      active: true,
      orbitAngle: Math.random() * Math.PI * 2
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
        life: 1.5
      });
    }
  }

  private updateBullets(delta: number) {
    for (const b of this.bullets) {
      if (!b.active) continue;
      b.x += b.vx * delta;
      b.y += b.vy * delta;
      b.life -= delta;
      if (b.life <= 0) b.active = false;
    }
    this.bullets = this.bullets.filter(b => b.active);
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
          if (e.hp <= 0) {
            e.active = false;
            this.explode(e.x, e.y, 8, e.type === 'hunter' ? '#F7D277' : e.type === 'kamikaze' ? '#FF003C' : '#9E4EA5');
          } else {
            this.explode(b.x, b.y, 2, '#FFF');
          }
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

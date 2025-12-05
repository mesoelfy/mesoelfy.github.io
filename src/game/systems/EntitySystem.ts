import { Enemy, Bullet, Particle } from '../types/game.types';
import { Behaviors, AIContext } from '../logic/ai/EnemyBehaviors';
import { ENEMY_CONFIG } from '../config/EnemyConfig';
import { GameEventBus } from '../events/GameEventBus';
import { useGameStore } from '../store/useGameStore';

export class EntitySystem {
  public enemies: Enemy[] = [];
  public bullets: Bullet[] = [];
  public enemyBullets: Bullet[] = [];
  public particles: Particle[] = [];

  private idCounter = 0;

  public spawnEnemy(type: Enemy['type']): void {
    const config = ENEMY_CONFIG[type];
    const angle = Math.random() * Math.PI * 2;
    const radius = 60; 

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

  public spawnBullet(x: number, y: number, vx: number, vy: number, isEnemy: boolean, life = 1.5, radius = 0.2): void {
    const list = isEnemy ? this.enemyBullets : this.bullets;
    list.push({
      id: this.idCounter++,
      x, y, vx, vy,
      life,
      active: true,
      isEnemy,
      radius
    });
  }

  public spawnParticle(x: number, y: number, color: string, count: number): void {
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

  // FIX: Accept doDamageTick parameter
  public update(delta: number, time: number, cursor: {x: number, y: number}, viewport: {width: number, height: number}, doDamageTick: boolean) {
    this.updateEnemies(delta, time, cursor, viewport, doDamageTick);
    this.updateBullets(this.bullets, delta);
    this.updateBullets(this.enemyBullets, delta);
    this.updateParticles(delta);
  }

  // FIX: Accept doDamageTick parameter
  private updateEnemies(delta: number, time: number, cursor: {x: number, y: number}, viewport: {width: number, height: number}, doDamageTick: boolean) {
    const panels = useGameStore.getState().panels;
    
    const worldPanels = Object.values(panels)
      .filter(p => !p.isDestroyed)
      .map(p => this.getPanelWorldRect(p, viewport))
      .filter(r => r !== null);

    const ctx: AIContext = {
      playerPos: cursor,
      panels: worldPanels,
      delta: delta,
      time: time,
      doDamageTick: doDamageTick, // FIX: Pass to context
      spawnProjectile: (x, y, vx, vy) => this.spawnBullet(x, y, vx, vy, true, 3.0, 0.9),
      triggerExplosion: (x, y, color) => this.spawnParticle(x, y, color, 20),
      emitEvent: (name, payload) => GameEventBus.emit(name as any, payload),
      damagePanel: (id, amount) => {
        // Ideally we emit an event here, but direct store access is the current pattern
        useGameStore.getState().damagePanel(id, amount);
        
        // Also emit event for VFX/Shake
        const currentHp = panels[id].health;
        if (currentHp > 0) {
             GameEventBus.emit('PANEL_DAMAGED', { 
                id: id, 
                amount: amount, 
                currentHealth: currentHp - amount
             });
        }
      }
    };

    for (const e of this.enemies) {
      if (!e.active) continue;
      const behavior = Behaviors[e.type];
      if (behavior) {
        behavior.update(e, ctx);
      }
    }
    
    this.enemies = this.enemies.filter(e => e.active);
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

  private getPanelWorldRect(panel: any, viewport: {width: number, height: number}) {
    if (!panel.element) return null;
    const rect = panel.element.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) return null;

    const sw = window.innerWidth; 
    const sh = window.innerHeight;
    
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    
    const wx = (cx / sw) * viewport.width - (viewport.width / 2);
    const wy = -((cy / sh) * viewport.height - (viewport.height / 2));
    const wWidth = (rect.width / sw) * viewport.width;
    const wHeight = (rect.height / sh) * viewport.height;

    return {
      id: panel.id,
      x: wx, y: wy,
      width: wWidth, height: wHeight,
      left: wx - wWidth / 2, right: wx + wWidth / 2,
      top: wy + wHeight / 2, bottom: wy - wHeight / 2,
    };
  }
}

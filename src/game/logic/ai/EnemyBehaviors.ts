// src/game/logic/ai/EnemyBehaviors.ts
import { Enemy } from '../../core/GameEngine';
import { ENEMY_CONFIG } from '../../config/EnemyConfig';

// --- Context Interface ---
export interface AIContext {
  playerPos: { x: number, y: number };
  panels: any[]; // World Rects
  delta: number;
  time: number;
  doDamageTick: boolean; // NEW: Global tick for DoT effects
  spawnProjectile: (x: number, y: number, vx: number, vy: number) => void;
  damagePanel: (id: string, amount: number) => void;
  triggerExplosion: (x: number, y: number, color: string) => void;
  emitEvent: (name: string, payload: any) => void;
}

// --- The Strategy Interface ---
export interface EnemyBehavior {
  update(enemy: Enemy, ctx: AIContext): void;
}

// --- Concrete Strategies ---

export const MuncherBehavior: EnemyBehavior = {
  update: (e, ctx) => {
    let targetX = 0;
    let targetY = 0;
    
    // 1. Find Nearest Panel
    let nearestDist = Infinity;
    let bestPanel: any = null;

    const validPanels = ctx.panels.filter(p => p.id !== 'feed');

    for (const p of validPanels) {
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
        // FIX: Actually apply damage on tick
        if (ctx.doDamageTick) {
            ctx.damagePanel(bestPanel.id, ENEMY_CONFIG.muncher.damage);
            ctx.triggerExplosion(targetX, targetY, '#9E4EA5');
        }
      } else {
        e.isEating = false;
      }
    } else {
      targetX = Math.sin(ctx.time) * 5;
      targetY = Math.cos(ctx.time) * 5;
      e.isEating = false;
    }

    // 2. Move
    if (!e.isEating) {
      const dx = targetX - e.x;
      const dy = targetY - e.y;
      const dist = Math.sqrt(dx*dx + dy*dy);
      
      if (dist > 0.1) {
        e.vx = (dx / dist) * ENEMY_CONFIG.muncher.baseSpeed * ctx.delta;
        e.vy = (dy / dist) * ENEMY_CONFIG.muncher.baseSpeed * ctx.delta;
        e.x += e.vx;
        e.y += e.vy;
      }
    }
  }
};

export const KamikazeBehavior: EnemyBehavior = {
  update: (e, ctx) => {
    const targetX = ctx.playerPos.x;
    const targetY = ctx.playerPos.y;
    
    const dx = targetX - e.x;
    const dy = targetY - e.y;
    const dist = Math.sqrt(dx*dx + dy*dy);
    
    // Hit Player Logic
    if (dist < 1.0) {
       e.active = false;
       ctx.triggerExplosion(e.x, e.y, '#FF003C');
       ctx.emitEvent('PLAYER_HIT', { damage: 10 });
       return; 
    }

    // Move
    if (dist > 0.1) {
      e.vx = (dx / dist) * ENEMY_CONFIG.kamikaze.baseSpeed * ctx.delta;
      e.vy = (dy / dist) * ENEMY_CONFIG.kamikaze.baseSpeed * ctx.delta;
      e.x += e.vx;
      e.y += e.vy;
    }
  }
};

export const HunterBehavior: EnemyBehavior = {
  update: (e, ctx) => {
    if (!e.state) e.state = 'orbit';
    if (!e.stateTimer) e.stateTimer = ENEMY_CONFIG.hunter.orbitDuration + Math.random();

    e.stateTimer -= ctx.delta;

    let targetX = 0;
    let targetY = 0;

    if (e.state === 'orbit') {
      if (!e.orbitAngle) e.orbitAngle = Math.random() * Math.PI * 2;
      
      const speedVar = 0.7 + Math.sin(ctx.time * 0.8 + e.id) * 0.5;
      e.orbitAngle += ctx.delta * speedVar; 
      
      const breathe = Math.sin(ctx.time * 1.5 + e.id) * 5.5; 
      const orbitRadius = ENEMY_CONFIG.hunter.orbitRadius + breathe; 
      
      targetX = Math.cos(e.orbitAngle) * orbitRadius;
      targetY = Math.sin(e.orbitAngle) * orbitRadius;

      const maxX = 18;
      const maxY = 10;
      targetX = Math.max(-maxX, Math.min(maxX, targetX));
      targetY = Math.max(-maxY, Math.min(maxY, targetY));

      const inBoundsX = Math.abs(e.x) < 20;
      const inBoundsY = Math.abs(e.y) < 12;

      if (e.stateTimer <= 0 && inBoundsX && inBoundsY) {
        e.state = 'charge';
        e.stateTimer = ENEMY_CONFIG.hunter.chargeDuration; 
        e.vx = 0;
        e.vy = 0;
      }
      
      const dx = targetX - e.x;
      const dy = targetY - e.y;
      const dist = Math.sqrt(dx*dx + dy*dy);
      
      if (dist > 0.1) {
        e.vx = (dx / dist) * ENEMY_CONFIG.hunter.baseSpeed * ctx.delta;
        e.vy = (dy / dist) * ENEMY_CONFIG.hunter.baseSpeed * ctx.delta;
        e.x += e.vx;
        e.y += e.vy;
      }

    } 
    else if (e.state === 'charge') {
      if (e.stateTimer <= 0) {
        e.state = 'fire';
      }
    }
    else if (e.state === 'fire') {
      const dx = ctx.playerPos.x - e.x;
      const dy = ctx.playerPos.y - e.y;
      const dist = Math.sqrt(dx*dx + dy*dy);
      const dirX = dist > 0 ? dx/dist : 0;
      const dirY = dist > 0 ? dy/dist : 1;
      
      const offset = ENEMY_CONFIG.hunter.offsetDistance;
      const spawnX = e.x + (dirX * offset);
      const spawnY = e.y + (dirY * offset);

      const SPEED = 25; 
      const pVx = (dirX) * SPEED;
      const pVy = (dirY) * SPEED;

      ctx.spawnProjectile(spawnX, spawnY, pVx, pVy);

      e.state = 'orbit';
      e.stateTimer = 3.0 + Math.random() * 2.0;
    }
  }
};

export const Behaviors: Record<string, EnemyBehavior> = {
  'muncher': MuncherBehavior,
  'kamikaze': KamikazeBehavior,
  'hunter': HunterBehavior
};

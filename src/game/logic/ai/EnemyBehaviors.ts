import { Entity } from '../../core/ecs/Entity';
import { TransformComponent } from '../../components/data/TransformComponent';
import { MotionComponent } from '../../components/data/MotionComponent';
import { IdentityComponent } from '../../components/data/IdentityComponent';
import { ENEMY_CONFIG } from '../../config/EnemyConfig';
import { GameEvents } from '../../events/GameEvents';
import { EnemyTypes } from '../../config/Identifiers';

// Helpers to reduce verbosity
const getPos = (e: Entity) => e.requireComponent<TransformComponent>('Transform');
const getMotion = (e: Entity) => e.requireComponent<MotionComponent>('Motion');

export interface AIContext {
  playerPos: { x: number, y: number };
  panels: any[]; 
  delta: number;
  time: number;
  doDamageTick: boolean;
  spawnProjectile: (x: number, y: number, vx: number, vy: number) => void;
  damagePanel: (id: string, amount: number) => void;
  triggerExplosion: (x: number, y: number, color: string) => void;
  emitEvent: (name: string, payload: any) => void;
}

export interface EnemyBehavior {
  update(entity: Entity, ctx: AIContext): void;
}

export const MuncherBehavior: EnemyBehavior = {
  update: (e, ctx) => {
    const pos = getPos(e);
    const motion = getMotion(e);
    
    let targetX = 0;
    let targetY = 0;
    let nearestDist = Infinity;
    let bestPanel: any = null;

    for (const p of ctx.panels) {
      const dx = p.x - pos.x;
      const dy = p.y - pos.y;
      const dist = dx*dx + dy*dy;
      if (dist < nearestDist) {
        nearestDist = dist;
        bestPanel = p;
      }
    }

    let isEating = false;

    if (bestPanel) {
      targetX = Math.max(bestPanel.left, Math.min(pos.x, bestPanel.right));
      targetY = Math.max(bestPanel.bottom, Math.min(pos.y, bestPanel.top));
      
      const dx = targetX - pos.x;
      const dy = targetY - pos.y;
      const distToEdge = Math.sqrt(dx*dx + dy*dy);

      if (distToEdge < 0.5) { 
        isEating = true;
        if (ctx.doDamageTick) {
            ctx.damagePanel(bestPanel.id, ENEMY_CONFIG[EnemyTypes.MUNCHER].damage);
            ctx.triggerExplosion(targetX, targetY, '#9E4EA5');
        }
      }
    } else {
      targetX = Math.sin(ctx.time) * 5;
      targetY = Math.cos(ctx.time) * 5;
    }

    if (!isEating) {
      const dx = targetX - pos.x;
      const dy = targetY - pos.y;
      const dist = Math.sqrt(dx*dx + dy*dy);
      
      const speed = ENEMY_CONFIG[EnemyTypes.MUNCHER].baseSpeed;

      if (dist > 0.1) {
        motion.vx = (dx / dist) * speed;
        motion.vy = (dy / dist) * speed;
      } else {
        motion.vx = 0;
        motion.vy = 0;
      }
    } else {
      motion.vx = 0;
      motion.vy = 0;
    }
    
    if (Math.abs(motion.vx) > 0.1 || Math.abs(motion.vy) > 0.1) {
        pos.rotation = Math.atan2(motion.vy, motion.vx) - Math.PI/2;
    }
  }
};

export const KamikazeBehavior: EnemyBehavior = {
  update: (e, ctx) => {
    const pos = getPos(e);
    const motion = getMotion(e);
    
    const targetX = ctx.playerPos.x;
    const targetY = ctx.playerPos.y;
    
    const dx = targetX - pos.x;
    const dy = targetY - pos.y;
    const dist = Math.sqrt(dx*dx + dy*dy);
    
    if (dist < 1.0) {
       const hp = e.requireComponent<any>('Health'); 
       if(hp) hp.current = 0; 
       
       ctx.triggerExplosion(pos.x, pos.y, '#FF003C');
       ctx.emitEvent(GameEvents.PLAYER_HIT, { damage: 10 });
       return; 
    }

    if (dist > 0.1) {
      const speed = ENEMY_CONFIG[EnemyTypes.KAMIKAZE].baseSpeed;
      motion.vx = (dx / dist) * speed;
      motion.vy = (dy / dist) * speed;
      pos.rotation += 0.1; 
    }
  }
};

export const HunterBehavior: EnemyBehavior = {
  update: (e, ctx) => {
    const anyE = e as any;
    if (!anyE._hunterState) anyE._hunterState = 'orbit';
    if (!anyE._hunterTimer) anyE._hunterTimer = ENEMY_CONFIG[EnemyTypes.HUNTER].orbitDuration + Math.random();
    if (!anyE._orbitAngle) anyE._orbitAngle = Math.random() * Math.PI * 2;

    anyE._hunterTimer -= ctx.delta;
    
    const pos = getPos(e);
    const motion = getMotion(e);

    if (anyE._hunterState === 'orbit') {
      const speedVar = 0.7 + Math.sin(ctx.time * 0.8 + e.id.valueOf()) * 0.5;
      anyE._orbitAngle += ctx.delta * speedVar; 
      
      const breathe = Math.sin(ctx.time * 1.5 + e.id.valueOf()) * 5.5; 
      const orbitRadius = ENEMY_CONFIG[EnemyTypes.HUNTER].orbitRadius + breathe; 
      
      let targetX = Math.cos(anyE._orbitAngle) * orbitRadius;
      let targetY = Math.sin(anyE._orbitAngle) * orbitRadius;

      targetX = Math.max(-18, Math.min(18, targetX));
      targetY = Math.max(-10, Math.min(10, targetY));

      const dx = targetX - pos.x;
      const dy = targetY - pos.y;
      const dist = Math.sqrt(dx*dx + dy*dy);
      
      const speed = ENEMY_CONFIG[EnemyTypes.HUNTER].baseSpeed;
      if (dist > 0.1) {
        motion.vx = (dx / dist) * speed;
        motion.vy = (dy / dist) * speed;
      }
      pos.rotation = Math.atan2(motion.vy, motion.vx) - Math.PI/2;

      const inBounds = Math.abs(pos.x) < 20 && Math.abs(pos.y) < 12;
      if (anyE._hunterTimer <= 0 && inBounds) {
        anyE._hunterState = 'charge';
        anyE._hunterTimer = ENEMY_CONFIG[EnemyTypes.HUNTER].chargeDuration;
        motion.vx = 0; motion.vy = 0;
      }
    } 
    else if (anyE._hunterState === 'charge') {
      if (anyE._hunterTimer <= 0) {
        anyE._hunterState = 'fire';
      }
      const dx = ctx.playerPos.x - pos.x;
      const dy = ctx.playerPos.y - pos.y;
      pos.rotation = Math.atan2(dy, dx) - Math.PI/2;
    }
    else if (anyE._hunterState === 'fire') {
      const dx = ctx.playerPos.x - pos.x;
      const dy = ctx.playerPos.y - pos.y;
      const dist = Math.sqrt(dx*dx + dy*dy);
      const dirX = dist > 0 ? dx/dist : 0;
      const dirY = dist > 0 ? dy/dist : 1;
      
      const offset = 1.6;
      const spawnX = pos.x + (dirX * offset);
      const spawnY = pos.y + (dirY * offset);
      const SPEED = 25; 

      ctx.spawnProjectile(spawnX, spawnY, dirX * SPEED, dirY * SPEED);

      anyE._hunterState = 'orbit';
      anyE._hunterTimer = 3.0 + Math.random() * 2.0;
    }
  }
};

export const Behaviors: Record<string, EnemyBehavior> = {
  [EnemyTypes.MUNCHER]: MuncherBehavior,
  [EnemyTypes.KAMIKAZE]: KamikazeBehavior,
  [EnemyTypes.HUNTER]: HunterBehavior
};

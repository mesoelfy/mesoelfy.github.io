import { Entity } from '../../core/ecs/Entity';
import { TransformComponent } from '../../components/data/TransformComponent';
import { MotionComponent } from '../../components/data/MotionComponent';
import { StateComponent } from '../../components/data/StateComponent';
import { ENEMY_CONFIG } from '../../config/EnemyConfig';
import { EnemyTypes, GameEvents } from '../../events/GameEvents';
import { EnemyTypes as Types } from '../../config/Identifiers';
import { Registry } from '../../core/ecs/EntityRegistry';

const getPos = (e: Entity) => e.requireComponent<TransformComponent>('Transform');
const getMotion = (e: Entity) => e.requireComponent<MotionComponent>('Motion');
const getState = (e: Entity) => e.requireComponent<StateComponent>('State');

function rotateTowards(current: number, target: number, speed: number): number {
    let diff = target - current;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    return current + diff * speed;
}

function lerp(start: number, end: number, t: number): number {
    return start * (1 - t) + end * t;
}

export interface AIContext {
  playerPos: { x: number, y: number };
  panels: any[]; 
  delta: number;
  time: number;
  doDamageTick: boolean;
  spawnProjectile: (x: number, y: number, vx: number, vy: number) => void;
  damagePanel: (id: string, amount: number) => void;
  triggerExplosion: (x: number, y: number, color: string) => void;
  spawnDrillSparks: (x, y, color: string) => void; 
  emitEvent: (name: string, payload: any) => void;
}

export interface EnemyBehavior {
  update(entity: Entity, ctx: AIContext): void;
}

export const DrillerBehavior: EnemyBehavior = {
  update: (e, ctx) => {
    const pos = getPos(e);
    const motion = getMotion(e);
    const state = getState(e);
    
    let targetX = 0;
    let targetY = 0;
    let bestPanel: any = null;
    let nearestDist = Infinity;

    for (const p of ctx.panels) {
      const dx = p.x - pos.x;
      const dy = p.y - pos.y;
      const dist = dx*dx + dy*dy;
      if (dist < nearestDist) {
        nearestDist = dist;
        bestPanel = p;
      }
    }

    let isDrilling = false;

    if (bestPanel) {
      targetX = Math.max(bestPanel.left, Math.min(pos.x, bestPanel.right));
      targetY = Math.max(bestPanel.bottom, Math.min(pos.y, bestPanel.top));
      
      const dx = targetX - pos.x;
      const dy = targetY - pos.y;
      const distToEdge = Math.sqrt(dx*dx + dy*dy);

      if (distToEdge < 0.5) { 
        isDrilling = true;
        ctx.spawnDrillSparks(targetX, targetY, '#9E4EA5');
        if (ctx.doDamageTick) {
            ctx.damagePanel(bestPanel.id, ENEMY_CONFIG[Types.DRILLER].damage);
        }
      }
    } else {
      targetX = Math.sin(ctx.time) * 5;
      targetY = Math.cos(ctx.time) * 5;
    }

    state.current = isDrilling ? 'DRILLING' : 'MOVING';

    if (!isDrilling) {
      const dx = targetX - pos.x;
      const dy = targetY - pos.y;
      const dist = Math.sqrt(dx*dx + dy*dy);
      const speed = ENEMY_CONFIG[Types.DRILLER].baseSpeed;

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
    
    // ROTATION LOGIC
    if (isDrilling) {
        // FIX: Force rotation to face the contact point on the panel
        // This ensures the drill tip is "locked" visually to the surface.
        const angleToPanel = Math.atan2(targetY - pos.y, targetX - pos.x) - Math.PI/2;
        pos.rotation = rotateTowards(pos.rotation, angleToPanel, 0.2); // Fast snap
    } 
    else if (Math.abs(motion.vx) > 0.1 || Math.abs(motion.vy) > 0.1) {
        const targetAngle = Math.atan2(motion.vy, motion.vx) - Math.PI/2;
        pos.rotation = rotateTowards(pos.rotation, targetAngle, 0.1);
    }
  }
};

// ... Kamikaze and Hunter behaviors remain unchanged below ...
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
       Registry.destroyEntity(e.id);
       ctx.triggerExplosion(pos.x, pos.y, '#FF003C');
       ctx.emitEvent(GameEvents.PLAYER_HIT, { damage: 10 });
       return; 
    }

    if (dist > 0.1) {
      const speed = ENEMY_CONFIG[Types.KAMIKAZE].baseSpeed;
      motion.vx = (dx / dist) * speed;
      motion.vy = (dy / dist) * speed;
      pos.rotation += 0.1; 
    }
  }
};

export const HunterBehavior: EnemyBehavior = {
  update: (e, ctx) => {
    const state = getState(e);
    const pos = getPos(e);
    const motion = getMotion(e);

    if (state.data.spinVelocity === undefined) {
        state.data.spinVelocity = 2.0;
        state.data.spinAngle = 0;
    }

    if (state.current === 'SPAWN') {
        state.current = 'HUNT';
        state.timers.action = 3.0; 
        state.data.offsetAngle = (e.id.valueOf() % 10) * 0.6; 
    }

    let targetSpinSpeed = 2.0; 

    if (state.current === 'HUNT') {
        const px = ctx.playerPos.x;
        const py = ctx.playerPos.y;
        
        const orbitSpeed = 0.5;
        const currentAngle = (ctx.time * orbitSpeed) + state.data.offsetAngle;
        
        const targetRadius = 16.0;
        const tx = px + Math.cos(currentAngle) * targetRadius;
        const ty = py + Math.sin(currentAngle) * targetRadius;

        const dx = tx - pos.x;
        const dy = ty - pos.y;
        const dist = Math.sqrt(dx*dx + dy*dy);

        const speed = ENEMY_CONFIG[Types.HUNTER].baseSpeed; 
        
        if (dist > 1.0) {
            motion.vx += (dx / dist) * speed * ctx.delta * 2.0;
            motion.vy += (dy / dist) * speed * ctx.delta * 2.0;
        }
        
        motion.vx *= 0.92;
        motion.vy *= 0.92;

        const aimDx = px - pos.x;
        const aimDy = py - pos.y;
        const aimAngle = Math.atan2(aimDy, aimDx) - Math.PI/2;
        pos.rotation = rotateTowards(pos.rotation, aimAngle, 0.05);

        state.timers.action -= ctx.delta;
        const inBounds = Math.abs(pos.x) < 22 && Math.abs(pos.y) < 14;
        
        if (state.timers.action <= 0 && inBounds) {
            state.current = 'CHARGE';
            state.timers.action = ENEMY_CONFIG[Types.HUNTER].chargeDuration;
            motion.vx *= 0.1; 
            motion.vy *= 0.1;
        }
    } 
    
    else if (state.current === 'CHARGE') {
        state.timers.action -= ctx.delta;
        motion.vx *= 0.8;
        motion.vy *= 0.8;

        const dx = ctx.playerPos.x - pos.x;
        const dy = ctx.playerPos.y - pos.y;
        const targetAngle = Math.atan2(dy, dx) - Math.PI/2;
        pos.rotation = rotateTowards(pos.rotation, targetAngle, 0.15);

        targetSpinSpeed = -8.0; 

        if (state.timers.action <= 0) {
            state.current = 'FIRE';
        }
    }
    
    else if (state.current === 'FIRE') {
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

        state.current = 'HUNT';
        state.timers.action = 2.0 + Math.random() * 2.0;
    }

    state.data.spinVelocity = lerp(state.data.spinVelocity, targetSpinSpeed, ctx.delta * 2.0);
    state.data.spinAngle += state.data.spinVelocity * ctx.delta;
  }
};

export const Behaviors: Record<string, EnemyBehavior> = {
  [Types.DRILLER]: DrillerBehavior,
  [Types.KAMIKAZE]: KamikazeBehavior,
  [Types.HUNTER]: HunterBehavior
};

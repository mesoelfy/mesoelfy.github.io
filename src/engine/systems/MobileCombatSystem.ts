import { IGameSystem, ICombatSystem, IGameEventService, IFastEventService, IAudioService, IEntityRegistry, IPanelSystem } from '@/engine/interfaces';
import { GameEvents } from '@/engine/signals/GameEvents';
import { FastEventType, FXCode } from '@/engine/signals/FastEventBus';
import { Entity } from '@/engine/ecs/Entity';
import { TransformData } from '@/engine/ecs/components/TransformData';
import { ColliderData } from '@/engine/ecs/components/ColliderData';
import { IdentityData } from '@/engine/ecs/components/IdentityData';
import { ComponentType } from '@/engine/ecs/ComponentType';
import { CollisionLayers } from '@/engine/config/PhysicsConfig';
import { ServiceLocator } from '@/engine/services/ServiceLocator';
import { PanelId } from '@/engine/config/PanelConfig';

export class MobileCombatSystem implements IGameSystem, ICombatSystem {
    constructor(
        private registry: IEntityRegistry,
        private events: IGameEventService,
        private fastEvents: IFastEventService,
        private audio: IAudioService
    ) {
        // Player Input Hits (Taps)
        this.events.subscribe(GameEvents.ENEMY_DAMAGED, (p) => {
            const entity = this.registry.getEntity(p.id);
            if (entity && entity.active) {
                this.killEnemy(entity, 'TAP');
            }
        });
    }
    
    update(delta: number, time: number) {
        // Manual Collision Check for Mobile (Simple AABB/Circle vs Box)
        // Since we don't have the full desktop CollisionMatrix overhead here
        const enemies = this.registry.getByTag('ENEMY');
        const panels = this.registry.getByTag('OBSTACLE'); // Panels are obstacles

        // We assume only one panel in mobile usually (Social), but generic support is safer
        for (const enemy of enemies) {
            if (!enemy.active) continue;
            
            const eCol = enemy.getComponent<ColliderData>(ComponentType.Collider);
            const ePos = enemy.getComponent<TransformData>(ComponentType.Transform);
            
            if (!eCol || !ePos) continue;

            for (const panel of panels) {
                const pCol = panel.getComponent<ColliderData>(ComponentType.Collider);
                const pPos = panel.getComponent<TransformData>(ComponentType.Transform);
                const pId = panel.getComponent<IdentityData>(ComponentType.Identity);

                if (!pCol || !pPos || !pId) continue;

                if (this.checkCollision(ePos, eCol, pPos, pCol)) {
                    // HIT!
                    this.resolveCollision(enemy, panel);
                }
            }
        }
    }

    public resolveCollision(enemy: Entity, panel: Entity) {
        // Ensure it's Enemy vs Panel
        const eId = enemy.getComponent<IdentityData>(ComponentType.Identity);
        const pId = panel.getComponent<IdentityData>(ComponentType.Identity);
        
        if (eId && pId) {
            // 1. Damage the panel
            const panelSystem = ServiceLocator.getSystem<IPanelSystem>('PanelRegistrySystem');
            if (panelSystem) {
                const dmg = 10; // Fixed damage for mobile
                const t = enemy.getComponent<TransformData>(ComponentType.Transform);
                
                panelSystem.damagePanel(pId.variant as PanelId, dmg, { 
                    source: t ? { x: t.x, y: t.y } : undefined 
                });
            }

            // 2. Destroy the enemy (Crash)
            this.killEnemy(enemy, 'CRASH');
        }
    }

    private checkCollision(tA: TransformData, cA: ColliderData, tB: TransformData, cB: ColliderData): boolean {
        // Enemy is Circle, Panel is Box
        const circle = { t: tA, c: cA };
        const box = { t: tB, c: cB };

        const boxHalfW = box.c.width / 2;
        const boxHalfH = box.c.height / 2;

        const distX = Math.abs(circle.t.x - box.t.x);
        const distY = Math.abs(circle.t.y - box.t.y);

        if (distX > (boxHalfW + circle.c.radius)) return false;
        if (distY > (boxHalfH + circle.c.radius)) return false;

        if (distX <= boxHalfW) return true; 
        if (distY <= boxHalfH) return true;

        const dx = distX - boxHalfW;
        const dy = distY - boxHalfH;
        return (dx*dx + dy*dy <= (circle.c.radius * circle.c.radius));
    }

    private killEnemy(entity: Entity, reason: 'TAP' | 'CRASH') {
        const t = entity.getComponent<TransformData>(ComponentType.Transform);
        
        if (t) {
            // Visuals
            const fx = reason === 'TAP' ? FXCode.EXPLOSION_PURPLE : FXCode.EXPLOSION_RED;
            this.fastEvents.emit(FastEventType.SPAWN_FX, fx, t.x * 100, t.y * 100, 0);
            
            // Audio
            if (reason === 'TAP') {
                this.audio.playSound('fx_impact_light');
                this.audio.playSound('fx_reboot_success'); // Satisfaction
            } else {
                this.audio.playSound('fx_impact_heavy');
            }
        }
        
        this.registry.destroyEntity(entity.id);
        
        // Only give score for Taps
        if (reason === 'TAP') {
            this.events.emit(GameEvents.ENEMY_DESTROYED, { 
                id: entity.id as number, 
                type: 'DRILLER', 
                x: t?.x || 0, 
                y: t?.y || 0 
            });
        }
    }

    teardown() {}
}

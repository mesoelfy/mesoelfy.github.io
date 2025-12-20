import { IGameSystem, ICombatSystem, IGameEventService, IFastEventService, IAudioService, IEntityRegistry } from '@/engine/interfaces';
import { GameEvents } from '@/engine/signals/GameEvents';
import { FastEventType, FXCode } from '@/engine/signals/FastEventBus';
import { Entity } from '@/engine/ecs/Entity';
import { TransformData } from '@/engine/ecs/components/TransformData';
import { ComponentType } from '@/engine/ecs/ComponentType';

export class MobileCombatSystem implements IGameSystem, ICombatSystem {
    constructor(
        private registry: IEntityRegistry,
        private events: IGameEventService,
        private fastEvents: IFastEventService,
        private audio: IAudioService
    ) {
        this.events.subscribe(GameEvents.ENEMY_DAMAGED, (p) => {
            const entity = this.registry.getEntity(p.id);
            if (entity && entity.active) {
                this.kill(entity);
            }
        });
    }
    
    update() {}
    teardown() {}
    
    // Stub for interface compliance (Mobile uses direct kill logic for now)
    resolveCollision() {}

    private kill(entity: Entity) {
        const t = entity.getComponent<TransformData>(ComponentType.Transform);
        if (t) {
            // Visuals: Explosion
            this.fastEvents.emit(FastEventType.SPAWN_FX, FXCode.EXPLOSION_PURPLE, t.x * 100, t.y * 100, 0);
            
            // Audio: Impact
            this.audio.playSound('fx_impact_light');
            
            // Audio: Satisfaction (Coins/XP sound)
            this.audio.playSound('fx_reboot_success');
        }
        
        this.registry.destroyEntity(entity.id);
        
        // Propagate destruction event for Score/XP systems
        this.events.emit(GameEvents.ENEMY_DESTROYED, { 
            id: entity.id as number, 
            type: 'DRILLER', 
            x: t?.x || 0, 
            y: t?.y || 0 
        });
    }
}

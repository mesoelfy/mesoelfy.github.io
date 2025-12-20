import { useEffect } from 'react';
import { useGameContext } from '@/engine/state/GameContext';
import { ComponentType } from '@/engine/ecs/ComponentType';
import { TransformData } from '@/engine/ecs/components/TransformData';
import { ColliderData } from '@/engine/ecs/components/ColliderData';
import { GameEvents } from '@/engine/signals/GameEvents';
import { AudioSystem } from '@/engine/audio/AudioSystem';
import { Tag } from '@/engine/ecs/types';
import { ViewportHelper } from '@/engine/math/ViewportHelper';
import { screenToWorld } from '@/engine/math/coords';

const TAP_RADIUS = 2.0;

export const MobileInputController = () => {
  const { registry, events } = useGameContext();

  useEffect(() => {
    const handleWindowTap = (e: PointerEvent) => {
        // 1. Convert Screen -> World
        // We use the global ViewportHelper which is updated by MobileGameDirector
        const { width, height } = ViewportHelper.screenSize;
        if (width === 0 || height === 0) return;

        const worldPos = screenToWorld(e.clientX, e.clientY, width, height);
        
        // 2. Dispatch Visual Ripple
        window.dispatchEvent(new CustomEvent('mobile-spatial-tap', { detail: worldPos }));

        // 3. Audio Feedback
        AudioSystem.playSound('ui_click');

        // 4. Hit Test Enemies
        const enemies = registry.getByTag(Tag.ENEMY);
        let hitFound = false;

        for (const enemy of enemies) {
            if (!enemy.active) continue;
            
            const t = enemy.getComponent<TransformData>(ComponentType.Transform);
            const c = enemy.getComponent<ColliderData>(ComponentType.Collider);
            
            if (t) {
                const dx = t.x - worldPos.x;
                const dy = t.y - worldPos.y;
                const dist = Math.sqrt(dx*dx + dy*dy);
                const hitThreshold = (c ? c.radius : 0.5) + TAP_RADIUS;
                
                if (dist <= hitThreshold) {
                    events.emit(GameEvents.ENEMY_DAMAGED, { 
                        id: enemy.id as number, 
                        damage: 9999, 
                        type: 'TAP' 
                    });
                    hitFound = true;
                }
            }
        }

        if (hitFound) {
            AudioSystem.playSound('fx_impact_light');
        }
    };

    window.addEventListener('pointerdown', handleWindowTap);
    return () => window.removeEventListener('pointerdown', handleWindowTap);
  }, [registry, events]);

  return null;
};

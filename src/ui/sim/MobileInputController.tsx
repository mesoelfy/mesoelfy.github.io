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

const TAP_RADIUS = 2.5; // Increased hit radius for better mobile feel

export const MobileInputController = () => {
  const { registry, events } = useGameContext();

  useEffect(() => {
    const handleWindowTap = (e: PointerEvent) => {
        // 1. Convert Screen -> World
        const { width, height } = ViewportHelper.screenSize;
        if (width === 0 || height === 0) return;

        const worldPos = screenToWorld(e.clientX, e.clientY, width, height);
        
        // 2. Dispatch Visual Ripple (Handled by TouchRipple.tsx)
        window.dispatchEvent(new CustomEvent('mobile-spatial-tap', { detail: worldPos }));

        // 3. Hit Test Enemies
        // We query the live registry via the Context Proxy
        const enemies = registry.getByTag(Tag.ENEMY);
        let hitFound = false;

        for (const enemy of enemies) {
            if (!enemy.active) continue;
            
            const t = enemy.getComponent<TransformData>(ComponentType.Transform);
            
            // Use entity collider radius or default to a generous touch target
            const c = enemy.getComponent<ColliderData>(ComponentType.Collider);
            const entityRadius = c ? c.radius : 0.8;
            
            if (t) {
                const dx = t.x - worldPos.x;
                const dy = t.y - worldPos.y;
                const dist = Math.sqrt(dx*dx + dy*dy);
                const hitThreshold = entityRadius + TAP_RADIUS;
                
                if (dist <= hitThreshold) {
                    // 4. Register Hit
                    events.emit(GameEvents.ENEMY_DAMAGED, { 
                        id: enemy.id as number, 
                        damage: 9999, // Instant Kill on Tap
                        type: 'TAP' 
                    });
                    hitFound = true;
                    // Break after one hit? No, multikill feels good.
                }
            }
        }

        // 5. Feedback
        if (hitFound) {
            // Impact sound handled by CombatSystem usually, but we can layer a UI sound
            AudioSystem.playSound('ui_chirp'); 
        } else {
            // Miss sound
            AudioSystem.playSound('ui_click');
        }
    };

    window.addEventListener('pointerdown', handleWindowTap);
    return () => window.removeEventListener('pointerdown', handleWindowTap);
  }, [registry, events]);

  return null;
};

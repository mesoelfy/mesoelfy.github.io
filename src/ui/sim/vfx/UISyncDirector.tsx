import { useFrame, useThree } from '@react-three/fiber';
import { PanelElementRegistry } from '../registry/PanelElementRegistry';
import { ServiceLocator } from '@/engine/services/ServiceLocator';
import { IdentityData } from '@/engine/ecs/components/IdentityData';
import { TransformData } from '@/engine/ecs/components/TransformData';
import { RenderTransform } from '@/engine/ecs/components/RenderTransform';
import { ColliderData } from '@/engine/ecs/components/ColliderData';
import { ComponentType } from '@/engine/ecs/ComponentType';
import { PanelId } from '@/engine/config/PanelConfig';
import * as THREE from 'three';
import { useRef } from 'react';

const vec = new THREE.Vector3();

export const UISyncDirector = () => {
  const { size, camera } = useThree();
  const entityCache = useRef(new Map<PanelId, number>());

  useFrame(() => {
    const registry = ServiceLocator.getRegistry();
    if (!registry) return;

    const elements = PanelElementRegistry.getAll();
    const halfW = size.width / 2;
    const halfH = size.height / 2;

    for (const [id, el] of elements) {
        let eid = entityCache.current.get(id);
        if (eid === undefined) {
            for (const e of registry.getAll()) {
                const identity = e.getComponent<IdentityData>(ComponentType.Identity);
                if (identity && identity.variant === id) {
                    eid = e.id;
                    entityCache.current.set(id, eid);
                    break;
                }
            }
        }
        if (eid === undefined) continue;

        const entity = registry.getEntity(eid);
        if (!entity || !entity.active) {
            entityCache.current.delete(id);
            continue;
        }

        const transform = entity.getComponent<TransformData>(ComponentType.Transform);
        const collider = entity.getComponent<ColliderData>(ComponentType.Collider);
        const render = entity.getComponent<RenderTransform>(ComponentType.RenderTransform);

        if (transform && collider) {
            let x = transform.x, y = transform.y;
            if (render) { x += render.offsetX; y += render.offsetY; }

            vec.set(x, y, 0);
            vec.project(camera);
            const cx = vec.x * halfW + halfW;
            const cy = -vec.y * halfH + halfH;

            vec.set(x + collider.width / 2, y + collider.height / 2, 0);
            vec.project(camera);
            const cornerX = vec.x * halfW + halfW;
            const cornerY = -vec.y * halfH + halfH;

            const width = Math.abs(cornerX - cx) * 2;
            const height = Math.abs(cornerY - cy) * 2;
            const left = cx - (width / 2);
            const top = cy - (height / 2);

            el.style.transform = `translate3d(${left.toFixed(1)}px, ${top.toFixed(1)}px, 0)`;
            el.style.width = `${width.toFixed(1)}px`;
            el.style.height = `${height.toFixed(1)}px`;
        }
    }
  });
  return null;
};

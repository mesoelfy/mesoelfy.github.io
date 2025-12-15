import { Tag } from '@/engine/ecs/types';
import { EnemyTypes } from '@/sys/config/Identifiers';
import { InstancedActor } from './InstancedActor';
import { IdentityData } from '../data/IdentityData';
import { AIStateData } from '../data/AIStateData';
import { TransformData } from '../data/TransformData';
import { ServiceLocator } from '@/sys/services/ServiceLocator';
import { AssetService } from '@/ui/sim/assets/AssetService';
import { ComponentType } from '@/engine/ecs/ComponentType';
import * as THREE from 'three';

export const HunterChargeActor = () => {
  const geometry = AssetService.get<THREE.BufferGeometry>('GEO_CHARGE_ORB');
  const material = AssetService.get<THREE.Material>('MAT_CHARGE_ORB');

  return (
    <InstancedActor
      tag={Tag.ENEMY}
      geometry={geometry}
      material={material}
      maxCount={50}
      filter={(e) => {
          const id = e.getComponent<IdentityData>(ComponentType.Identity);
          const state = e.getComponent<AIStateData>(ComponentType.State);
          return id?.variant === EnemyTypes.HUNTER && state?.current === 'CHARGE';
      }}
      updateEntity={(e, obj) => {
          const transform = e.getComponent<TransformData>(ComponentType.Transform);
          const state = e.getComponent<AIStateData>(ComponentType.State);
          
          if (transform && state) {
              const config = ServiceLocator.getConfigService().enemies[EnemyTypes.HUNTER];
              const maxDuration = config ? config.chargeDuration : 1.0; 
              
              const currentTimer = state.timers.action;
              const remaining = typeof currentTimer === 'number' ? currentTimer : maxDuration;
              
              // Progress: 0.0 (Start) -> 1.0 (Ready to Fire)
              const progress = Math.max(0, Math.min(1, 1.0 - (remaining / maxDuration)));
              
              let scale = 0.0;

              // --- IMPLOSION CURVE ---
              if (progress < 0.8) {
                  // Phase 1: Grow (0% to 80%)
                  // Exponential Easing: slow start, fast growth
                  const p = progress / 0.8;
                  scale = Math.pow(p, 3) * 1.5;
              } else {
                  // Phase 2: Implode (80% to 100%)
                  // Shrink down rapidly to concentrate energy
                  const p = (progress - 0.8) / 0.2;
                  scale = 1.5 * (1.0 - Math.pow(p, 0.5)); 
                  // Never hit actual 0, keep it visible as a dense point
                  scale = Math.max(0.2, scale);
              }
              
              // Jitter increases with charge
              const rumble = Math.pow(progress, 2) * 0.15;
              const jitterX = (Math.random() - 0.5) * rumble;
              const jitterY = (Math.random() - 0.5) * rumble;

              const offset = 1.6;
              const dirX = Math.cos(transform.rotation);
              const dirY = Math.sin(transform.rotation);
              
              obj.position.x = transform.x + (dirX * offset) + jitterX;
              obj.position.y = transform.y + (dirY * offset) + jitterY;
              obj.position.z = 5.2; 
              
              obj.scale.setScalar(scale);
              obj.rotation.set(0, 0, 0); 
          }
      }}
    />
  );
};

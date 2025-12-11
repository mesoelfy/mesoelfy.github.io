import { Tag } from '../core/ecs/types';
import { EnemyTypes } from '../config/Identifiers';
import { InstancedActor } from './common/InstancedActor';
import { IdentityComponent } from '../data/IdentityComponent';
import { StateComponent } from '../data/StateComponent';
import { TransformComponent } from '../data/TransformComponent';
import { AssetService } from '../assets/AssetService';
import { ServiceLocator } from '../core/ServiceLocator';
import * as THREE from 'three';

export const HunterChargeRenderer = () => {
  const geometry = AssetService.get<THREE.BufferGeometry>('GEO_BULLET_ENEMY');
  const material = AssetService.get<THREE.Material>('MAT_BULLET_ENEMY');

  return (
    <InstancedActor
      tag={Tag.ENEMY}
      geometry={geometry}
      material={material}
      maxCount={50}
      filter={(e) => {
          const id = e.getComponent<IdentityComponent>('Identity');
          const state = e.getComponent<StateComponent>('State');
          return id?.variant === EnemyTypes.HUNTER && state?.current === 'CHARGE';
      }}
      updateEntity={(e, obj) => {
          const transform = e.getComponent<TransformComponent>('Transform');
          const state = e.getComponent<StateComponent>('State');
          
          if (transform && state) {
              const config = ServiceLocator.getConfigService().enemies[EnemyTypes.HUNTER];
              const maxDuration = config ? config.chargeDuration : 1.0; 
              
              // Safe access to timer
              const currentTimer = state.timers.action;
              const remaining = typeof currentTimer === 'number' ? currentTimer : maxDuration;
              
              // Calculate Progress (0.0 -> 1.0)
              const progress = Math.max(0, Math.min(1, 1.0 - (remaining / maxDuration)));
              
              // Curve: Start at 0.2, Grow to 1.5 (Full Bullet Size)
              const scale = 0.2 + (Math.pow(progress, 2) * 1.3); 
              
              const rumble = progress > 0.8 ? (progress - 0.8) * 0.3 : 0;
              const jitterX = (Math.random() - 0.5) * rumble;
              const jitterY = (Math.random() - 0.5) * rumble;

              const offset = 1.6;
              const dirX = Math.cos(transform.rotation);
              const dirY = Math.sin(transform.rotation);
              
              obj.position.x = transform.x + (dirX * offset) + jitterX;
              obj.position.y = transform.y + (dirY * offset) + jitterY;
              obj.position.z = 5.2; // In front of enemy body
              
              obj.scale.setScalar(scale);
              obj.rotation.set(0, 0, 0); 
          }
      }}
    />
  );
};

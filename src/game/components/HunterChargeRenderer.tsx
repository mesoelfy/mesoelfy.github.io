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
  // 1. Use Shared Assets (Flyweight)
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
              // 2. Use Injected Config for Source of Truth
              const config = ServiceLocator.getConfigService().enemies[EnemyTypes.HUNTER];
              const maxDuration = config.chargeDuration;
              const remaining = state.timers.action || 0;
              
              // 3. Logic: 0.0 (Start) -> 1.0 (Ready)
              // Clamp to ensure no visual glitches if timer overshoots slightly
              const progress = Math.max(0, Math.min(1, 1.0 - (remaining / maxDuration)));
              
              // Exponential Swell: Starts small, grows fast at the end
              const scale = Math.pow(progress, 2) * 1.5; // Increased max scale slightly for visibility
              
              // Jitter Effect (increases as it gets closer to firing)
              const rumble = progress > 0.8 ? (progress - 0.8) * 0.3 : 0;
              const jitterX = (Math.random() - 0.5) * rumble;
              const jitterY = (Math.random() - 0.5) * rumble;

              const offset = 1.6;
              // +PI/2 adjustment for model orientation
              const dirX = Math.cos(transform.rotation + Math.PI/2);
              const dirY = Math.sin(transform.rotation + Math.PI/2);
              
              obj.position.x = transform.x + (dirX * offset) + jitterX;
              obj.position.y = transform.y + (dirY * offset) + jitterY;
              obj.position.z = 0.1; 
              
              obj.scale.setScalar(scale);
              obj.rotation.set(0, 0, 0); // Billboarding
          }
      }}
    />
  );
};

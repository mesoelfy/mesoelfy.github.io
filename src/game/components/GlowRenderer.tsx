import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Registry } from '../core/ecs/EntityRegistry';
import { Tag } from '../core/ecs/types';
import { TransformComponent } from '../components/data/TransformComponent';
import { IdentityComponent } from '../components/data/IdentityComponent';
import { createGlowTexture } from '../utils/TextureGen';
import { GAME_THEME } from '../theme';
import { EnemyTypes } from '../config/Identifiers';

const MAX_GLOWS = 1000; // Reduced count since bullets are gone
const tempObj = new THREE.Object3D();
const tempColor = new THREE.Color();

export const GlowRenderer = () => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const texture = useMemo(() => createGlowTexture(), []);
  const geometry = useMemo(() => new THREE.PlaneGeometry(1, 1), []);

  useFrame(() => {
    if (!meshRef.current) return;

    let count = 0;

    // ONLY ENEMIES (Bullets handle their own glow now)
    const enemies = Registry.getByTag(Tag.ENEMY);
    for (const e of enemies) {
      if (count >= MAX_GLOWS) break;
      // Skip bullets (they share ENEMY tag sometimes in factory, but have BULLET tag too)
      if (e.hasTag(Tag.BULLET)) continue;

      const t = e.getComponent<TransformComponent>('Transform');
      const id = e.getComponent<IdentityComponent>('Identity');
      if (!t || !id) continue;

      tempObj.position.set(t.x, t.y, -0.5);
      
      let scale = 2.5;
      let color = '#FFF';

      if (id.variant === EnemyTypes.MUNCHER) {
          color = GAME_THEME.enemy.muncher;
          scale = 3.0;
      } else if (id.variant === EnemyTypes.KAMIKAZE) {
          color = GAME_THEME.enemy.kamikaze;
          scale = 3.5;
      } else if (id.variant === EnemyTypes.HUNTER) {
          color = GAME_THEME.enemy.hunter;
          scale = 4.0;
      }

      tempObj.scale.set(scale, scale, 1);
      tempColor.set(color);

      tempObj.updateMatrix();
      meshRef.current.setMatrixAt(count, tempObj.matrix);
      meshRef.current.setColorAt(count, tempColor);
      count++;
    }

    meshRef.current.count = count;
    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[geometry, undefined, MAX_GLOWS]}>
      <meshBasicMaterial 
        map={texture}
        transparent={true}
        opacity={0.10} 
        blending={THREE.AdditiveBlending}
        depthWrite={false} 
        color="#FFF"
      />
    </instancedMesh>
  );
};

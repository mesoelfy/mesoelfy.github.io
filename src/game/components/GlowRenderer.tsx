import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Registry } from '../core/ecs/EntityRegistry';
import { Tag } from '../core/ecs/types';
import { TransformComponent } from '../components/data/TransformComponent';
import { IdentityComponent } from '../components/data/IdentityComponent';
import { GAME_THEME } from '../theme';
import { EnemyTypes } from '../config/Identifiers';

const MAX_GLOWS = 1000;

export const GlowRenderer = () => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const geometry = useMemo(() => new THREE.PlaneGeometry(1, 1), []);

  const shaderMaterial = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: `
      // Auto-injected instanceColor
      varying vec2 vUv;
      varying vec3 vColor;
      
      void main() {
        vUv = uv;
        #ifdef USE_INSTANCING_COLOR
          vColor = instanceColor;
        #else
          vColor = vec3(1.0);
        #endif
        
        gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying vec2 vUv;
      varying vec3 vColor;
      
      void main() {
        float dist = distance(vUv, vec2(0.5));
        
        // Soft Glow Logic: 1.0 center -> 0.0 edge
        float alpha = 1.0 - smoothstep(0.0, 0.5, dist);
        alpha = pow(alpha, 2.0); // Exponential falloff for "Gas" look
        
        vec3 finalColor = vColor;
        
        if (alpha < 0.01) discard;
        // Strong Opacity (0.5) for clear visibility
        gl_FragColor = vec4(finalColor, alpha * 0.5); 
      }
    `,
    uniforms: {},
    vertexColors: true, 
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  }), []);

  useFrame(() => {
    if (!meshRef.current) return;
    const tempObj = new THREE.Object3D();
    const tempColor = new THREE.Color();

    let count = 0;
    const enemies = Registry.getByTag(Tag.ENEMY);

    for (const e of enemies) {
      if (count >= MAX_GLOWS) break;
      if (e.hasTag(Tag.BULLET)) continue; // Bullets glow themselves

      const t = e.getComponent<TransformComponent>('Transform');
      const id = e.getComponent<IdentityComponent>('Identity');
      if (!t || !id) continue;

      // Position: Behind enemy
      tempObj.position.set(t.x, t.y, -0.5);
      tempObj.rotation.set(0, 0, 0); // Billboards don't rotate
      
      let scale = 2.5;
      let color = '#FFF';

      if (id.variant === EnemyTypes.MUNCHER) {
          color = GAME_THEME.enemy.muncher;
          scale = 3.5;
      } else if (id.variant === EnemyTypes.KAMIKAZE) {
          color = GAME_THEME.enemy.kamikaze;
          scale = 4.0;
      } else if (id.variant === EnemyTypes.HUNTER) {
          color = GAME_THEME.enemy.hunter;
          scale = 5.0;
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
    <instancedMesh ref={meshRef} args={[geometry, shaderMaterial, MAX_GLOWS]}>
    </instancedMesh>
  );
};

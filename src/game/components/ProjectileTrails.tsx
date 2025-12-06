import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Registry } from '../core/ecs/EntityRegistry';
import { Tag } from '../core/ecs/types';
import { TransformComponent } from '../components/data/TransformComponent';
import { MotionComponent } from '../components/data/MotionComponent';
import { LifetimeComponent } from '../components/data/LifetimeComponent';
import { GAME_THEME } from '../theme';
import { createCometTexture } from '../utils/TextureGen';

const MAX_TRAILS = 500; 

export const ProjectileTrails = () => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  
  const geometry = useMemo(() => {
      const geo = new THREE.PlaneGeometry(1, 1);
      geo.translate(0, 0.5, 0); 
      return geo;
  }, []);

  const shaderMaterial = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: `
      // FIX: Robust Guard.
      // If Three.js has injected the logic (USE_INSTANCING_COLOR), we skip.
      // If not (Frame 0), we define it to prevent 'Undeclared Identifier'.
      #ifndef USE_INSTANCING_COLOR
      attribute vec3 instanceColor;
      #endif

      varying vec2 vUv;
      varying vec3 vColor;
      
      void main() {
        vUv = uv;
        vColor = instanceColor; 
        
        gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying vec2 vUv;
      varying vec3 vColor;
      
      void main() {
        // 1. Horizontal Profile (Sharp Beam)
        float distFromCenter = abs(vUv.x - 0.5) * 2.0;
        float beam = 1.0 - pow(distFromCenter, 3.0);
        
        // 2. Tail Decay (Fade out at end)
        float tailDecay = 1.0 - vUv.y;
        tailDecay = pow(tailDecay, 2.0);
        
        // 3. Head Fade (Soft start)
        float headFade = smoothstep(0.0, 0.1, vUv.y);
        
        float alpha = beam * tailDecay * headFade;
        
        vec3 finalColor = mix(vColor, vec3(1.0), beam * 0.8); 
        
        if (alpha < 0.01) discard;
        gl_FragColor = vec4(finalColor, alpha * 0.8);
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
    const bullets = Registry.getByTag(Tag.BULLET);

    for (const b of bullets) {
        if (count >= MAX_TRAILS) break;
        const t = b.getComponent<TransformComponent>('Transform');
        const m = b.getComponent<MotionComponent>('Motion');
        const life = b.getComponent<LifetimeComponent>('Lifetime');
        
        if (!t || !m || !life) continue;

        const isEnemy = b.hasTag(Tag.ENEMY);
        
        // Widths
        const trailWidth = isEnemy ? 1.0 : 0.4;

        const speed = Math.sqrt(m.vx * m.vx + m.vy * m.vy);
        const age = life.total - life.remaining;
        
        const maxLen = isEnemy ? 4.0 : 3.0; 
        const targetLength = Math.min(speed * 0.12, maxLen);
        const currentLength = Math.min(targetLength, age * 10.0); 

        // Position: Behind bullet
        tempObj.position.set(t.x, t.y, -0.2); 
        
        // Rotation
        tempObj.rotation.z = t.rotation + (Math.PI / 2);
        
        // Scale
        tempObj.scale.set(trailWidth, currentLength, 1);

        const colorHex = isEnemy ? GAME_THEME.bullet.hunter : GAME_THEME.bullet.trail;
        tempColor.set(colorHex);

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
    <instancedMesh ref={meshRef} args={[geometry, shaderMaterial, MAX_TRAILS]} renderOrder={-1}>
    </instancedMesh>
  );
};

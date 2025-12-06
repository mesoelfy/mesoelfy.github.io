import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Registry } from '../core/ecs/EntityRegistry';
import { Tag } from '../core/ecs/types';
import { TransformComponent } from '../components/data/TransformComponent';
import { IdentityComponent } from '../components/data/IdentityComponent';
import { LifetimeComponent } from '../components/data/LifetimeComponent';

const MAX_PARTICLES = 1000;

export const ParticleRenderer = () => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const geometry = useMemo(() => new THREE.PlaneGeometry(0.3, 0.3), []); // Slightly larger base size

  const shaderMaterial = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: `
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
        // Circular Particle
        float dist = distance(vUv, vec2(0.5));
        
        // Sharp core, soft edge
        // 1.0 at center, 0.0 at 0.5 radius
        float alpha = 1.0 - smoothstep(0.0, 0.5, dist);
        alpha = pow(alpha, 3.0); // Make it "hot" (fast falloff)
        
        if (alpha < 0.01) discard;
        gl_FragColor = vec4(vColor, alpha);
      }
    `,
    uniforms: {},
    vertexColors: true,
    transparent: true,
    blending: THREE.AdditiveBlending, // Sparks should glow
    depthWrite: false,
  }), []);

  useFrame(() => {
    if (!meshRef.current) return;
    const tempObj = new THREE.Object3D();
    const tempColor = new THREE.Color();

    let count = 0;
    const particles = Registry.getByTag(Tag.PARTICLE);

    for (const p of particles) {
      if (count >= MAX_PARTICLES) break;

      const transform = p.getComponent<TransformComponent>('Transform');
      const identity = p.getComponent<IdentityComponent>('Identity');
      const life = p.getComponent<LifetimeComponent>('Lifetime');
      
      if (!transform || !life) continue;

      tempObj.position.set(transform.x, transform.y, 0);
      
      // Scale based on life: Pop in fast, shrink out slow
      const progress = life.remaining / life.total;
      const scale = progress; 
      
      tempObj.scale.set(scale, scale, 1);
      
      // Identity variant is the Hex Color for particles
      tempColor.set(identity ? identity.variant : '#FFF');
      
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
    <instancedMesh ref={meshRef} args={[geometry, shaderMaterial, MAX_PARTICLES]}>
    </instancedMesh>
  );
};

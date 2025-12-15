import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ServiceLocator } from '@/sys/services/ServiceLocator';
import { Tag } from '@/engine/ecs/types';
import { EnemyTypes } from '@/sys/config/Identifiers';
import { IdentityData } from '@/sys/data/IdentityData';
import { TransformData } from '@/sys/data/TransformData';
import { AIStateData } from '@/sys/data/AIStateData';
import { RenderData } from '@/sys/data/RenderData';
import { ComponentType } from '@/engine/ecs/ComponentType';

// Config
const MAX_DAEMONS = 5;

export const DaemonActor = () => {
  const groupRef = useRef<THREE.Group>(null);
  
  // Pool of objects
  // Each daemon needs: A Root Group, A Cage Mesh, An Orb Mesh
  const pool = useMemo(() => {
      const items: { root: THREE.Group, cage: THREE.Mesh, orb: THREE.Mesh, active: boolean }[] = [];
      const cageGeo = new THREE.OctahedronGeometry(0.7, 0);
      const orbGeo = new THREE.IcosahedronGeometry(0.3, 1);
      
      const cageMat = new THREE.MeshBasicMaterial({ 
          color: '#00F0FF', wireframe: true, transparent: true, opacity: 0.6, toneMapped: false 
      });
      const orbMat = new THREE.MeshBasicMaterial({ 
          color: '#00F0FF', toneMapped: false 
      });

      for(let i=0; i<MAX_DAEMONS; i++) {
          const root = new THREE.Group();
          const cage = new THREE.Mesh(cageGeo, cageMat);
          const orb = new THREE.Mesh(orbGeo, orbMat);
          
          // Rotate Cage 45deg on Y so a vertex points forward (X)
          cage.rotation.y = Math.PI / 4; 
          // Actually, Octahedron vertex is on Axis. So X axis has a point. No rotation needed.
          cage.rotation.y = 0;

          root.add(cage);
          root.add(orb);
          root.visible = false; // Hide initially
          items.push({ root, cage, orb, active: false });
      }
      return items;
  }, []);

  // One-time append to scene
  useMemo(() => {
      // We'll append in the JSX
  }, []);

  useFrame((state, delta) => {
      if (!groupRef.current) return;
      
      // 1. Get Entities
      const registry = ServiceLocator.getRegistry();
      const entities = Array.from(registry.getByTag(Tag.PLAYER)).filter(e => {
          const id = e.getComponent<IdentityData>(ComponentType.Identity);
          return id?.variant === EnemyTypes.DAEMON && e.active;
      });

      // 2. Sync Pool
      for (let i = 0; i < MAX_DAEMONS; i++) {
          const item = pool[i];
          const entity = entities[i]; // May be undefined

          if (!entity) {
              item.root.visible = false;
              continue;
          }

          item.root.visible = true;
          
          const transform = entity.getComponent<TransformData>(ComponentType.Transform);
          const ai = entity.getComponent<AIStateData>(ComponentType.State);
          const render = entity.getComponent<RenderData>(ComponentType.Render);

          if (transform && ai && render) {
              // Position
              item.root.position.set(transform.x, transform.y, 0);
              item.root.rotation.z = transform.rotation;

              // Spin Cage (Visual)
              // Local X-axis spin for "Drill" effect
              item.cage.rotation.x = render.visualRotation;

              // Recoil Logic
              const lastFire = ai.data.lastFireTime || -100;
              const timeSinceFire = state.clock.elapsedTime - lastFire;
              let scaleX = 1.0; 
              let scaleYZ = 1.0;

              if (timeSinceFire < 0.4) {
                  // Compression Kick
                  const t = timeSinceFire / 0.4;
                  // Kick fast, recover slow
                  const kick = Math.pow(1 - t, 3); 
                  scaleX = 1.0 - (kick * 0.4); // Compress length
                  scaleYZ = 1.0 + (kick * 0.3); // Bulge width
              }
              
              item.cage.scale.set(scaleX, scaleYZ, scaleYZ);

              // Orb Logic
              const charge = ai.data.chargeProgress || 0;
              let orbScale = THREE.MathUtils.smoothstep(charge, 0, 1);
              
              if (charge >= 1.0) {
                  // Pulse
                  orbScale *= (1.0 + Math.sin(state.clock.elapsedTime * 15) * 0.15);
              }
              item.orb.scale.setScalar(orbScale);
          }
      }
  });

  return (
    <group ref={groupRef}>
        {pool.map((item, i) => (
            <primitive key={i} object={item.root} />
        ))}
    </group>
  );
};

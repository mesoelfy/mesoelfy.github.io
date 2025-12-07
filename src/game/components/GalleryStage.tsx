import { useMemo, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Grid } from '@react-three/drei';
import * as THREE from 'three';
import { useStore } from '@/core/store/useStore';
import { EnemyTypes } from '@/game/config/Identifiers';
import { GAME_THEME } from '@/game/theme';
import { addBarycentricCoordinates, createHunterSpear } from '@/game/utils/GeometryUtils';

// --- SHADERS (Enemy Body - Wireframe Glow) ---
const bodyVertexShader = `
  attribute vec3 barycentric;
  varying vec3 vBarycentric;
  void main() {
    vBarycentric = barycentric;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const bodyFragmentShader = `
  uniform vec3 uColor;
  uniform float uGlow;
  varying vec3 vBarycentric;
  
  float edgeFactor(vec3 bary, float width) {
    vec3 d = fwidth(bary);
    vec3 a3 = smoothstep(vec3(0.0), d * width, bary);
    return min(min(a3.x, a3.y), a3.z);
  }

  void main() {
    float width = 1.5; 
    float edge = edgeFactor(vBarycentric, width);
    float glow = 1.0 - edge;
    glow = pow(glow, 0.4) + uGlow; 
    
    vec3 coreColor = uColor;
    vec3 edgeColor = vec3(1.0); // Always white edges
    vec3 finalColor = mix(coreColor, edgeColor, 1.0 - smoothstep(0.0, 0.1, edge));
    
    // Add inner glow
    finalColor += coreColor * uGlow * 0.5;

    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

// --- SHADERS (Projectile/VFX - Billboard Glow) ---
const vfxVertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const vfxFragmentShader = `
  varying vec2 vUv;
  uniform vec3 uColor;
  
  void main() {
    float dist = distance(vUv, vec2(0.5));
    // Soft glow ball
    float alpha = 1.0 - smoothstep(0.0, 0.5, dist);
    alpha = pow(alpha, 2.0);
    
    // Bright core
    float core = 1.0 - smoothstep(0.0, 0.15, dist);
    
    vec3 color = mix(uColor, vec3(1.0), core);
    
    if (alpha < 0.05) discard;
    gl_FragColor = vec4(color, alpha);
  }
`;

// --- LOCAL VFX COMPONENT ---
const GalleryVFX = ({ type, isAttacking }: { type: string, isAttacking: boolean }) => {
  const particlesRef = useRef<THREE.InstancedMesh>(null);
  const projectileRef = useRef<THREE.Mesh>(null);
  const orbRef = useRef<THREE.Mesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const { camera } = useThree();

  const projectileMat = useMemo(() => new THREE.ShaderMaterial({
      vertexShader: vfxVertexShader,
      fragmentShader: vfxFragmentShader,
      uniforms: { uColor: { value: new THREE.Color(GAME_THEME.bullet.hunter) } },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide
  }), []);

  useFrame((state) => {
    const time = state.clock.elapsedTime;
    
    // Billboard Logic: Make VFX face camera
    if (orbRef.current) orbRef.current.lookAt(camera.position);
    if (projectileRef.current) projectileRef.current.lookAt(camera.position);

    // --- PARTICLE SYSTEM ---
    if (particlesRef.current) {
        let count = 0;
        
        if (type === EnemyTypes.DRILLER && isAttacking) {
            // DRILLER SPARKS (From Tip Down)
            for(let i=0; i<8; i++) {
                const angle = Math.random() * Math.PI * 2;
                const radius = Math.random() * 0.8;
                const x = Math.cos(angle) * radius;
                const z = Math.sin(angle) * radius;
                const speed = (time * 10 + i) % 1.0;
                
                // Tip is at Y=2.0 (approx)
                dummy.position.set(x, 2.0 - (speed * 2.0), z);
                dummy.scale.setScalar(0.2 * (1.0 - speed));
                dummy.rotation.set(Math.random(), Math.random(), Math.random());
                dummy.updateMatrix();
                particlesRef.current.setMatrixAt(i, dummy.matrix);
                count++;
            }
        } 
        else if (type === EnemyTypes.KAMIKAZE && isAttacking) {
            // EXPLOSION (Pulse)
            const cycle = time % 2.0; 
            if (cycle > 1.5) { // Boom phase
                const progress = (cycle - 1.5) * 2.0; // 0..1
                const expansion = progress * 6.0;
                
                for(let i=0; i<30; i++) {
                    const angle = (i / 30) * Math.PI * 2 + (Math.random() * 0.5);
                    const yDir = (Math.random() - 0.5) * 2.0;
                    
                    dummy.position.set(
                        Math.cos(angle) * expansion, 
                        yDir * expansion, 
                        Math.sin(angle) * expansion
                    );
                    dummy.scale.setScalar(0.5 * (1.0 - progress));
                    dummy.updateMatrix();
                    particlesRef.current.setMatrixAt(i, dummy.matrix);
                    count++;
                }
            }
        }
        
        particlesRef.current.count = count;
        particlesRef.current.instanceMatrix.needsUpdate = true;
    }

    // --- HUNTER PROJECTILES ---
    if (type === EnemyTypes.HUNTER) {
        // Timeline: 2s Cycle. 0-1s Charge, 1-1.2s Fire, 1.2-2s Cooldown
        const cycle = time % 2.0; 
        
        // CHARGE ORB (Tip at Y=1.5 approx)
        if (orbRef.current) {
            if (isAttacking && cycle < 1.0) {
                const scale = cycle * 1.5; // Grow
                orbRef.current.visible = true;
                orbRef.current.scale.setScalar(scale);
                orbRef.current.position.set(0, 1.8, 0); // At tip
            } else {
                orbRef.current.visible = false;
            }
        }

        // BULLET (Fires Upward Y+)
        if (projectileRef.current) {
            if (isAttacking && cycle > 1.0 && cycle < 1.5) {
                projectileRef.current.visible = true;
                const travel = (cycle - 1.0) * 15.0; // Fast
                projectileRef.current.position.set(0, 1.8 + travel, 0);
                projectileRef.current.scale.set(1.5, 1.5, 1.5);
            } else {
                projectileRef.current.visible = false;
            }
        }
    }
  });

  return (
    <>
      <instancedMesh ref={particlesRef} args={[new THREE.PlaneGeometry(0.5, 0.5), undefined, 50]}>
        <meshBasicMaterial color="#FFF" transparent opacity={0.8} blending={THREE.AdditiveBlending} side={THREE.DoubleSide} />
      </instancedMesh>
      
      {type === EnemyTypes.HUNTER && (
          <>
            <mesh ref={orbRef}>
                <planeGeometry args={[1.5, 1.5]} />
                <primitive object={projectileMat} attach="material" />
            </mesh>
            <mesh ref={projectileRef}>
                <planeGeometry args={[1.0, 2.0]} />
                <primitive object={projectileMat} attach="material" />
            </mesh>
          </>
      )}
    </>
  );
};

export const GalleryStage = () => {
  const { galleryTarget, galleryAction } = useStore();
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  // --- GEOMETRY ---
  const drillerGeo = useMemo(() => addBarycentricCoordinates(new THREE.ConeGeometry(1.5, 4.0, 4)), []);
  const kamikazeGeo = useMemo(() => addBarycentricCoordinates(new THREE.IcosahedronGeometry(2.5, 1)), []); // Detail 1 for better wireframe
  const hunterGeo = useMemo(() => createHunterSpear().scale(2, 2, 2), []); 

  // --- SHADER MAT ---
  const shaderMaterial = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: bodyVertexShader,
    fragmentShader: bodyFragmentShader,
    uniforms: {
        uColor: { value: new THREE.Color('#FFFFFF') }, // Default white to ensure visibility if prop fails
        uGlow: { value: 0.0 }
    },
    side: THREE.DoubleSide,
    extensions: { derivatives: true },
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false, // Helps with "Hologram" feel
  }), []);

  useFrame((state, delta) => {
    if (!meshRef.current || !materialRef.current) return;

    const time = state.clock.elapsedTime;
    const isAttack = galleryAction === 'ATTACK';

    // 1. BEHAVIOR ANIMATIONS
    if (galleryTarget === EnemyTypes.DRILLER) {
        // Idle: Slow Float | Attack: Fast Spin + Shake
        const speed = isAttack ? 20.0 : 1.0;
        meshRef.current.rotation.y += speed * delta;
        
        if (isAttack) {
            meshRef.current.position.x = (Math.random() - 0.5) * 0.1;
            meshRef.current.position.z = (Math.random() - 0.5) * 0.1;
        } else {
            meshRef.current.position.set(0, 0, 0);
            // Bobbing
            meshRef.current.position.y = Math.sin(time) * 0.2;
        }
    } 
    else if (galleryTarget === EnemyTypes.KAMIKAZE) {
        // Idle: Tumble | Attack: Violent Shake + Expansion Pulse
        const tumbleSpeed = isAttack ? 5.0 : 0.5;
        meshRef.current.rotation.x += tumbleSpeed * delta;
        meshRef.current.rotation.z += tumbleSpeed * delta;

        if (isAttack) {
            const cycle = time % 2.0; // 2s cycle
            // Shake (0 - 1.5s)
            if (cycle < 1.5) {
                const shake = (cycle / 1.5) * 0.5; // Shake gets harder
                meshRef.current.position.x = (Math.random() - 0.5) * shake;
                meshRef.current.position.y = (Math.random() - 0.5) * shake;
                meshRef.current.scale.setScalar(1.0 + (shake * 0.5)); // Swell
            } 
            // Boom (1.5 - 2.0s) -> Shrink/Hide
            else {
                meshRef.current.scale.setScalar(0.01);
            }
        } else {
            meshRef.current.position.set(0,0,0);
            meshRef.current.scale.setScalar(1.0);
        }
    } 
    else if (galleryTarget === EnemyTypes.HUNTER) {
        // Idle: Spin Y | Attack: Face Front, Charge, Recoil
        if (isAttack) {
            meshRef.current.rotation.set(0,0,0); // Reset
            const cycle = time % 2.0;
            
            // Recoil Effect at 1.0s (Fire)
            if (cycle > 1.0 && cycle < 1.3) {
                meshRef.current.position.y = -1.0; // Kick down (since firing up)
            } else {
                meshRef.current.position.y = THREE.MathUtils.lerp(meshRef.current.position.y, 0, delta * 5);
            }
        } else {
            meshRef.current.rotation.y += delta;
            meshRef.current.position.y = Math.sin(time) * 0.3;
        }
    }

    // 2. COLOR UPDATES
    let baseColor = new THREE.Color();
    let glow = 0.2;

    if (galleryTarget === EnemyTypes.DRILLER) {
        baseColor.set(GAME_THEME.enemy.muncher);
        if (isAttack) glow = 0.8;
    } 
    else if (galleryTarget === EnemyTypes.KAMIKAZE) {
        baseColor.set(GAME_THEME.enemy.kamikaze);
        if (isAttack) {
            const flash = Math.sin(time * 30) > 0;
            if (flash) baseColor.set('#FFFFFF'); // Strobe
            glow = 1.0;
        }
    } 
    else if (galleryTarget === EnemyTypes.HUNTER) {
        baseColor.set(GAME_THEME.enemy.hunter);
        if (isAttack) {
            // Charge up color
            const cycle = time % 2.0;
            if (cycle < 1.0) glow = cycle; 
        }
    }

    materialRef.current.uniforms.uColor.value.copy(baseColor);
    materialRef.current.uniforms.uGlow.value = glow;
  });

  const activeGeo = useMemo(() => {
      switch(galleryTarget) {
          case EnemyTypes.DRILLER: return drillerGeo;
          case EnemyTypes.KAMIKAZE: return kamikazeGeo;
          case EnemyTypes.HUNTER: return hunterGeo;
          default: return drillerGeo;
      }
  }, [galleryTarget, drillerGeo, kamikazeGeo, hunterGeo]);

  return (
    <>
        <OrbitControls makeDefault minDistance={5} maxDistance={20} />
        
        {/* FLOOR GRID */}
        <Grid 
            position={[0, -4, 0]} 
            args={[20, 20]} 
            sectionColor="#00F0FF" 
            cellColor="#001a33" 
            fadeDistance={20}
        />

        {/* ENEMY MODEL */}
        <mesh ref={meshRef} geometry={activeGeo} material={shaderMaterial} />
        
        {/* VFX LAYER */}
        <GalleryVFX type={galleryTarget} isAttacking={galleryAction === 'ATTACK'} />
    </>
  );
};

import { useMemo, useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Grid } from '@react-three/drei';
import * as THREE from 'three';
import { useStore } from '@/core/store/useStore';
import { EnemyTypes } from '@/game/config/Identifiers';
import { GAME_THEME } from '@/game/theme';
import { AssetService } from '@/game/assets/AssetService';

// --- SHADERS ---
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
  uniform float uDissolve;
  varying vec3 vBarycentric;
  
  float edgeFactor(vec3 bary, float width) {
    vec3 d = fwidth(bary);
    vec3 a3 = smoothstep(vec3(0.0), d * width, bary);
    return min(min(a3.x, a3.y), a3.z);
  }

  void main() {
    if (uDissolve > 0.0) {
        float stripes = sin(gl_FragCoord.y * 0.1 + gl_FragCoord.x * 0.1);
        if (stripes < (uDissolve * 2.0 - 1.0)) discard;
    }

    float width = 1.0; 
    float edge = edgeFactor(vBarycentric, width);
    float glow = 1.0 - edge;
    glow = pow(glow, 0.4) + uGlow; 
    
    vec3 coreColor = uColor;
    vec3 edgeColor = vec3(1.0);
    vec3 finalColor = mix(coreColor, edgeColor, 1.0 - smoothstep(0.0, 0.1, edge));
    finalColor += coreColor * uGlow * 0.5;

    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

export const GalleryStage = () => {
  const { galleryTarget, galleryAction } = useStore();
  const meshRef = useRef<THREE.Mesh>(null);
  
  // Force re-render when target changes to ensure geometry swap
  const activeGeo = useMemo(() => {
      try {
          if (galleryTarget === 'PLAYER') return new THREE.ConeGeometry(0.5, 1.5, 3);
          
          let key = 'GEO_DRILLER';
          if (galleryTarget === EnemyTypes.KAMIKAZE) key = 'GEO_KAMIKAZE';
          else if (galleryTarget === EnemyTypes.HUNTER) key = 'GEO_HUNTER';
          else if (galleryTarget === EnemyTypes.DAEMON) key = 'GEO_DAEMON';
          
          return AssetService.get<THREE.BufferGeometry>(key);
      } catch (e) {
          console.warn("Asset Missing in Gallery:", galleryTarget);
          return new THREE.BoxGeometry(1,1,1);
      }
  }, [galleryTarget]);

  const shaderMaterial = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: bodyVertexShader,
    fragmentShader: bodyFragmentShader,
    uniforms: {
        uColor: { value: new THREE.Color('#FFFFFF') },
        uGlow: { value: 0.0 },
        uDissolve: { value: 0.0 }
    },
    side: THREE.DoubleSide,
    transparent: true,
    depthWrite: true,
  }), []);

  // Update geometry manually on ref when it changes (Mesh re-use safety)
  useEffect(() => {
      if (meshRef.current) {
          meshRef.current.geometry = activeGeo;
      }
  }, [activeGeo]);

  useFrame((state, delta) => {
    if (!meshRef.current) return;

    const time = state.clock.elapsedTime;
    let baseColor = new THREE.Color('#FFFFFF');
    let glow = 0.2;
    let dissolve = 0;

    // Color Logic
    if (galleryTarget === EnemyTypes.DRILLER) baseColor.set(GAME_THEME.enemy.muncher);
    else if (galleryTarget === EnemyTypes.KAMIKAZE) baseColor.set(GAME_THEME.enemy.kamikaze);
    else if (galleryTarget === EnemyTypes.HUNTER) baseColor.set(GAME_THEME.enemy.hunter);
    else if (galleryTarget === EnemyTypes.DAEMON) baseColor.set('#00F0FF');
    else if (galleryTarget === 'PLAYER') baseColor.set(GAME_THEME.turret.base);

    // Animation Logic
    meshRef.current.position.set(0, 0, 0);
    meshRef.current.scale.setScalar(1.0);

    if (galleryAction === 'SPAWN') {
        const cycle = (time % 2.0) / 2.0; 
        dissolve = 1.0 - cycle;
        meshRef.current.position.y = -2.0 + (cycle * 2.0);
    } 
    else if (galleryAction === 'DIE') {
        const cycle = (time % 1.5) / 1.5;
        dissolve = cycle;
        meshRef.current.rotation.x += delta * 5;
        meshRef.current.rotation.z += delta * 2;
    }
    else if (galleryAction === 'ATTACK') {
        meshRef.current.rotation.y += delta * 10.0;
        glow = 0.8;
    } 
    else {
        // IDLE
        meshRef.current.rotation.y += delta * 0.5;
        meshRef.current.position.y = Math.sin(time) * 0.2;
    }

    shaderMaterial.uniforms.uColor.value.copy(baseColor);
    shaderMaterial.uniforms.uGlow.value = glow;
    shaderMaterial.uniforms.uDissolve.value = dissolve;
  });

  return (
    <>
        <OrbitControls makeDefault minDistance={3} maxDistance={20} />
        
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1.0} color="#00F0FF" />
        <pointLight position={[-10, -10, -5]} intensity={0.5} color="#9E4EA5" />

        <Grid 
            position={[0, -2, 0]} 
            args={[20, 20]} 
            sectionColor="#00F0FF" 
            cellColor="#001a33" 
            fadeDistance={15}
        />

        <mesh ref={meshRef} material={shaderMaterial} />
    </>
  );
};

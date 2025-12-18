import { useMemo, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { OrbitControls, Grid } from '@react-three/drei';
import * as THREE from 'three';
import { useStore } from '@/engine/state/global/useStore';
import { EnemyTypes } from '@/engine/config/Identifiers';
import { GAME_THEME } from '@/ui/sim/config/theme';
import { AssetService } from '@/ui/sim/assets/AssetService';
import { MaterialFactory } from '@/engine/graphics/MaterialFactory';
import { ShaderLib } from '@/engine/graphics/ShaderLib';

export const GalleryStage = () => {
  const { galleryTarget, galleryAction } = useStore();
  const meshRef = useRef<THREE.Mesh>(null);
  
  const activeGeo = useMemo(() => {
      try {
          if (galleryTarget === 'PLAYER') return new THREE.ConeGeometry(0.5, 1.5, 3);
          
          let key = 'GEO_DRILLER';
          if (galleryTarget === EnemyTypes.KAMIKAZE) key = 'GEO_KAMIKAZE';
          else if (galleryTarget === EnemyTypes.HUNTER) key = 'GEO_HUNTER';
          else if (galleryTarget === EnemyTypes.DAEMON) key = 'GEO_DAEMON';
          
          return AssetService.get<THREE.BufferGeometry>(key);
      } catch (e) {
          return new THREE.BoxGeometry(1,1,1);
      }
  }, [galleryTarget]);

  const shaderMaterial = useMemo(() => {
      return MaterialFactory.create('MAT_GALLERY_BODY', {
          ...ShaderLib.presets.galleryBody,
          uniforms: {
              uColor: { value: new THREE.Color('#FFFFFF') },
              uGlow: { value: 0.0 },
              uDissolve: { value: 0.0 }
          }
      });
  }, []);

  useEffect(() => {
      if (meshRef.current) {
          meshRef.current.geometry = activeGeo;
      }
  }, [activeGeo]);

  useFrame((state, delta) => {
    if (!meshRef.current) return;

    // Manual update of factory uniforms since GalleryStage has its own lifecycle
    MaterialFactory.updateUniforms(state.clock.elapsedTime);

    const time = state.clock.elapsedTime;
    let baseColor = new THREE.Color('#FFFFFF');
    let glow = 0.2;
    let dissolve = 0;

    if (galleryTarget === EnemyTypes.DRILLER) baseColor.set(GAME_THEME.enemy.muncher);
    else if (galleryTarget === EnemyTypes.KAMIKAZE) baseColor.set(GAME_THEME.enemy.kamikaze);
    else if (galleryTarget === EnemyTypes.HUNTER) baseColor.set(GAME_THEME.enemy.hunter);
    else if (galleryTarget === EnemyTypes.DAEMON) baseColor.set('#00F0FF');
    else if (galleryTarget === 'PLAYER') baseColor.set(GAME_THEME.turret.base);

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

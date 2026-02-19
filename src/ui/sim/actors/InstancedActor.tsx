import { useRef, useLayoutEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { RenderBuffer } from '@/engine/graphics/RenderBuffer';
import { RenderOffset, RENDER_STRIDE } from '@/engine/graphics/RenderSchema';

interface InstancedActorProps {
  tag: string;
  geometry: THREE.BufferGeometry;
  material: THREE.Material;
  maxCount: number;
  renderKey?: string; 
  interactive?: boolean; 
  updateEntity?: any; 
  filter?: any;
  baseColor?: string;
  z?: number;
}

export const InstancedActor = ({ 
    geometry, material, maxCount, 
    renderKey 
}: InstancedActorProps) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  
  useLayoutEffect(() => {
    if (meshRef.current) {
        // Ensure instanceColor exists on the mesh
        if (!meshRef.current.instanceColor) {
             meshRef.current.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(maxCount * 3), 3);
        }
        
        // Attach custom attributes to the CURRENT geometry
        meshRef.current.geometry.setAttribute(
            'spawnProgress', 
            new THREE.InstancedBufferAttribute(new Float32Array(maxCount), 1)
        );
    }
  }, [maxCount, geometry]);

  useFrame(() => {
    if (!meshRef.current || !renderKey) return;

    const group = RenderBuffer.getGroup(renderKey);
    const count = group.count;
    const buffer = group.buffer;

    if (count === 0) {
        meshRef.current.count = 0;
        return;
    }

    const spawnAttr = meshRef.current.geometry.getAttribute('spawnProgress') as THREE.InstancedBufferAttribute;
    if (!spawnAttr) return;

    // Grab direct references to the Float32Arrays for maximum speed
    const imArray = meshRef.current.instanceMatrix.array as Float32Array;
    const icArray = meshRef.current.instanceColor?.array as Float32Array | undefined;
    const spawnArray = spawnAttr.array as Float32Array;

    for (let i = 0; i < count; i++) {
        const offset = i * RENDER_STRIDE;
        
        // --- 1. TRS MATRIX COMPOSITION ---
        const px = buffer[offset + RenderOffset.POSITION_X];
        const py = buffer[offset + RenderOffset.POSITION_Y];
        const pz = buffer[offset + RenderOffset.POSITION_Z];
        
        const qx = buffer[offset + RenderOffset.ROTATION_X];
        const qy = buffer[offset + RenderOffset.ROTATION_Y];
        const qz = buffer[offset + RenderOffset.ROTATION_Z];
        const qw = buffer[offset + RenderOffset.ROTATION_W];
        
        const sx = buffer[offset + RenderOffset.SCALE_X];
        const sy = buffer[offset + RenderOffset.SCALE_Y];
        const sz = buffer[offset + RenderOffset.SCALE_Z];

        // Raw Quaternion -> Rotation Matrix + Scale logic
        const x2 = qx + qx, y2 = qy + qy, z2 = qz + qz;
        const xx = qx * x2, xy = qx * y2, xz = qx * z2;
        const yy = qy * y2, yz = qy * z2, zz = qz * z2;
        const wx = qw * x2, wy = qw * y2, wz = qw * z2;

        const mOffset = i * 16;
        
        imArray[mOffset + 0] = (1 - (yy + zz)) * sx;
        imArray[mOffset + 1] = (xy + wz) * sx;
        imArray[mOffset + 2] = (xz - wy) * sx;
        imArray[mOffset + 3] = 0;

        imArray[mOffset + 4] = (xy - wz) * sy;
        imArray[mOffset + 5] = (1 - (xx + zz)) * sy;
        imArray[mOffset + 6] = (yz + wx) * sy;
        imArray[mOffset + 7] = 0;

        imArray[mOffset + 8] = (xz + wy) * sz;
        imArray[mOffset + 9] = (yz - wx) * sz;
        imArray[mOffset + 10] = (1 - (xx + yy)) * sz;
        imArray[mOffset + 11] = 0;

        imArray[mOffset + 12] = px;
        imArray[mOffset + 13] = py;
        imArray[mOffset + 14] = pz;
        imArray[mOffset + 15] = 1;

        // --- 2. COLOR INJECTION ---
        if (icArray) {
            const cOffset = i * 3;
            icArray[cOffset] = buffer[offset + RenderOffset.COLOR_R];
            icArray[cOffset + 1] = buffer[offset + RenderOffset.COLOR_G];
            icArray[cOffset + 2] = buffer[offset + RenderOffset.COLOR_B];
        }
        
        // --- 3. CUSTOM ATTRIBUTE INJECTION ---
        spawnArray[i] = buffer[offset + RenderOffset.SPAWN_PROGRESS];
    }

    // Flag WebGL to upload the arrays to the GPU
    meshRef.current.count = count;
    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
    spawnAttr.needsUpdate = true;
  });

  return (
    <instancedMesh 
      ref={meshRef} 
      args={[geometry, material, maxCount]} 
      frustumCulled={false}
      pointerEvents="none" 
    />
  );
};

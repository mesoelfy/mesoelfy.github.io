import * as THREE from 'three';
import { WorldRect } from './ViewportHelper';

export const addBarycentricCoordinates = (bufferGeometry: THREE.BufferGeometry) => {
  const geometry = bufferGeometry.index ? bufferGeometry.toNonIndexed() : bufferGeometry.clone();
  
  const count = geometry.attributes.position.count;
  const centers = new Float32Array(count * 3);

  for (let i = 0; i < count; i += 3) {
    centers[i * 3] = 1;
    centers[i * 3 + 1] = 0;
    centers[i * 3 + 2] = 0;

    centers[i * 3 + 3] = 0;
    centers[i * 3 + 4] = 1;
    centers[i * 3 + 5] = 0;

    centers[i * 3 + 6] = 0;
    centers[i * 3 + 7] = 0;
    centers[i * 3 + 8] = 1;
  }

  geometry.setAttribute('barycentric', new THREE.BufferAttribute(centers, 3));
  return geometry;
};

export const createHunterSpear = () => {
  const positions: number[] = [];
  const numWings = 3;
  const length = 1.25; 
  const wingWidth = 0.4;
  const wingThickness = 0.05;

  const tipY = length / 2;
  const baseY = -length / 2;

  const rotateY = (x: number, y: number, z: number, rad: number) => {
    return [
      x * Math.cos(rad) - z * Math.sin(rad),
      y,
      x * Math.sin(rad) + z * Math.cos(rad)
    ];
  };

  for(let i=0; i<numWings; i++) {
      const angle = (i / numWings) * Math.PI * 2;
      
      const pTip = [0, tipY, 0];
      const pBaseOut = [wingWidth, baseY, 0];
      const pBaseInBack = [0, baseY, -wingThickness];
      const pBaseInFront = [0, baseY, wingThickness];

      // Front Face
      positions.push(...rotateY(pTip[0], pTip[1], pTip[2], angle));
      positions.push(...rotateY(pBaseOut[0], pBaseOut[1], pBaseOut[2], angle));
      positions.push(...rotateY(pBaseInFront[0], pBaseInFront[1], pBaseInFront[2], angle));
      
      // Back Face
      positions.push(...rotateY(pTip[0], pTip[1], pTip[2], angle));
      positions.push(...rotateY(pBaseInBack[0], pBaseInBack[1], pBaseInBack[2], angle));
      positions.push(...rotateY(pBaseOut[0], pBaseOut[1], pBaseOut[2], angle));
  }
  
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.computeVertexNormals();
  return addBarycentricCoordinates(geometry);
};

// --- NEW HELPER ---
export const getNearestPointOnRect = (x: number, y: number, rect: WorldRect) => {
    // Clamp to AABB
    const cx = Math.max(rect.left, Math.min(x, rect.right));
    const cy = Math.max(rect.bottom, Math.min(y, rect.top));

    // Determine distance to each edge
    const dl = Math.abs(cx - rect.left);
    const dr = Math.abs(cx - rect.right);
    const dt = Math.abs(cy - rect.top);
    const db = Math.abs(cy - rect.bottom);
    
    const min = Math.min(dl, dr, dt, db);
    
    let edgeX = cx;
    let edgeY = cy;
    let normalAngle = 0;

    // Snap to closest edge and define "Normal" (direction OUT of the panel)
    if (min === dl) { 
        edgeX = rect.left; 
        normalAngle = Math.PI; // Point Left
    } else if (min === dr) { 
        edgeX = rect.right; 
        normalAngle = 0; // Point Right
    } else if (min === dt) { 
        edgeY = rect.top; 
        normalAngle = Math.PI / 2; // Point Up
    } else { 
        edgeY = rect.bottom; 
        normalAngle = -Math.PI / 2; // Point Down
    }

    return { x: edgeX, y: edgeY, angle: normalAngle };
};

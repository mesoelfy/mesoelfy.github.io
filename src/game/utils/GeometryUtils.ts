import * as THREE from 'three';

export const addBarycentricCoordinates = (bufferGeometry: THREE.BufferGeometry, removeEdge: boolean = false) => {
  const geometry = bufferGeometry.toNonIndexed();
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

// NEW: Tri-Wing "Paper Airplane" Spear
export const createHunterSpear = () => {
  const positions: number[] = [];
  
  // We build 3 "Wings" (thin triangles)
  const numWings = 3;
  const length = 1.2;
  const wingWidth = 0.4;
  const wingThickness = 0.05; // Give it slight 3D thickness

  for(let i=0; i<numWings; i++) {
      const angle = (i / numWings) * Math.PI * 2;
      
      // We build a triangle in the Y/X plane, then rotate it around Y
      // Tip at (0, length/2, 0)
      // Base Outer at (width, -length/2, 0)
      // Base Inner at (0, -length/2, 0)
      
      const tipY = length / 2;
      const baseY = -length / 2;
      
      // Define vertices for a "Thick" triangle (Wedge)
      // P1: Tip
      // P2: Base Outer Left
      // P3: Base Outer Right
      // P4: Base Center (Axis)
      
      // Let's manually push triangles for a "Fin"
      // Fin stands on the +X axis
      
      const pTip = [0, tipY, 0];
      const pBaseOut = [wingWidth, baseY, 0];
      const pBaseInBack = [0, baseY, -wingThickness];
      const pBaseInFront = [0, baseY, wingThickness];
      
      // Helper to rotate point around Y axis
      const rotateY = (p: number[], rad: number) => {
          const x = p[0];
          const z = p[2];
          return [
              x * Math.cos(rad) - z * Math.sin(rad),
              p[1], // Y unchanged
              x * Math.sin(rad) + z * Math.cos(rad)
          ];
      };

      // Push Triangles
      // 1. Face Front
      let v1 = rotateY(pTip, angle);
      let v2 = rotateY(pBaseOut, angle);
      let v3 = rotateY(pBaseInFront, angle);
      positions.push(...v1, ...v2, ...v3);
      
      // 2. Face Back
      v1 = rotateY(pTip, angle);
      v2 = rotateY(pBaseInBack, angle);
      v3 = rotateY(pBaseOut, angle);
      positions.push(...v1, ...v2, ...v3);
      
      // 3. Base Cap (optional, but good for solidity)
      // ... skipping for wireframe aesthetic
  }
  
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.computeVertexNormals();
  
  return addBarycentricCoordinates(geometry);
};

import * as THREE from 'three';

export const addBarycentricCoordinates = (bufferGeometry: THREE.BufferGeometry) => {
  // Only convert if it's indexed to avoid Three.js console warnings
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
  const length = 1.2;
  const wingWidth = 0.4;
  const wingThickness = 0.05;

  for(let i=0; i<numWings; i++) {
      const angle = (i / numWings) * Math.PI * 2;
      const tipY = length / 2;
      const baseY = -length / 2;
      const pTip = [0, tipY, 0];
      const pBaseOut = [wingWidth, baseY, 0];
      const pBaseInBack = [0, baseY, -wingThickness];
      const pBaseInFront = [0, baseY, wingThickness];
      
      const rotateY = (p: number[], rad: number) => [
          p[0] * Math.cos(rad) - p[2] * Math.sin(rad),
          p[1],
          p[0] * Math.sin(rad) + p[2] * Math.cos(rad)
      ];

      let v1 = rotateY(pTip, angle);
      let v2 = rotateY(pBaseOut, angle);
      let v3 = rotateY(pBaseInFront, angle);
      positions.push(...v1, ...v2, ...v3);
      
      v1 = rotateY(pTip, angle);
      v2 = rotateY(pBaseInBack, angle);
      v3 = rotateY(pBaseOut, angle);
      positions.push(...v1, ...v2, ...v3);
  }
  
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.computeVertexNormals();
  return addBarycentricCoordinates(geometry);
};

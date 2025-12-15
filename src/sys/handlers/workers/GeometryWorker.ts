const computeBarycentric = (positionCount: number) => {
  const array = new Float32Array(positionCount * 3);
  for (let i = 0; i < positionCount; i += 3) {
    // 1,0,0
    array[i * 3 + 0] = 1; array[i * 3 + 1] = 0; array[i * 3 + 2] = 0;
    // 0,1,0
    array[i * 3 + 3] = 0; array[i * 3 + 4] = 1; array[i * 3 + 5] = 0;
    // 0,0,1
    array[i * 3 + 6] = 0; array[i * 3 + 7] = 0; array[i * 3 + 8] = 1;
  }
  return array;
};

const generateHunterSpear = () => {
  const positions: number[] = [];
  const numWings = 3;
  const length = 1.2;
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

  const posArray = new Float32Array(positions);
  const baryArray = computeBarycentric(positions.length / 3);

  return { positions: posArray, barycentric: baryArray };
};

self.onmessage = (e: MessageEvent) => {
  const { id, task } = e.data;
  
  try {
    let result;
    if (task === 'GEO_HUNTER') {
        result = generateHunterSpear();
    } else {
        throw new Error('Unknown task: ' + task);
    }

    self.postMessage(
        { id, success: true, ...result }, 
        [result.positions.buffer, result.barycentric.buffer]
    );
  } catch (err: any) {
    self.postMessage({ id, success: false, error: err.message });
  }
};

import * as THREE from 'three';

// Zero-allocation reusable objects for the render loop
export const axisY = new THREE.Vector3(0, 1, 0); // Model Axis (Up)
export const axisZ = new THREE.Vector3(0, 0, 1); // World Axis (Forward/Screen)
export const qSpin = new THREE.Quaternion();
export const qAim = new THREE.Quaternion();

/**
 * Applies a local Y-axis spin and a global Z-axis aim to an object.
 */
export const applyRotation = (obj: THREE.Object3D, spin: number, aim: number) => {
  // 1. Spin around Local Y (Model Axis)
  qSpin.setFromAxisAngle(axisY, spin);
  
  // 2. Aim around World Z
  // Offset by -PI/2 because model points Up, but 0 radians is Right.
  qAim.setFromAxisAngle(axisZ, aim - Math.PI/2);
  
  // 3. Combine: Aim * Spin
  qAim.multiply(qSpin);
  
  obj.quaternion.copy(qAim);
};

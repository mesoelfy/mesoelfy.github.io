import { useRef, useLayoutEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ServiceLocator } from '@/sys/services/ServiceLocator';
import { Tag } from '@/engine/ecs/types';
import { TransformData } from '@/sys/data/TransformData';
import { RenderData } from '@/sys/data/RenderData';
import { OrdnanceData, OrdnanceType } from '@/sys/data/OrdnanceData';
import { ComponentType } from '@/engine/ecs/ComponentType';

const MAX_PROJECTILES = 2000;
const tempObj = new THREE.Object3D();
const tempColor = new THREE.Color();

// MAPPING: PLASMA=0, SHARD=1, ORB=2, BEAM=3
const TYPE_MAP: Record<OrdnanceType, number> = {
  'PLASMA': 0,
  'SHARD': 1,
  'ORB': 2,
  'BEAM': 3
};

const vertexShader = `
  #ifndef USE_INSTANCING_COLOR
  attribute vec3 instanceColor;
  #endif
  
  attribute float instanceType;
  
  varying vec2 vUv;
  varying vec3 vColor;
  varying float vType;

  void main() {
    vUv = uv;
    vColor = instanceColor;
    vType = instanceType;
    gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = `
  varying vec2 vUv;
  varying vec3 vColor;
  varying float vType;

  // --- SDF FUNCTIONS ---
  
  // Capsule (Plasma)
  float sdCapsule(vec2 p, vec2 a, vec2 b, float r) {
    vec2 pa = p - a, ba = b - a;
    float h = clamp(dot(pa,ba)/dot(ba,ba), 0.0, 1.0);
    return length(pa - ba*h) - r;
  }

  // Rhombus (Shard)
  float sdRhombus(vec2 p, vec2 b) {
    p = abs(p);
    float h = clamp(0.5*(b.x*p.y + b.y*p.x - b.x*b.y)/dot(b,b), -1.0, 1.0);
    float f = length(p - 0.5*b*vec2(1.0-h,1.0+h));
    return f * sign(p.x*b.y + p.y*b.x - b.x*b.y) - 0.01; // Rounding
  }

  // Circle (Orb)
  float sdCircle(vec2 p, float r) {
    return length(p) - r;
  }

  void main() {
    vec2 p = vUv - 0.5; // Centered coords (-0.5 to 0.5)
    float dist = 1.0;
    float glow = 0.0;
    float alpha = 0.0;

    int type = int(vType + 0.1);

    if (type == 0) { 
        // PLASMA (Capsule)
        // Tall thin capsule
        dist = sdCapsule(p, vec2(0.0, -0.35), vec2(0.0, 0.35), 0.08);
        float core = 1.0 - smoothstep(0.0, 0.02, dist);
        glow = exp(-15.0 * max(0.0, dist));
        alpha = core + (glow * 0.5);
    } 
    else if (type == 1) { 
        // SHARD (Rhombus)
        dist = sdRhombus(p, vec2(0.2, 0.4));
        float core = 1.0 - smoothstep(0.0, 0.01, dist);
        glow = exp(-20.0 * max(0.0, dist));
        alpha = core + (glow * 0.4);
    }
    else if (type == 2) { 
        // ORB (Circle with Hole)
        float d1 = sdCircle(p, 0.35);
        // Hollow center
        float core = smoothstep(0.02, 0.0, abs(d1)); 
        // Outer glow
        glow = exp(-8.0 * abs(d1));
        alpha = core + glow;
    }
    
    // Color Mix: White Core + Colored Glow
    vec3 finalColor = mix(vColor, vec3(1.0), alpha > 1.2 ? 0.8 : 0.2);
    
    if (alpha < 0.05) discard;
    gl_FragColor = vec4(finalColor, min(1.0, alpha));
  }
`;

export const OrdnanceRenderer = () => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  
  // Use a simple plane. The shader handles the shape via SDF.
  // We use a plane to ensure minimal vertex count.
  const geometry = useMemo(() => new THREE.PlaneGeometry(1, 1), []);
  
  const material = useMemo(() => new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: {},
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide
  }), []);

  // Buffers
  const typeAttr = useRef<THREE.InstancedBufferAttribute | null>(null);

  useLayoutEffect(() => {
    if (meshRef.current) {
        meshRef.current.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(MAX_PROJECTILES * 3), 3);
        
        typeAttr.current = new THREE.InstancedBufferAttribute(new Float32Array(MAX_PROJECTILES), 1);
        meshRef.current.geometry.setAttribute('instanceType', typeAttr.current);
    }
  }, []);

  useFrame(() => {
    if (!meshRef.current || !typeAttr.current) return;

    let registry;
    try { registry = ServiceLocator.getRegistry(); } catch { return; }

    // We now query by OrdnanceData, not just BULLET tag
    const entities = registry.query({ all: [ComponentType.Ordnance, ComponentType.Transform] });
    let count = 0;

    for (const entity of entities) {
        if (!entity.active || count >= MAX_PROJECTILES) continue;

        const t = entity.getComponent<TransformData>(ComponentType.Transform);
        const o = entity.getComponent<OrdnanceData>(ComponentType.Ordnance);
        const r = entity.getComponent<RenderData>(ComponentType.Render);

        if (!t || !o) continue;

        // Position
        tempObj.position.set(t.x, t.y, 0);
        
        // Rotation
        // -PI/2 because our SDFs are usually vertical-up in UV space, but 0 rad is Right in World
        tempObj.rotation.set(0, 0, t.rotation - (Math.PI / 2));
        
        // Scale
        // Apply visual pulse from RenderData if present
        const scale = (r?.visualScale || 1.0) * t.scale;
        tempObj.scale.setScalar(scale);
        
        tempObj.updateMatrix();
        meshRef.current.setMatrixAt(count, tempObj.matrix);

        // Color
        if (r) {
            tempColor.setRGB(r.r, r.g, r.b);
        } else {
            tempColor.set('#FFFFFF');
        }
        meshRef.current.setColorAt(count, tempColor);

        // Type
        typeAttr.current.setX(count, TYPE_MAP[o.type]);

        count++;
    }

    meshRef.current.count = count;
    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
    typeAttr.current.needsUpdate = true;
  });

  return (
    <instancedMesh 
      ref={meshRef} 
      args={[geometry, material, MAX_PROJECTILES]} 
      frustumCulled={false}
      renderOrder={5} // Above floor, below UI
    />
  );
};

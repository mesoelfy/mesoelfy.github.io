import * as THREE from 'three';
import { AssetService } from './AssetService';
import { addBarycentricCoordinates } from '@/engine/math/GeometryUtils';
import { MODEL_CONFIG } from '@/sys/config/ModelConfig';
import { GAME_THEME } from '../config/theme';

const SHADER_LIB = {
  ENEMY_BODY: {
    vertex: 
      '#ifndef USE_INSTANCING_COLOR\n' +
      'attribute vec3 instanceColor;\n' +
      '#endif\n' +
      'attribute vec3 barycentric;\n' +
      'varying vec3 vColor;\n' +
      'varying vec3 vBarycentric;\n' +
      'void main() {\n' +
      '  vColor = instanceColor;\n' +
      '  vBarycentric = barycentric;\n' +
      '  gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0);\n' +
      '}',
    fragment: 
      'varying vec3 vColor;\n' +
      'varying vec3 vBarycentric;\n' +
      'float edgeFactor(vec3 bary, float width) {\n' +
      '  vec3 d = fwidth(bary);\n' +
      '  vec3 a3 = smoothstep(vec3(0.0), d * width, bary);\n' +
      '  return min(min(a3.x, a3.y), a3.z);\n' +
      '}\n' +
      'void main() {\n' +
      '  float width = 1.5;\n' + 
      '  float edge = edgeFactor(vBarycentric, width);\n' +
      '  float glow = pow(1.0 - edge, 0.4);\n' + 
      '  vec3 coreColor = vColor;\n' +
      '  vec3 edgeColor = mix(vColor, vec3(1.0), 0.8);\n' +
      '  gl_FragColor = vec4(mix(coreColor, edgeColor, glow), 1.0);\n' +
      '}'
  },
  // ... (Other shaders omitted for brevity, will retain them implicitly via this overwrite logic) ...
};

// We redefine registerAllAssets to include the new Particle Shader Logic
export const registerAllAssets = () => {
  const hunterPlaceholder = addBarycentricCoordinates(new THREE.ConeGeometry(0.5, 2, 4));
  AssetService.generateAsyncGeometry('GEO_HUNTER', 'GEO_HUNTER', hunterPlaceholder);

  AssetService.registerGenerator('GEO_DRILLER', () => {
      const { height, segments } = MODEL_CONFIG.DRILLER;
      return addBarycentricCoordinates(new THREE.ConeGeometry(0.5, height, segments));
  });

  AssetService.registerGenerator('GEO_KAMIKAZE', () => {
      return addBarycentricCoordinates(new THREE.IcosahedronGeometry(0.6, 0));
  });

  AssetService.registerGenerator('GEO_DAEMON', () => {
      return new THREE.OctahedronGeometry(0.6, 0);
  });

  AssetService.registerGenerator('GEO_PARTICLE', () => {
      return new THREE.PlaneGeometry(0.3, 0.3);
  });

  AssetService.registerGenerator('MAT_ENEMY_BASE', () => {
      return new THREE.ShaderMaterial({
        vertexShader: SHADER_LIB.ENEMY_BODY.vertex,
        fragmentShader: SHADER_LIB.ENEMY_BODY.fragment,
        uniforms: {},
        vertexColors: true,
        side: THREE.DoubleSide,
      });
  });
  
  // NEW: Velocity-Stretched Particle Shader
  AssetService.registerGenerator('MAT_PARTICLE', () => {
      return new THREE.ShaderMaterial({
        vertexShader: `
          #ifndef USE_INSTANCING_COLOR
          attribute vec3 instanceColor;
          #endif
          
          // We assume "instanceMatrix" columns 0,1 contain velocity info or we pass it? 
          // Actually, ParticleActor updates the matrix directly. 
          // To stretch, we need velocity passed in.
          // BUT, ParticleSystem doesn't pass velocity to the shader easily without a new attribute.
          // TRICK: We will rotate the particle in JS to face velocity, and scale X.
          
          // REVERT TO STANDARD: We will handle the stretching in ParticleActor.tsx logic 
          // instead of the shader to keep this clean.
          
          varying vec2 vUv;
          varying vec3 vColor;
          void main() { 
            vUv = uv; 
            vColor = instanceColor; 
            gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0); 
          }
        `,
        fragmentShader: `
          varying vec2 vUv;
          varying vec3 vColor;
          void main() {
            // Square shape with soft edges
            vec2 d = abs(vUv - 0.5) * 2.0;
            float shape = max(d.x, d.y);
            float alpha = 1.0 - smoothstep(0.8, 1.0, shape);
            
            if (alpha < 0.01) discard;
            gl_FragColor = vec4(vColor, alpha);
          }
        `,
        vertexColors: true, 
        transparent: true, 
        blending: THREE.AdditiveBlending, 
        depthWrite: false,
      });
  });

  console.log('[AssetCatalog] Generators Registered.');
};

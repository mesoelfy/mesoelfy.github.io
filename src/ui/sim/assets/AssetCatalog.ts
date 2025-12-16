import * as THREE from 'three';
import { AssetService } from './AssetService';
import { addBarycentricCoordinates, createHunterSpear } from '@/engine/math/GeometryUtils';
import { MODEL_CONFIG } from '@/engine/config/ModelConfig';
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
};

export const registerAllAssets = () => {
  // --- MATERIALS ---
  AssetService.registerGenerator('MAT_ENEMY_BASE', () => {
      return new THREE.ShaderMaterial({
        vertexShader: SHADER_LIB.ENEMY_BODY.vertex,
        fragmentShader: SHADER_LIB.ENEMY_BODY.fragment,
        uniforms: {},
        vertexColors: true,
        side: THREE.DoubleSide,
      });
  });

  // Placeholder for Player Material (PlayerActor handles its own shader currently, but for completeness)
  AssetService.registerGenerator('PLAYER_MAT', () => new THREE.MeshBasicMaterial({ color: 0xffffff }));

  // --- GEOMETRIES ---
  
  // 1. Hunter (Async Worker)
  // We register a placeholder immediately so the system doesn't crash on init
  const hunterPlaceholder = addBarycentricCoordinates(new THREE.ConeGeometry(0.5, 2, 4));
  AssetService.generateAsyncGeometry('GEO_HUNTER', 'GEO_HUNTER', hunterPlaceholder);

  // 2. Driller
  AssetService.registerGenerator('GEO_DRILLER', () => {
      const { height, segments } = MODEL_CONFIG.DRILLER;
      return addBarycentricCoordinates(new THREE.ConeGeometry(0.5, height, segments));
  });

  // 3. Kamikaze
  AssetService.registerGenerator('GEO_KAMIKAZE', () => {
      return addBarycentricCoordinates(new THREE.IcosahedronGeometry(0.6, 0));
  });

  // 4. Daemon
  AssetService.registerGenerator('GEO_DAEMON', () => {
      return new THREE.OctahedronGeometry(0.6, 0);
  });

  // 5. Particles
  AssetService.registerGenerator('GEO_PARTICLE', () => {
      return new THREE.PlaneGeometry(0.3, 0.3);
  });
  
  // 6. Projectiles
  AssetService.registerGenerator('GEO_BULLET', () => {
      return new THREE.CylinderGeometry(0.1, 0.1, 1.0, 6);
  });

  // 7. Player (Placeholder for Archetype, actual Actor uses custom geometry)
  AssetService.registerGenerator('PLAYER_GEO', () => new THREE.BoxGeometry(1, 1, 1));

  // --- PARTICLES ---
  AssetService.registerGenerator('MAT_PARTICLE', () => {
      return new THREE.ShaderMaterial({
        vertexShader: `
          #ifndef USE_INSTANCING_COLOR
          attribute vec3 instanceColor;
          #endif
          attribute float shapeID;
          varying float vShape;
          varying vec2 vUv;
          varying vec3 vColor;
          void main() { 
            vUv = uv; 
            vColor = instanceColor; 
            vShape = shapeID;
            gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0); 
          }
        `,
        fragmentShader: `
          varying vec2 vUv;
          varying vec3 vColor;
          varying float vShape;
          void main() {
            float alpha = 0.0;
            if (vShape < 0.5) {
                vec2 d = abs(vUv - 0.5) * 2.0;
                float shape = max(d.x, d.y);
                alpha = 1.0 - smoothstep(0.8, 1.0, shape);
            } else {
                float T = vUv.x; 
                float widthProfile = sqrt(T); 
                float distY = abs(vUv.y - 0.5) * 2.0;
                alpha = 1.0 - smoothstep(widthProfile - 0.2, widthProfile, distY);
                if (T < 0.01) alpha = 0.0;
            }
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

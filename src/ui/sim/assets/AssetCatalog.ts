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
  BALLISTIC: {
    vertex: `
      #ifndef USE_INSTANCING_COLOR
      attribute vec3 instanceColor;
      #endif
      varying vec2 vUv;
      varying vec3 vColor;
      void main() {
        vUv = uv;
        vColor = instanceColor;
        gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0);
      }
    `,
    fragment: `
      varying vec2 vUv;
      varying vec3 vColor;
      uniform float uTime;
      float sdCapsule(vec2 p, vec2 a, vec2 b, float r) {
        vec2 pa = p - a, ba = b - a;
        float h = clamp( dot(pa,ba)/dot(ba,ba), 0.0, 1.0 );
        return length( pa - ba*h ) - r;
      }
      void main() {
        vec2 p = vUv - 0.5;
        vec2 a = vec2(0.0, -0.4);
        vec2 b = vec2(0.0, 0.4);
        float radius = 0.08;
        float dist = sdCapsule(p, a, b, radius);
        float core = 1.0 - smoothstep(0.0, 0.02, dist);
        float glow = exp(-25.0 * max(0.0, dist));
        float alpha = core + glow;
        vec3 finalColor = mix(vColor, vec3(1.0), core * 0.9);
        if (alpha < 0.01) discard;
        gl_FragColor = vec4(finalColor, alpha);
      }
    `
  },
  GLOW_BILLBOARD: {
    vertex: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0); }',
    fragment: 
      'varying vec2 vUv; uniform vec3 uColor;\n' +
      'void main() {\n' +
      '  float dist = distance(vUv, vec2(0.5));\n' +
      '  float core = 1.0 - smoothstep(0.2, 0.25, dist);\n' +
      '  float glow = pow(1.0 - smoothstep(0.25, 0.5, dist), 3.0);\n' +
      '  gl_FragColor = vec4(mix(uColor, vec3(1.0), core), max(core, glow));\n' +
      '}'
  }
};

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

  AssetService.registerGenerator('GEO_BALLISTIC', () => {
      return new THREE.PlaneGeometry(1.0, 1.0);
  });
  
  AssetService.registerGenerator('GEO_CHARGE_ORB', () => {
      return new THREE.PlaneGeometry(2.0, 2.0);
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

  AssetService.registerGenerator('MAT_BALLISTIC', () => {
      return new THREE.ShaderMaterial({
        vertexShader: SHADER_LIB.BALLISTIC.vertex,
        fragmentShader: SHADER_LIB.BALLISTIC.fragment,
        uniforms: { uTime: { value: 0 } },
        vertexColors: true,
        transparent: true, 
        blending: THREE.AdditiveBlending, 
        depthWrite: false,
      });
  });
  
  AssetService.registerGenerator('MAT_CHARGE_ORB', () => {
      return new THREE.ShaderMaterial({
        vertexShader: SHADER_LIB.GLOW_BILLBOARD.vertex,
        fragmentShader: SHADER_LIB.GLOW_BILLBOARD.fragment,
        uniforms: { uColor: { value: new THREE.Color(GAME_THEME.bullet.hunter) } },
        transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
      });
  });
  
  AssetService.registerGenerator('MAT_PARTICLE', () => {
      return new THREE.ShaderMaterial({
        vertexShader: 
          '#ifndef USE_INSTANCING_COLOR\n' +
          'attribute vec3 instanceColor;\n' +
          '#endif\n' +
          'varying vec2 vUv;\n' +
          'varying vec3 vColor;\n' +
          'void main() { vUv = uv; vColor = instanceColor; gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0); }',
        fragmentShader: 
          'varying vec2 vUv;\n' +
          'varying vec3 vColor;\n' +
          'void main() {\n' +
          '  float dist = distance(vUv, vec2(0.5));\n' +
          '  float alpha = pow(1.0 - smoothstep(0.0, 0.5, dist), 3.0);\n' +
          '  if (alpha < 0.01) discard;\n' +
          '  gl_FragColor = vec4(vColor, alpha);\n' +
          '}',
        vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
      });
  });

  console.log('[AssetCatalog] Generators Registered.');
};

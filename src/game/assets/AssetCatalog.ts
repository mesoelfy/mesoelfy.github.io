import * as THREE from 'three';
import { AssetService } from './AssetService';
import { addBarycentricCoordinates, createHunterSpear } from '../utils/GeometryUtils';
import { MODEL_CONFIG } from '../config/ModelConfig';
import { GAME_THEME } from '../theme';

// Shaders
const SHADER_LIB = {
  ENEMY_BODY: {
    vertex: `
      #ifndef USE_INSTANCING_COLOR
      attribute vec3 instanceColor;
      #endif
      attribute vec3 barycentric;
      varying vec3 vColor;
      varying vec3 vBarycentric;
      void main() {
        vColor = instanceColor;
        vBarycentric = barycentric;
        gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0);
      }
    `,
    fragment: `
      varying vec3 vColor;
      varying vec3 vBarycentric;
      float edgeFactor(vec3 bary, float width) {
        vec3 d = fwidth(bary);
        vec3 a3 = smoothstep(vec3(0.0), d * width, bary);
        return min(min(a3.x, a3.y), a3.z);
      }
      void main() {
        float width = 1.5; 
        float edge = edgeFactor(vBarycentric, width);
        float glow = pow(1.0 - edge, 0.4); 
        vec3 coreColor = vColor;
        vec3 edgeColor = mix(vColor, vec3(1.0), 0.8);
        gl_FragColor = vec4(mix(coreColor, edgeColor, glow), 1.0);
      }
    `
  },
  // Circular Glow (Enemies/Particles)
  GLOW_BILLBOARD: {
    vertex: `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0); }`,
    fragment: `
      varying vec2 vUv; uniform vec3 uColor;
      void main() {
        float dist = distance(vUv, vec2(0.5));
        float core = 1.0 - smoothstep(0.2, 0.25, dist);
        float glow = pow(1.0 - smoothstep(0.25, 0.5, dist), 3.0);
        gl_FragColor = vec4(mix(uColor, vec3(1.0), core), max(core, glow));
      }
    `
  },
  // Rectangular Beam (Player)
  BEAM_BILLBOARD: {
    vertex: `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0); }`,
    fragment: `
      varying vec2 vUv; uniform vec3 uColor;
      // Signed Distance Box
      float sdBox(vec2 p, vec2 b) { vec2 d = abs(p)-b; return length(max(d,0.0)) + min(max(d.x,d.y),0.0); }
      void main() {
        vec2 p = vUv - 0.5;
        // Box shape (Thin width 0.2, Taller height 0.4 relative to UVs)
        float d = sdBox(p, vec2(0.2, 0.4)); 
        float core = 1.0 - smoothstep(0.0, 0.02, d);
        float glow = exp(-20.0 * max(0.0, d));
        vec3 color = mix(uColor, vec3(1.0), core);
        gl_FragColor = vec4(color, max(core, glow));
      }
    `
  }
};

export const registerAllAssets = () => {
  // --- GEOMETRIES ---
  
  AssetService.registerGenerator('GEO_DRILLER', () => {
      const { radius, height, segments } = MODEL_CONFIG.DRILLER;
      return addBarycentricCoordinates(new THREE.ConeGeometry(radius, height, segments));
  });

  AssetService.registerGenerator('GEO_KAMIKAZE', () => {
      return addBarycentricCoordinates(new THREE.IcosahedronGeometry(0.6, 0));
  });

  AssetService.registerGenerator('GEO_HUNTER', () => {
      return createHunterSpear();
  });

  AssetService.registerGenerator('GEO_DAEMON', () => {
      return new THREE.OctahedronGeometry(0.6, 0);
  });

  AssetService.registerGenerator('GEO_BULLET_PLAYER', () => {
      return new THREE.PlaneGeometry(1.0, 1.0);
  });

  AssetService.registerGenerator('GEO_BULLET_ENEMY', () => {
      return new THREE.PlaneGeometry(2.0, 2.0);
  });
  
  AssetService.registerGenerator('GEO_PARTICLE', () => {
      return new THREE.PlaneGeometry(0.3, 0.3);
  });

  // --- MATERIALS ---

  AssetService.registerGenerator('MAT_ENEMY_BASE', () => {
      return new THREE.ShaderMaterial({
        vertexShader: SHADER_LIB.ENEMY_BODY.vertex,
        fragmentShader: SHADER_LIB.ENEMY_BODY.fragment,
        uniforms: {},
        vertexColors: true,
        extensions: { derivatives: true },
        side: THREE.DoubleSide,
      });
  });

  // RESTORED: Uses BEAM_BILLBOARD shader
  AssetService.registerGenerator('MAT_BULLET_PLAYER', () => {
      return new THREE.ShaderMaterial({
        vertexShader: SHADER_LIB.BEAM_BILLBOARD.vertex,
        fragmentShader: SHADER_LIB.BEAM_BILLBOARD.fragment,
        uniforms: { uColor: { value: new THREE.Color(GAME_THEME.bullet.plasma) } },
        transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
      });
  });

  AssetService.registerGenerator('MAT_BULLET_ENEMY', () => {
      return new THREE.ShaderMaterial({
        vertexShader: SHADER_LIB.GLOW_BILLBOARD.vertex,
        fragmentShader: SHADER_LIB.GLOW_BILLBOARD.fragment,
        uniforms: { uColor: { value: new THREE.Color(GAME_THEME.bullet.hunter) } },
        transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
      });
  });
  
  AssetService.registerGenerator('MAT_PARTICLE', () => {
      return new THREE.ShaderMaterial({
        vertexShader: `
          #ifndef USE_INSTANCING_COLOR
          attribute vec3 instanceColor;
          #endif
          varying vec2 vUv;
          varying vec3 vColor;
          void main() { vUv = uv; vColor = instanceColor; gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0); }
        `,
        fragmentShader: `
          varying vec2 vUv;
          varying vec3 vColor;
          void main() {
            float dist = distance(vUv, vec2(0.5));
            float alpha = pow(1.0 - smoothstep(0.0, 0.5, dist), 3.0);
            if (alpha < 0.01) discard;
            gl_FragColor = vec4(vColor, alpha);
          }
        `,
        vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
      });
  });

  console.log('[AssetCatalog] Generators Registered.');
};

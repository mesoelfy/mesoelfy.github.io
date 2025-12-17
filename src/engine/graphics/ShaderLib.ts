import { chunk_noise } from './glsl/noise';
import { chunk_math } from './glsl/math';

export const ShaderLib = {
  // REUSABLE CHUNKS
  chunks: {
    noise: chunk_noise,
    math: chunk_math,
    
    // Header for Vertex Shaders (Attributes + Varyings)
    vertexHeader: `
      #ifndef USE_INSTANCING_COLOR
      attribute vec3 instanceColor;
      #endif
      attribute vec3 barycentric;
      
      varying vec3 vColor;
      varying vec3 vBarycentric;
      varying vec2 vUv;
      varying vec3 vPos;
      
      uniform float uTime;
    `,

    // Header for Fragment Shaders (Varyings Only)
    fragmentHeader: `
      varying vec3 vColor;
      varying vec3 vBarycentric;
      varying vec2 vUv;
      varying vec3 vPos;
      
      uniform float uTime;
    `,
  },

  // PRE-BUILT SHADERS
  presets: {
    // 1. STANDARD ENEMY (Wireframe + Glow)
    enemy: {
      vertex: `
        void main() {
          vColor = instanceColor;
          vBarycentric = barycentric;
          vUv = uv;
          vPos = position;
          
          gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0);
        }
      `,
      fragment: `
        void main() {
          float width = 1.5;
          float edge = edgeFactor(vBarycentric, width);
          
          // Inner Glow
          float glow = pow(1.0 - edge, 0.4);
          
          vec3 coreColor = vColor;
          vec3 edgeColor = mix(vColor, vec3(1.0), 0.8);
          
          gl_FragColor = vec4(mix(coreColor, edgeColor, glow), 1.0);
        }
      `
    },

    // 2. PARTICLE (Soft Square / Circle morph)
    particle: {
      vertex: `
        attribute float shapeID;
        varying float vShape;
        
        void main() {
          vUv = uv;
          vColor = instanceColor;
          vShape = shapeID;
          
          gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0);
        }
      `,
      fragment: `
        varying float vShape;
        
        void main() {
          float alpha = 0.0;
          
          // Shape 0: Square/Diamond
          if (vShape < 0.5) {
            vec2 d = abs(vUv - 0.5) * 2.0;
            float shape = max(d.x, d.y);
            alpha = 1.0 - smoothstep(0.8, 1.0, shape);
          } 
          // Shape 1: Teardrop/Trail
          else {
            float T = vUv.x; // Trail length
            float distY = abs(vUv.y - 0.5) * 2.0;
            alpha = 1.0 - smoothstep(sqrt(T) - 0.2, sqrt(T), distY);
            if (T < 0.01) alpha = 0.0;
          }
          
          if (alpha < 0.01) discard;
          gl_FragColor = vec4(vColor, alpha);
        }
      `
    }
  }
};

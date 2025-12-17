import { chunk_noise } from './glsl/noise';
import { chunk_math } from './glsl/math';

export const ShaderLib = {
  chunks: {
    noise: chunk_noise,
    math: chunk_math,
    
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

    fragmentHeader: `
      varying vec3 vColor;
      varying vec3 vBarycentric;
      varying vec2 vUv;
      varying vec3 vPos;
      
      uniform float uTime;
    `,
  },

  presets: {
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
          float glow = pow(1.0 - edge, 0.4);
          vec3 coreColor = vColor;
          vec3 edgeColor = mix(vColor, vec3(1.0), 0.8);
          gl_FragColor = vec4(mix(coreColor, edgeColor, glow), 1.0);
        }
      `
    },

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
          if (vShape < 0.5) {
            vec2 d = abs(vUv - 0.5) * 2.0;
            float shape = max(d.x, d.y);
            alpha = 1.0 - smoothstep(0.8, 1.0, shape);
          } else {
            float T = vUv.x; 
            float distY = abs(vUv.y - 0.5) * 2.0;
            alpha = 1.0 - smoothstep(sqrt(T) - 0.2, sqrt(T), distY);
            if (T < 0.01) alpha = 0.0;
          }
          if (alpha < 0.01) discard;
          gl_FragColor = vec4(vColor, alpha);
        }
      `
    },

    glitch: {
      vertex: `
        uniform float uIntensity;
        uniform float uFrequency;
        uniform float uSpeed;

        void main() {
          vUv = uv;
          vColor = vec3(0.0, 1.0, 0.4); // Bright Green
          vBarycentric = barycentric;
          vPos = position; // Pass raw position for scanlines
          
          // Noise Displacement
          // Use uTime to animate, uIntensity to control amount
          float noiseVal = snoise(vec3(position * uFrequency + uTime * uSpeed));
          vec3 displaced = position + normal * noiseVal * uIntensity;
          
          gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
        }
      `,
      fragment: `
        void main() {
          // Increase width to ensure visibility on high-DPI screens
          float width = 1.0; 
          float edge = edgeFactor(vBarycentric, width);
          
          // Digital scanline effect
          float scan = sin(vPos.y * 20.0 - uTime * 5.0) * 0.5 + 0.5;
          
          // Base opacity (0.1) so object is always slightly visible, + wireframe (edge)
          float alpha = 0.1 + (1.0 - edge) * 0.9 + (scan * 0.3);
          
          gl_FragColor = vec4(vColor, alpha);
        }
      `
    }
  }
};

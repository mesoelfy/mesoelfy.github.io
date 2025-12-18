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
          vColor = vec3(0.0, 1.0, 0.4); 
          vBarycentric = barycentric;
          vPos = position; 
          
          float noiseVal = snoise(vec3(position * uFrequency + uTime * uSpeed));
          vec3 displaced = position + normal * noiseVal * uIntensity;
          
          gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
        }
      `,
      fragment: `
        void main() {
          float width = 1.0; 
          float edge = edgeFactor(vBarycentric, width);
          float scan = sin(vPos.y * 20.0 - uTime * 5.0) * 0.5 + 0.5;
          float alpha = 0.1 + (1.0 - edge) * 0.9 + (scan * 0.3);
          gl_FragColor = vec4(vColor, alpha);
        }
      `
    },

    playerAmbient: {
      // Removed 'varying vec2 vUv;' as it is provided by vertexHeader
      vertex: `
        void main() { 
          vUv = uv; 
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); 
        }
      `,
      // Removed 'varying vec2 vUv;' as it is provided by fragmentHeader
      fragment: `
        uniform vec3 uColor; uniform float uOpacity; uniform float uEnergy;
        
        void main() {
          vec2 pos = vUv - 0.5;
          float angle = atan(pos.y, pos.x);
          float warble = (0.005 + 0.015 * uEnergy) * sin(angle * 10.0 + uTime * 2.0);
          float dist = length(pos) + warble;
          float alphaBase = pow(1.0 - smoothstep(0.0, 0.5, dist), 3.5);
          float ringsIdle = 0.6 + 0.4 * sin(dist * 80.0 - uTime * 1.5);
          float ringsActive = 0.5 + 0.5 * sin(dist * 30.0 - uTime * 8.0);
          float ringMix = mix(ringsIdle, ringsActive, uEnergy);
          float scan = 0.85 + 0.15 * sin(dist * 150.0 - uTime * 5.0);
          float finalAlpha = alphaBase * ringMix * scan * uOpacity * (1.0 + (uEnergy * 2.5));
          if (finalAlpha < 0.01) discard;
          gl_FragColor = vec4(uColor, finalAlpha);
        }
      `
    },

    playerBacking: {
      // Removed 'varying vec2 vUv;'
      vertex: `
        void main() { 
          vUv = uv; 
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); 
        }
      `,
      // Removed 'varying vec2 vUv;'
      fragment: `
        uniform vec3 uColor; uniform float uOpacity; 
        void main() { 
          float dist = distance(vUv, vec2(0.5)); 
          float alpha = 1.0 - smoothstep(0.25, 0.5, dist); 
          if (alpha < 0.01) discard; 
          gl_FragColor = vec4(uColor, alpha * uOpacity); 
        }
      `
    },

    galleryBody: {
      // Removed 'attribute vec3 barycentric;' and 'varying vec3 vBarycentric;'
      // They are provided by vertexHeader
      vertex: `
        void main() {
          vBarycentric = barycentric;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      // Removed 'varying vec3 vBarycentric;'
      fragment: `
        uniform vec3 uColor;
        uniform float uGlow;
        uniform float uDissolve;
        
        void main() {
          if (uDissolve > 0.0) {
              float stripes = sin(gl_FragCoord.y * 0.1 + gl_FragCoord.x * 0.1);
              if (stripes < (uDissolve * 2.0 - 1.0)) discard;
          }

          float width = 1.0; 
          float edge = edgeFactor(vBarycentric, width);
          float glow = 1.0 - edge;
          glow = pow(glow, 0.4) + uGlow; 
          
          vec3 coreColor = uColor;
          vec3 edgeColor = vec3(1.0);
          vec3 finalColor = mix(coreColor, edgeColor, 1.0 - smoothstep(0.0, 0.1, edge));
          finalColor += coreColor * uGlow * 0.5;

          gl_FragColor = vec4(finalColor, 1.0);
        }
      `
    }
  }
};

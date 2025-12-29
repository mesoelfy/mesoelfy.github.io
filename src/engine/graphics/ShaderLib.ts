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
      attribute float spawnProgress;
      
      varying vec3 vColor;
      varying vec3 vBarycentric;
      varying vec2 vUv;
      varying vec3 vPos;
      varying float vSpawn;
      
      uniform float uTime;
    `,

    fragmentHeader: `
      varying vec3 vColor;
      varying vec3 vBarycentric;
      varying vec2 vUv;
      varying vec3 vPos;
      varying float vSpawn;
      
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
          vSpawn = spawnProgress;
          gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0);
        }
      `,
      fragment: `
        void main() {
          float noise = snoise(vPos * 3.0 + vec3(0.0, uTime * 0.5, 0.0)) * 0.5 + 0.5;
          float threshold = (1.0 - vSpawn) * 1.4 - 0.2;
          if (noise < threshold) discard;
          float edgeWidth = 0.1;
          float burn = smoothstep(threshold, threshold + edgeWidth, noise);
          float edgeIntensity = 1.0 - burn; 
          float width = 1.5;
          float wireEdge = edgeFactor(vBarycentric, width);
          float glow = pow(1.0 - wireEdge, 0.4);
          vec3 coreColor = vColor;
          float intensity = max(max(vColor.r, vColor.g), vColor.b);
          float isFlash = smoothstep(1.0, 3.0, intensity);
          vec3 wireColor = mix(vec3(1.0), vColor, isFlash);
          vec3 finalColor = mix(coreColor, wireColor, glow);
          vec3 burnColor = vec3(0.8, 1.0, 1.0) * 4.0; 
          finalColor += burnColor * edgeIntensity;
          gl_FragColor = vec4(finalColor, 1.0);
        }
      `
    },

    snifferIndicator: {
      vertex: `
        void main() {
          vPos = position;
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragment: `
        uniform vec3 uColor;
        uniform float uLevel;
        void main() {
          float angle = atan(vPos.y, vPos.x) + 0.55;
          float PI = 3.14159265359;
          int q = int(mod(floor(angle / (PI / 2.0) + 0.5), 4.0));
          bool active = false;
          if (uLevel >= 1.0 && q == 2) active = true;
          if (uLevel >= 2.0 && q == 0) active = true;
          if (uLevel >= 3.0 && q == 3) active = true;
          if (uLevel >= 4.0 && q == 1) active = true;
          if (!active) discard;
          float dist = length(vPos);
          float mask = smoothstep(0.4, 0.65, dist);
          float pulse = 0.8 + 0.2 * sin(uTime * 10.0);
          gl_FragColor = vec4(uColor * pulse * 2.0, mask);
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

    playerAmbient: {
      vertex: `
        void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
      `,
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
      vertex: `
        void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
      `,
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
      vertex: `
        void main() { vBarycentric = barycentric; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
      `,
      fragment: `
        uniform vec3 uColor; uniform float uGlow; uniform float uDissolve;
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
    },

    glitch: {
      vertex: `
        varying float vNoise;
        uniform float uIntensity;
        
        void main() {
          vBarycentric = barycentric;
          vUv = uv;
          vPos = position;
          float n = snoise(vec3(position.x * 2.0, position.y * 2.0, uTime * 5.0));
          vNoise = n;
          vec3 pos = position + normal * n * uIntensity * 0.5;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragment: `
        varying float vNoise;
        uniform float uIntensity;
        uniform float uFrequency;
        uniform float uSpeed;
        
        void main() {
          float width = 1.0 + uIntensity * 2.0;
          float edge = edgeFactor(vBarycentric, width);
          float alpha = 1.0 - smoothstep(0.0, 0.1, edge);
          vec3 baseColor = vec3(0.0, 1.0, 1.0); 
          vec3 flashColor = vec3(1.0, 1.0, 1.0); 
          float scan = sin(gl_FragCoord.y * uFrequency * 0.1 + uTime * uSpeed * 10.0);
          float glitchMix = smoothstep(0.8, 1.0, scan * vNoise);
          if (glitchMix > 0.5) discard;
          vec3 finalColor = mix(baseColor, flashColor, vNoise * uIntensity);
          float fill = uIntensity * 0.2;
          gl_FragColor = vec4(finalColor, max(alpha, fill));
        }
      `
    },

    spitter_proto: {
      vertex: `
        varying float vNoise;
        uniform float uIntensity;
        uniform float uSpeed;
        uniform vec3 uColor;
        
        void main() {
          vUv = uv;
          vPos = position;
          
          #ifdef USE_INSTANCING
            vColor = instanceColor;
          #else
            vColor = uColor;
          #endif

          vec3 p = position * 2.0;
          float time = uTime * uSpeed;
          float n = snoise(p + vec3(time));
          vNoise = n;
          
          vec3 newPos = position + (normal * n * uIntensity * 0.5);
          
          #ifdef USE_INSTANCING
            gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(newPos, 1.0);
          #else
            gl_Position = projectionMatrix * modelViewMatrix * vec4(newPos, 1.0);
          #endif
        }
      `,
      fragment: `
        varying float vNoise;
        // vColor is supplied by vertex shader (either from instance or uniform)
        
        void main() {
          float n = vNoise * 0.5 + 0.5;
          vec3 core = vColor;
          
          // Hotter highlights based on base color + white mix
          vec3 highlight = mix(core, vec3(1.0, 1.0, 1.0), 0.6);
          // Darker shadows
          vec3 shadow = core * 0.3;
          
          vec3 finalColor = mix(shadow, core, n);
          finalColor = mix(finalColor, highlight, smoothstep(0.7, 1.0, n));
          
          gl_FragColor = vec4(finalColor, 1.0);
        }
      `
    }
  }
};

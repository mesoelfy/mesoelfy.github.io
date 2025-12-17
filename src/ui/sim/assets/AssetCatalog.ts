import * as THREE from 'three';
import { AssetService } from './AssetService';
import { addBarycentricCoordinates } from '@/engine/math/GeometryUtils';
import { MODEL_CONFIG } from '@/engine/config/ModelConfig';

const SHADER_LIB = {
  ENEMY_BODY: {
    vertex: '#ifndef USE_INSTANCING_COLOR\nattribute vec3 instanceColor;\n#endif\nattribute vec3 barycentric;\nvarying vec3 vColor;\nvarying vec3 vBarycentric;\nvoid main() {\nvColor = instanceColor;\nvBarycentric = barycentric;\ngl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0);\n}',
    fragment: 'varying vec3 vColor;\nvarying vec3 vBarycentric;\nfloat edgeFactor(vec3 bary, float width) {\nvec3 d = fwidth(bary);\nvec3 a3 = smoothstep(vec3(0.0), d * width, bary);\nreturn min(min(a3.x, a3.y), a3.z);\n}\nvoid main() {\nfloat width = 1.5;\nfloat edge = edgeFactor(vBarycentric, width);\nfloat glow = pow(1.0 - edge, 0.4);\nvec3 coreColor = vColor;\nvec3 edgeColor = mix(vColor, vec3(1.0), 0.8);\ngl_FragColor = vec4(mix(coreColor, edgeColor, glow), 1.0);\n}'
  },
};

export const registerAllAssets = () => {
  AssetService.registerGenerator('MAT_ENEMY_BASE', () => new THREE.ShaderMaterial({ vertexShader: SHADER_LIB.ENEMY_BODY.vertex, fragmentShader: SHADER_LIB.ENEMY_BODY.fragment, uniforms: {}, vertexColors: true, side: THREE.DoubleSide }));
  AssetService.registerGenerator('PLAYER_MAT', () => new THREE.MeshBasicMaterial({ color: 0xffffff }));
  
  const hunterPlaceholder = addBarycentricCoordinates(new THREE.ConeGeometry(0.5, 2, 4));
  AssetService.generateAsyncGeometry('GEO_HUNTER', 'GEO_HUNTER', hunterPlaceholder);

  AssetService.registerGenerator('GEO_DRILLER', () => addBarycentricCoordinates(new THREE.ConeGeometry(0.5, MODEL_CONFIG.DRILLER.height, MODEL_CONFIG.DRILLER.segments)));
  AssetService.registerGenerator('GEO_KAMIKAZE', () => addBarycentricCoordinates(new THREE.IcosahedronGeometry(0.6, 0)));
  AssetService.registerGenerator('GEO_DAEMON', () => new THREE.OctahedronGeometry(0.6, 0));
  AssetService.registerGenerator('GEO_PARTICLE', () => new THREE.PlaneGeometry(0.3, 0.3));
  AssetService.registerGenerator('GEO_BULLET', () => new THREE.CylinderGeometry(0.1, 0.1, 1.0, 6));
  AssetService.registerGenerator('PLAYER_GEO', () => new THREE.BoxGeometry(1, 1, 1));

  AssetService.registerGenerator('MAT_PARTICLE', () => new THREE.ShaderMaterial({
    vertexShader: '#ifndef USE_INSTANCING_COLOR\nattribute vec3 instanceColor;\n#endif\nattribute float shapeID;\nvarying float vShape;\nvarying vec2 vUv;\nvarying vec3 vColor;\nvoid main() { vUv = uv; vColor = instanceColor; vShape = shapeID; gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0); }',
    fragmentShader: 'varying vec2 vUv;\nvarying vec3 vColor;\nvarying float vShape;\nvoid main() {\nfloat alpha = 0.0;\nif (vShape < 0.5) {\nvec2 d = abs(vUv - 0.5) * 2.0;\nfloat shape = max(d.x, d.y);\nalpha = 1.0 - smoothstep(0.8, 1.0, shape);\n} else {\nfloat T = vUv.x;\nfloat distY = abs(vUv.y - 0.5) * 2.0;\nalpha = 1.0 - smoothstep(sqrt(T) - 0.2, sqrt(T), distY);\nif (T < 0.01) alpha = 0.0;\n}\nif (alpha < 0.01) discard;\ngl_FragColor = vec4(vColor, alpha);\n}',
    vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false
  }));
};

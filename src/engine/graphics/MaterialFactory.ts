import * as THREE from 'three';
import { ShaderLib } from './ShaderLib';

class MaterialFactoryController {
  private materials = new Map<string, THREE.ShaderMaterial>();

  public create(id: string, definition: { vertex: string; fragment: string; uniforms?: Record<string, any> }) {
    if (this.materials.has(id)) return this.materials.get(id)!;

    // Inject chunks automatically
    const vertexHeader = ShaderLib.chunks.vertexHeader;
    const fragmentHeader = ShaderLib.chunks.fragmentHeader;
    const math = ShaderLib.chunks.math;
    const noise = ShaderLib.chunks.noise;

    const fullVertex = `
      ${vertexHeader}
      ${definition.vertex}
    `;

    const fullFragment = `
      ${fragmentHeader}
      ${math}
      ${noise}
      ${definition.fragment}
    `;

    const mat = new THREE.ShaderMaterial({
      vertexShader: fullVertex,
      fragmentShader: fullFragment,
      uniforms: {
        uTime: { value: 0 },
        ...(definition.uniforms || {})
      },
      vertexColors: true,
      side: THREE.DoubleSide,
      transparent: true,
      depthWrite: true
    });

    this.materials.set(id, mat);
    return mat;
  }

  // Call this every frame in GameDirector or RenderSystem
  public updateUniforms(time: number) {
    for (const mat of this.materials.values()) {
        if (mat.uniforms.uTime) {
            mat.uniforms.uTime.value = time;
        }
    }
  }
}

export const MaterialFactory = new MaterialFactoryController();

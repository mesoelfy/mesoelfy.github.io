import * as THREE from 'three';
import { ShaderLib } from './ShaderLib';
import { Uniforms } from './Uniforms';

class MaterialFactoryController {
  private materials = new Map<string, THREE.ShaderMaterial>();
  public create(id: string, definition: { vertex: string; fragment: string; uniforms?: Record<string, any> }) {
    if (id === 'MAT_GLITCH' || !this.materials.has(id)) {
        const vertexHeader = ShaderLib.chunks.vertexHeader;
        const fragmentHeader = ShaderLib.chunks.fragmentHeader;
        const math = ShaderLib.chunks.math;
        const noise = ShaderLib.chunks.noise;
        const fullVertex = `${vertexHeader}${noise}${definition.vertex}`;
        const fullFragment = `${fragmentHeader}${math}${noise}${definition.fragment}`;
        const mat = new THREE.ShaderMaterial({
          vertexShader: fullVertex,
          fragmentShader: fullFragment,
          uniforms: {
            [Uniforms.TIME]: { value: 0 },
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
    return this.materials.get(id)!;
  }

  public updateUniforms(time: number) {
    for (const mat of this.materials.values()) {
        if (mat.uniforms[Uniforms.TIME]) {
            mat.uniforms[Uniforms.TIME].value = time;
        }
    }
  }
}

export const MaterialFactory = new MaterialFactoryController();

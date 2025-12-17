import { GPUComputationRenderer, Variable } from 'three/examples/jsm/misc/GPUComputationRenderer';
import * as THREE from 'three';

export class GPGPUManager {
  private gpuCompute: GPUComputationRenderer;
  private variables = new Map<string, Variable>();

  constructor(renderer: THREE.WebGLRenderer, size: number) {
    this.gpuCompute = new GPUComputationRenderer(size, size, renderer);
    
    // Check support
    const status = this.gpuCompute.init();
    if (status !== null) {
        console.error("GPGPU Init Failed:", status);
    }
  }

  public createVariable(name: string, shader: string, initialData: THREE.DataTexture) {
    const variable = this.gpuCompute.addVariable(`texture${name}`, shader, initialData);
    variable.wrapS = THREE.RepeatWrapping;
    variable.wrapT = THREE.RepeatWrapping;
    this.variables.set(name, variable);
    
    // Resolve dependencies automatically (self-referential for simulation)
    this.gpuCompute.setVariableDependencies(variable, [variable]);
    
    return variable;
  }

  public init() {
    const error = this.gpuCompute.init();
    if (error !== null) {
        console.error(error);
    }
  }

  public update() {
    this.gpuCompute.compute();
  }

  public getTexture(name: string) {
    const v = this.variables.get(name);
    if (!v) return null;
    return this.gpuCompute.getCurrentRenderTarget(v).texture;
  }
}

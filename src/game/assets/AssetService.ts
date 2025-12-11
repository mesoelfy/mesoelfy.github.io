import * as THREE from 'three';

class AssetServiceController {
  private cache = new Map<string, any>();
  private generators = new Map<string, () => any>();
  
  // Worker State
  private worker: Worker | null = null;
  private pendingRequests = new Map<string, (data: any) => void>();

  public init() {
    if (typeof window !== 'undefined' && !this.worker) {
        this.worker = new Worker(new URL('../workers/GeometryWorker.ts', import.meta.url));
        this.worker.onmessage = (e) => {
            const { id, success, positions, barycentric } = e.data;
            if (this.pendingRequests.has(id)) {
                this.pendingRequests.get(id)!({ success, positions, barycentric });
                this.pendingRequests.delete(id);
            }
        };
    }
  }

  public registerGenerator(key: string, generator: () => any) {
    this.generators.set(key, generator);
  }

  public get<T>(key: string): T {
    if (this.cache.has(key)) {
      return this.cache.get(key) as T;
    }

    const generator = this.generators.get(key);
    if (!generator) {
      throw new Error(`[AssetService] No generator registered for asset: ${key}`);
    }

    const asset = generator();
    this.cache.set(key, asset);
    return asset as T;
  }

  /**
   * Async Asset Generation.
   * Returns a Placeholder immediately, then updates it when the Worker finishes.
   */
  public generateAsyncGeometry(key: string, taskName: string, placeholderGeo: THREE.BufferGeometry) {
    if (this.cache.has(key)) return; // Already exists

    // 1. Store Placeholder immediately so Renderers have something to show
    this.cache.set(key, placeholderGeo);

    if (!this.worker) this.init();

    // 2. Request from Worker
    if (this.worker) {
        this.worker.postMessage({ id: key, task: taskName });
        
        // 3. Handle Completion
        this.pendingRequests.set(key, (data) => {
            if (data.success) {
                console.log(`[AssetService] Worker finished: ${key}`);
                
                // Update the existing geometry object in place (Reference preservation)
                placeholderGeo.setAttribute('position', new THREE.BufferAttribute(data.positions, 3));
                placeholderGeo.setAttribute('barycentric', new THREE.BufferAttribute(data.barycentric, 3));
                
                // Recalculate bounds/normals for lighting/culling
                placeholderGeo.computeVertexNormals();
                placeholderGeo.computeBoundingSphere();
                
                // Force Three.js update
                placeholderGeo.attributes.position.needsUpdate = true;
            }
        });
    }
  }
}

export const AssetService = new AssetServiceController();

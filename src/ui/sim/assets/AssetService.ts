import * as THREE from 'three';

class AssetServiceController {
  private cache = new Map<string, any>();
  private generators = new Map<string, () => any>();
  
  private worker: Worker | null = null;
  private pendingRequests = new Map<string, (data: any) => void>();

  public init() {
    if (typeof window !== 'undefined' && !this.worker) {
        this.worker = new Worker(new URL('../../../sys/handlers/workers/GeometryWorker.ts', import.meta.url));
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
      throw new Error('[AssetService] No generator registered for asset: ' + key);
    }

    const asset = generator();
    this.cache.set(key, asset);
    return asset as T;
  }

  public generateAsyncGeometry(key: string, taskName: string, placeholderGeo: THREE.BufferGeometry) {
    if (this.cache.has(key)) return; 

    this.cache.set(key, placeholderGeo);

    if (!this.worker) this.init();

    if (this.worker) {
        this.worker.postMessage({ id: key, task: taskName });
        
        this.pendingRequests.set(key, (data) => {
            if (data.success) {
                console.log('[AssetService] Worker finished: ' + key);
                
                placeholderGeo.setAttribute('position', new THREE.BufferAttribute(data.positions, 3));
                placeholderGeo.setAttribute('barycentric', new THREE.BufferAttribute(data.barycentric, 3));
                
                placeholderGeo.computeVertexNormals();
                placeholderGeo.computeBoundingSphere();
                
                placeholderGeo.attributes.position.needsUpdate = true;
            }
        });
    }
  }
}

export const AssetService = new AssetServiceController();

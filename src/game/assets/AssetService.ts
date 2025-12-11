import * as THREE from 'three';

type AssetType = 'GEOMETRY' | 'MATERIAL' | 'TEXTURE';

class AssetServiceController {
  private cache = new Map<string, any>();
  private generators = new Map<string, () => any>();

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

    console.log(`[AssetService] Generating Asset: ${key}`);
    const asset = generator();
    this.cache.set(key, asset);
    return asset as T;
  }

  // Optional: Call this during boot to prevent gameplay stutters
  public preload(keys: string[]) {
    keys.forEach(key => this.get(key));
  }
}

export const AssetService = new AssetServiceController();

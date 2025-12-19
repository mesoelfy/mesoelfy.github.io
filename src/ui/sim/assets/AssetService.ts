import { GeometryKey, MaterialKey } from '@/engine/config/AssetKeys';

export type AssetKey = GeometryKey | MaterialKey | string;

class AssetServiceController {
  private cache = new Map<string, any>();
  private generators = new Map<string, () => any>();

  // Init is now a no-op, kept for API compatibility if needed
  public init() {}

  public registerGenerator(key: AssetKey, generator: () => any) {
    this.generators.set(key, generator);
  }

  public get<T>(key: AssetKey): T {
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
}

export const AssetService = new AssetServiceController();

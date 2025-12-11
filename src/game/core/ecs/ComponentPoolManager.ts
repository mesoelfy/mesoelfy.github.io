import { Component } from './Component';

type CompConstructor = new (...args: any[]) => Component;

class ComponentPoolManagerController {
  private pools = new Map<string, Component[]>();

  // Acquire a component from the pool or create new if empty.
  // Note: We don't construct here because the Builder handles specific args.
  // We return null if empty, letting the Builder do the 'new'.
  public acquire<T extends Component>(type: string): T | null {
    const pool = this.pools.get(type);
    if (pool && pool.length > 0) {
      return pool.pop() as T;
    }
    return null;
  }

  public release(component: Component) {
    const type = component._type;
    if (!this.pools.has(type)) {
      this.pools.set(type, []);
    }
    this.pools.get(type)!.push(component);
  }
  
  public getStats() {
      const stats: Record<string, number> = {};
      for(const [key, pool] of this.pools) {
          stats[key] = pool.length;
      }
      return stats;
  }
}

export const ComponentPoolManager = new ComponentPoolManagerController();

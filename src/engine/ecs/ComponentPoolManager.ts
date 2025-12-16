import { Component } from './Component';
import { ComponentType } from './ComponentType';

class ComponentPoolManagerController {
  private pools = new Map<ComponentType, Component[]>();

  public acquire<T extends Component>(type: ComponentType): T | null {
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

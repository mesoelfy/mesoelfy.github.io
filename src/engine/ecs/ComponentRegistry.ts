import { Component } from './Component';
import { ComponentType } from './ComponentType';
import { ComponentPoolManager } from './ComponentPoolManager';

type ComponentFactory = (data: any) => Component;
type ComponentReset = (component: Component, data: any) => void;

class ComponentRegistryController {
  private factories = new Map<string, ComponentFactory>();
  private resets = new Map<string, ComponentReset>();

  public register<T extends Component>(
      type: ComponentType, 
      factory: () => T, 
      reset: (c: T, data: any) => void
  ) {
      this.factories.set(type, (data) => {
          const comp = factory();
          // Initial hydration
          reset(comp, data); 
          return comp;
      });
      this.resets.set(type, (c, data) => reset(c as T, data));
  }

  public build(type: ComponentType, data: any): Component {
      const resetFn = this.resets.get(type);
      const factoryFn = this.factories.get(type);

      if (!resetFn || !factoryFn) {
          throw new Error(`[ComponentRegistry] Unknown component type: ${type}`);
      }

      // Try Pool
      const pooled = ComponentPoolManager.acquire(type);
      if (pooled) {
          resetFn(pooled, data);
          return pooled;
      }

      // Create New
      return factoryFn(data);
  }
}

export const ComponentRegistry = new ComponentRegistryController();

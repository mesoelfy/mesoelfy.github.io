import { Component } from './Component';
import { ComponentType } from './ComponentType';
import { ComponentPoolManager } from './ComponentPoolManager';

type ComponentConstructor = new () => Component;

class ComponentRegistryController {
  private classes = new Map<ComponentType, ComponentConstructor>();

  public register(type: ComponentType, cls: ComponentConstructor) {
    this.classes.set(type, cls);
  }

  public create(type: ComponentType, data: any = {}): Component {
    const Cls = this.classes.get(type);
    if (!Cls) throw new Error(`ERR_UNKNOWN_COMP: ${type}`);

    const component = ComponentPoolManager.acquire(type) || new Cls();
    if ('reset' in component && typeof (component as any).reset === 'function') {
        (component as any).reset(data);
    }
    return component;
  }
}

export const ComponentRegistry = new ComponentRegistryController();

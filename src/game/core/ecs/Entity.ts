import { EntityID, Tag } from './types';
import { Component } from './Component';

export class Entity {
  // ID is now mutable because pooled entities get new IDs when reused
  public id: EntityID; 
  public readonly tags = new Set<Tag>();
  public active = true;

  // We expose components map for the Registry to clear it efficiently
  public components = new Map<string, Component>();

  constructor(id: EntityID) {
    this.id = id;
  }

  public addComponent(component: Component): this {
    this.components.set(component._type, component);
    return this;
  }

  public getComponent<T extends Component>(type: string): T | undefined {
    return this.components.get(type) as T;
  }
  
  public requireComponent<T extends Component>(type: string): T {
    const c = this.components.get(type);
    if (!c) throw new Error(`Entity ${this.id} missing required component: ${type}`);
    return c as T;
  }

  public hasComponent(type: string): boolean {
    return this.components.has(type);
  }

  public addTag(tag: Tag): this {
    this.tags.add(tag);
    return this;
  }

  public hasTag(tag: Tag): boolean {
    return this.tags.has(tag);
  }

  // NEW: Reset state for pooling
  public reset(newId: EntityID) {
      this.id = newId;
      this.active = true;
      this.tags.clear();
      this.components.clear();
  }
}

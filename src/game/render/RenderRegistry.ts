import { ComponentType } from 'react';

type RendererComponent = ComponentType<any>;

class RenderRegistryController {
  private renderers = new Set<RendererComponent>();

  public register(component: RendererComponent) {
    this.renderers.add(component);
  }

  public getAll(): RendererComponent[] {
    return Array.from(this.renderers);
  }
}

export const RenderRegistry = new RenderRegistryController();

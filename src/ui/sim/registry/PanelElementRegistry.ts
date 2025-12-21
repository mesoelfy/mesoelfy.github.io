import { PanelId } from '@/engine/config/PanelConfig';

class PanelElementRegistryController {
  private elements = new Map<PanelId, HTMLElement>();

  public register(id: PanelId, element: HTMLElement) {
    this.elements.set(id, element);
  }

  public unregister(id: PanelId) {
    this.elements.delete(id);
  }

  public get(id: PanelId) {
    return this.elements.get(id);
  }

  public getAll() {
    return this.elements;
  }
}

export const PanelElementRegistry = new PanelElementRegistryController();

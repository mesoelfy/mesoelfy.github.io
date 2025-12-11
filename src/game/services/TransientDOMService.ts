type UpdateType = 'text' | 'width' | 'css-var';

interface TransientElement {
  el: HTMLElement;
  type: UpdateType;
}

class TransientDOMServiceController {
  private elements = new Map<string, TransientElement>();

  public register(id: string, el: HTMLElement, type: UpdateType) {
    this.elements.set(id, { el, type });
  }

  public unregister(id: string) {
    this.elements.delete(id);
  }

  public update(id: string, value: string | number) {
    const item = this.elements.get(id);
    if (!item) return;

    // Direct DOM manipulation for zero-overhead updates
    if (item.type === 'text') {
        item.el.innerText = String(value);
    } else if (item.type === 'width') {
        item.el.style.width = `${value}%`;
    } else if (item.type === 'css-var') {
        item.el.style.setProperty(`--${id}`, String(value));
    }
  }
}

export const TransientDOMService = new TransientDOMServiceController();

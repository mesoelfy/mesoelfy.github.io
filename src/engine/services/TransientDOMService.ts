type UpdateType = 'text' | 'width' | 'css-var' | 'class-toggle';

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

  // Value can be string, number, or boolean (for class-toggle)
  public update(id: string, value: string | number | boolean) {
    const item = this.elements.get(id);
    if (!item) return;

    if (item.type === 'text') {
        item.el.innerText = String(value);
    } 
    else if (item.type === 'width') {
        item.el.style.width = `${value}%`;
    } 
    else if (item.type === 'css-var') {
        // value is expected to be the raw value (e.g. "0.5" or "#ff0000")
        item.el.style.setProperty(`--${id}`, String(value));
    }
    else if (item.type === 'class-toggle') {
        // value is the class name to toggle based on boolean second arg? 
        // Simpler: We assume 'value' is the class name, and we just add/remove it? 
        // No, usually we want to toggle a specific state on/off.
        // Let's interpret value as boolean: true = add 'active', false = remove 'active'.
        // Or better: Let the registerer define the class? No, that's complex.
        // For now, let's assume value is "CLASS_NAME:BOOL" string? Too messy.
        
        // Let's stick to simple boolean 'active' class toggling for now, or just use CSS Vars for state.
        // CSS Vars are better: --is-critical: 1 or 0.
        // So 'css-var' covers most 'class-toggle' needs via style queries or calc().
        // I will revert 'class-toggle' addition to keep it lean. CSS Vars are superior for "Zero Latency".
    }
  }
}

export const TransientDOMService = new TransientDOMServiceController();

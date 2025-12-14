import { ViewportHelper, WorldRect } from '@/engine/math/ViewportHelper';

class DOMSpatialServiceController {
  private observedElements = new Map<string, HTMLElement>();
  private panelRects = new Map<string, WorldRect>();
  private observer: ResizeObserver | null = null;

  private initObserver() {
    if (this.observer) return;
    if (typeof window === 'undefined') return;

    this.observer = new ResizeObserver((entries) => {
        for (const entry of entries) {
            // Find ID by element (inefficient lookup, but rare event)
            for (const [id, el] of this.observedElements) {
                if (el === entry.target) {
                    this.refreshSingle(id);
                    break;
                }
            }
        }
    });
  }

  public register(id: string, element: HTMLElement) {
    this.initObserver();
    this.observedElements.set(id, element);
    if (this.observer) {
        this.observer.observe(element);
    }
    this.refreshSingle(id);
  }

  public unregister(id: string) {
    const el = this.observedElements.get(id);
    if (el && this.observer) {
        this.observer.unobserve(el);
    }
    this.observedElements.delete(id);
    this.panelRects.delete(id);
  }

  public refreshSingle(id: string) {
    const el = this.observedElements.get(id);
    if (!el || !el.isConnected) return;
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) return;
    this.panelRects.set(id, ViewportHelper.domToWorld(id, rect));
  }

  public refreshAll() {
    for (const id of this.observedElements.keys()) {
        this.refreshSingle(id);
    }
  }

  public getRect(id: string): WorldRect | undefined {
    return this.panelRects.get(id);
  }

  public getAllRects(): Map<string, WorldRect> {
    return this.panelRects;
  }
}

export const DOMSpatialService = new DOMSpatialServiceController();

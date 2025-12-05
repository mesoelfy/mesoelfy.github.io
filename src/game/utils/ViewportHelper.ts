export class ViewportHelperCore {
  public viewport = { width: 1, height: 1 };
  public screenSize = { width: 1, height: 1 };

  public update(vpW: number, vpH: number, screenW: number, screenH: number) {
    this.viewport = { width: vpW, height: vpH };
    this.screenSize = { width: screenW, height: screenH };
  }

  public getPanelWorldRect(panel: { id: string, element: HTMLElement }) {
    if (!panel.element) return null;
    
    const rect = panel.element.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) return null;

    // Use stored screenSize (or fallback to window if needed, but stored is safer for R3F context)
    const sw = this.screenSize.width || window.innerWidth;
    const sh = this.screenSize.height || window.innerHeight;
    
    const vw = this.viewport.width;
    const vh = this.viewport.height;
    
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    
    // Screen (DOM) -> World (Three.js Orthographic)
    const wx = (cx / sw) * vw - (vw / 2);
    const wy = -((cy / sh) * vh - (vh / 2));
    
    const wWidth = (rect.width / sw) * vw;
    const wHeight = (rect.height / sh) * vh;

    return {
      id: panel.id,
      x: wx, y: wy,
      width: wWidth, height: wHeight,
      left: wx - wWidth / 2, right: wx + wWidth / 2,
      top: wy + wHeight / 2, bottom: wy - wHeight / 2,
    };
  }
}

export const ViewportHelper = new ViewportHelperCore();

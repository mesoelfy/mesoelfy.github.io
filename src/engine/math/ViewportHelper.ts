export interface WorldRect {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  left: number;
  right: number;
  top: number;
  bottom: number;
}

export class ViewportHelperCore {
  public viewport = { width: 1, height: 1 }; // R3F Viewport units
  public screenSize = { width: 1, height: 1 }; // Window Pixels

  public update(vpW: number, vpH: number, screenW: number, screenH: number) {
    this.viewport = { width: vpW, height: vpH };
    this.screenSize = { width: screenW, height: screenH };
  }

  // Pure Math: Converts Pixel Rect -> World Rect
  public domToWorld(id: string, domRect: DOMRect): WorldRect {
    const sw = this.screenSize.width || 1;
    const sh = this.screenSize.height || 1;
    
    const vw = this.viewport.width;
    const vh = this.viewport.height;
    
    const cx = domRect.left + domRect.width / 2;
    const cy = domRect.top + domRect.height / 2;
    
    // Screen (Pixels) -> World (Orthographic Units)
    // 0,0 is center of screen in World
    const wx = (cx / sw) * vw - (vw / 2);
    const wy = -((cy / sh) * vh - (vh / 2));
    
    const wWidth = (domRect.width / sw) * vw;
    const wHeight = (domRect.height / sh) * vh;

    return {
      id: id,
      x: wx, y: wy,
      width: wWidth, height: wHeight,
      left: wx - wWidth / 2, right: wx + wWidth / 2,
      top: wy + wHeight / 2, bottom: wy - wHeight / 2,
    };
  }
}

export const ViewportHelper = new ViewportHelperCore();

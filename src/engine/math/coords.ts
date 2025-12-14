// Camera Zoom level defined in GameOverlay
const ZOOM = 40; 

export const screenToWorld = (screenX: number, screenY: number, screenW: number, screenH: number) => {
  // DOM: 0,0 is Top-Left. +Y is Down.
  // THREE: 0,0 is Center. +Y is Up.
  
  const worldX = (screenX - screenW / 2) / ZOOM;
  const worldY = -(screenY - screenH / 2) / ZOOM; // Invert Y
  
  return { x: worldX, y: worldY };
};

export const domRectToWorldRect = (rect: { x: number, y: number, width: number, height: number }, screenW: number, screenH: number) => {
  // Get center of DOM element
  const centerX = rect.x + rect.width / 2;
  const centerY = rect.y + rect.height / 2;
  
  const centerWorld = screenToWorld(centerX, centerY, screenW, screenH);
  
  return {
    x: centerWorld.x,
    y: centerWorld.y,
    width: rect.width / ZOOM,
    height: rect.height / ZOOM,
    left: centerWorld.x - (rect.width / ZOOM / 2),
    right: centerWorld.x + (rect.width / ZOOM / 2),
    top: centerWorld.y + (rect.height / ZOOM / 2),
    bottom: centerWorld.y - (rect.height / ZOOM / 2),
  };
};

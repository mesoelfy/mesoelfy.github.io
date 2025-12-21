import { PanelId } from './PanelConfig';

export interface PanelLayoutDef {
  id: PanelId;
  x: number;      // 0.0 (Left) to 1.0 (Right)
  y: number;      // 0.0 (Top) to 1.0 (Bottom)
  w: number;      // Width %
  h: number;      // Height %
  anchorX: number; // 0.0 (Left), 0.5 (Center), 1.0 (Right)
  anchorY: number; // 0.0 (Top), 0.5 (Center), 1.0 (Bottom)
}

export const LAYOUT_DESKTOP: PanelLayoutDef[] = [
  // LEFT COL
  { id: PanelId.IDENTITY, x: 0.02, y: 0.05, w: 0.28, h: 0.60, anchorX: 0, anchorY: 0 },
  { id: PanelId.SOCIAL,   x: 0.02, y: 0.67, w: 0.28, h: 0.25, anchorX: 0, anchorY: 0 },
  
  // CENTER/RIGHT
  { id: PanelId.FEED,     x: 0.32, y: 0.05, w: 0.66, h: 0.35, anchorX: 0, anchorY: 0 },
  
  // BOTTOM ROW
  { id: PanelId.ART,      x: 0.32, y: 0.42, w: 0.32, h: 0.50, anchorX: 0, anchorY: 0 },
  { id: PanelId.VIDEO,    x: 0.66, y: 0.42, w: 0.32, h: 0.50, anchorX: 0, anchorY: 0 },
];

export const LAYOUT_MOBILE: PanelLayoutDef[] = [
  // Stacked Vertically with gap
  { id: PanelId.IDENTITY, x: 0.5, y: 0.02, w: 0.94, h: 0.35, anchorX: 0.5, anchorY: 0 },
  { id: PanelId.SOCIAL,   x: 0.5, y: 0.39, w: 0.94, h: 0.10, anchorX: 0.5, anchorY: 0 },
  { id: PanelId.FEED,     x: 0.5, y: 0.51, w: 0.94, h: 0.15, anchorX: 0.5, anchorY: 0 },
  { id: PanelId.ART,      x: 0.5, y: 0.68, w: 0.94, h: 0.15, anchorX: 0.5, anchorY: 0 },
  { id: PanelId.VIDEO,    x: 0.5, y: 0.85, w: 0.94, h: 0.12, anchorX: 0.5, anchorY: 0 },
];

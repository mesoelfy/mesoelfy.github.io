import { Component } from '@/core/ecs/Component';
import { ComponentType } from '@/core/ecs/ComponentType';

export class RenderData extends Component {
  readonly _type = ComponentType.Render;

  constructor(
    public geometryId: string = 'DEFAULT_GEO',
    public materialId: string = 'DEFAULT_MAT',
    public visualRotation: number = 0,
    public visualScale: number = 1.0,
    public r: number = 1,
    public g: number = 1,
    public b: number = 1,
    public opacity: number = 1.0,
    public baseR: number = 1,
    public baseG: number = 1,
    public baseB: number = 1
  ) {
    super();
  }

  public reset(
    geometryId: string = 'DEFAULT_GEO',
    materialId: string = 'DEFAULT_MAT',
    visualRotation: number = 0, 
    visualScale: number = 1.0, 
    r: number = 1, 
    g: number = 1, 
    b: number = 1, 
    opacity: number = 1.0
  ) {
    this.geometryId = geometryId;
    this.materialId = materialId;
    this.visualRotation = visualRotation;
    this.visualScale = visualScale;
    this.r = r;
    this.g = g;
    this.b = b;
    this.opacity = opacity;
    this.baseR = r;
    this.baseG = g;
    this.baseB = b;
    return this;
  }
  
  public setColor(hex: string) {
      const c = parseInt(hex.replace('#', ''), 16);
      this.r = ((c >> 16) & 255) / 255;
      this.g = ((c >> 8) & 255) / 255;
      this.b = (c & 255) / 255;
      this.baseR = this.r;
      this.baseG = this.g;
      this.baseB = this.b;
  }
}

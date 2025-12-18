import { Component } from '@/engine/ecs/Component';
import { ComponentType } from '@/engine/ecs/ComponentType';

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
    public baseB: number = 1,
    public flash: number = 0,
    public spawnProgress: number = 1.0 // 0.0 = Invisible, 1.0 = Fully Materialized
  ) {
    super();
  }

  public reset(data: Partial<RenderData>) {
    this.geometryId = data.geometryId ?? 'DEFAULT_GEO';
    this.materialId = data.materialId ?? 'DEFAULT_MAT';
    this.visualRotation = data.visualRotation ?? 0;
    this.visualScale = data.visualScale ?? 1.0;
    this.r = data.r ?? 1;
    this.g = data.g ?? 1;
    this.b = data.b ?? 1;
    this.opacity = data.opacity ?? 1.0;
    this.flash = 0;
    this.spawnProgress = data.spawnProgress ?? 1.0;
    
    this.baseR = this.r;
    this.baseG = this.g;
    this.baseB = this.b;
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

import { Component } from '@/engine/ecs/Component';
import { ComponentType } from '@/engine/ecs/ComponentType';

export class RenderModel extends Component {
  readonly _type = ComponentType.RenderModel;

  constructor(
    public geometryId: string = 'DEFAULT_GEO',
    public materialId: string = 'DEFAULT_MAT',
    public r: number = 1,
    public g: number = 1,
    public b: number = 1,
    public opacity: number = 1.0
  ) {
    super();
  }

  public reset(data: Partial<RenderModel>) {
    this.geometryId = data.geometryId ?? 'DEFAULT_GEO';
    this.materialId = data.materialId ?? 'DEFAULT_MAT';
    this.r = data.r ?? 1;
    this.g = data.g ?? 1;
    this.b = data.b ?? 1;
    this.opacity = data.opacity ?? 1.0;
    return this;
  }
  
  public setColor(hex: string) {
      const c = parseInt(hex.replace('#', ''), 16);
      this.r = ((c >> 16) & 255) / 255;
      this.g = ((c >> 8) & 255) / 255;
      this.b = (c & 255) / 255;
  }
}

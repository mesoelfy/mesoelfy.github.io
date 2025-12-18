import { Component } from '@/engine/ecs/Component';
import { ComponentType } from '@/engine/ecs/ComponentType';
import { TransformStore } from '@/engine/ecs/TransformStore';

const STRIDE = 4;

export class TransformData extends Component {
  readonly _type = ComponentType.Transform;
  
  public index: number;

  constructor() {
    super();
    this.index = TransformStore.alloc();
    this.set(0, 0, 0, 1);
  }

  get x(): number { return TransformStore.data[this.index * STRIDE]; }
  set x(val: number) { TransformStore.data[this.index * STRIDE] = val; }

  get y(): number { return TransformStore.data[this.index * STRIDE + 1]; }
  set y(val: number) { TransformStore.data[this.index * STRIDE + 1] = val; }

  get rotation(): number { return TransformStore.data[this.index * STRIDE + 2]; }
  set rotation(val: number) { TransformStore.data[this.index * STRIDE + 2] = val; }

  get scale(): number { return TransformStore.data[this.index * STRIDE + 3]; }
  set scale(val: number) { TransformStore.data[this.index * STRIDE + 3] = val; }

  public set(x: number, y: number, rotation: number, scale: number) {
    const i = this.index * STRIDE;
    TransformStore.data[i] = x;
    TransformStore.data[i + 1] = y;
    TransformStore.data[i + 2] = rotation;
    TransformStore.data[i + 3] = scale;
  }

  public reset(data: Partial<{ x: number, y: number, rotation: number, scale: number }>) {
    this.set(
        data.x ?? 0, 
        data.y ?? 0, 
        data.rotation ?? 0, 
        data.scale ?? 1
    );
    return this;
  }
}

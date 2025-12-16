import { Component } from '@/engine/ecs/Component';
import { ComponentType } from '@/engine/ecs/ComponentType';
import { TransformStore } from '@/engine/ecs/TransformStore';

const STRIDE = 4;

export class TransformData extends Component {
  readonly _type = ComponentType.Transform;
  
  public index: number;

  constructor(x: number = 0, y: number = 0, rotation: number = 0, scale: number = 1) {
    super();
    this.index = TransformStore.alloc();
    this.set(x, y, rotation, scale);
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

  public reset(x: number = 0, y: number = 0, rotation: number = 0, scale: number = 1) {
    this.set(x, y, rotation, scale);
    return this;
  }
}

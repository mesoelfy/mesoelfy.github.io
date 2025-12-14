import { Component } from '@/engine/ecs/Component';
import { TransformStore } from '@/engine/ecs/TransformStore';

const STRIDE = 4;

export class TransformData extends Component {
  readonly _type = 'Transform';
  
  // Pointer to the global buffer
  public index: number;

  constructor(x: number = 0, y: number = 0, rotation: number = 0, scale: number = 1) {
    super();
    this.index = TransformStore.alloc();
    this.set(x, y, rotation, scale);
  }

  // --- PROXY PROPERTIES ---

  get x(): number { return TransformStore.data[this.index * STRIDE]; }
  set x(val: number) { TransformStore.data[this.index * STRIDE] = val; }

  get y(): number { return TransformStore.data[this.index * STRIDE + 1]; }
  set y(val: number) { TransformStore.data[this.index * STRIDE + 1] = val; }

  get rotation(): number { return TransformStore.data[this.index * STRIDE + 2]; }
  set rotation(val: number) { TransformStore.data[this.index * STRIDE + 2] = val; }

  get scale(): number { return TransformStore.data[this.index * STRIDE + 3]; }
  set scale(val: number) { TransformStore.data[this.index * STRIDE + 3] = val; }

  // --- LIFECYCLE ---

  public set(x: number, y: number, rotation: number, scale: number) {
    const i = this.index * STRIDE;
    TransformStore.data[i] = x;
    TransformStore.data[i + 1] = y;
    TransformStore.data[i + 2] = rotation;
    TransformStore.data[i + 3] = scale;
  }

  public reset(x: number = 0, y: number = 0, rotation: number = 0, scale: number = 1) {
    // When recycling, we keep the same index (slot), just overwrite data
    this.set(x, y, rotation, scale);
    return this;
  }
  
  // Called manually or by a cleanup system if we were fully destroying the object
  // But since we pool TransformData instances, we hold onto the index forever.
  // We only free the index if the Component itself is garbage collected (not pooled).
  // Current architecture: Pools persist -> Indices persist.
}

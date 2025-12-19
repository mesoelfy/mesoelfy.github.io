import { RENDER_STRIDE } from './RenderSchema';

const DEFAULT_CAPACITY = 2000;

export interface RenderGroup {
  count: number;
  buffer: Float32Array;
}

class RenderBufferService {
  private groups = new Map<string, RenderGroup>();

  public getGroup(key: string): RenderGroup {
    let group = this.groups.get(key);
    if (!group) {
      group = {
        count: 0,
        buffer: new Float32Array(DEFAULT_CAPACITY * RENDER_STRIDE)
      };
      this.groups.set(key, group);
    }
    return group;
  }

  public reset() {
    for (const group of this.groups.values()) {
      group.count = 0;
    }
  }

  public ensureCapacity(group: RenderGroup, requiredIndex: number) {
    if (requiredIndex >= group.buffer.length) {
      const newSize = group.buffer.length * 2;
      const newBuffer = new Float32Array(newSize);
      newBuffer.set(group.buffer);
      group.buffer = newBuffer;
      console.log(`[RenderBuffer] Resized group buffer to ${newSize}`);
    }
  }
}

export const RenderBuffer = new RenderBufferService();
export { RENDER_STRIDE };

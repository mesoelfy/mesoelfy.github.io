export interface Vec2 {
  x: number;
  y: number;
}

export const vec2 = (x: number, y: number): Vec2 => ({ x, y });
export const vecZero = (): Vec2 => ({ x: 0, y: 0 });

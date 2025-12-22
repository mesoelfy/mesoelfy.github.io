import { IGameSystem, IInputService } from '@/engine/interfaces';

export class InputSystem implements IGameSystem, IInputService {
  private _cursor = { x: 0, y: 0 };
  private _bounds = { width: 30, height: 20 }; 

  // No constructor listener needed anymore since we don't track world clicks

  update(delta: number, time: number): void {}

  teardown(): void {}

  public updateCursor(x: number, y: number) {
    this._cursor.x = x;
    this._cursor.y = y;
  }
  
  public updateBounds(width: number, height: number) {
      this._bounds.width = width;
      this._bounds.height = height;
  }

  public getCursor() {
    return this._cursor;
  }

  public isPressed(action: string): boolean {
    return false;
  }

  public popClick(): boolean {
      return false; // Stubbed out
  }
}

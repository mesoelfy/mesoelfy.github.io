import { IGameSystem, IInputService } from '@/engine/interfaces';

export class InputSystem implements IGameSystem, IInputService {
  private _cursor = { x: 0, y: 0 };
  
  // Bounds for clamping
  private _bounds = { width: 30, height: 20 }; 

  update(delta: number, time: number): void {
    // No-op for desktop mouse input (handled via updateCursor event in GameDirector)
  }

  teardown(): void {}

  // --- IInputService Implementation ---
  
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
}

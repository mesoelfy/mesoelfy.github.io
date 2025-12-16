import { IGameSystem, IInputService } from '@/engine/interfaces';
import { VirtualJoystickService } from '@/engine/input/VirtualJoystickService';

export class InputSystem implements IGameSystem, IInputService {
  private _cursor = { x: 0, y: 0 };
  
  // Bounds for clamping (updated by GameEngine/ViewportHelper)
  private _bounds = { width: 30, height: 20 }; 

  update(delta: number, time: number): void {
    // Poll Providers
    if (VirtualJoystickService.isActive) {
        const joyVector = VirtualJoystickService.getVector();
        const speed = 30.0; // Virtual cursor speed
        
        this._cursor.x += joyVector.x * speed * delta;
        this._cursor.y += joyVector.y * speed * delta;

        // Clamp to logical world bounds
        const halfW = this._bounds.width / 2;
        const halfH = this._bounds.height / 2;
        
        this._cursor.x = Math.max(-halfW, Math.min(halfW, this._cursor.x));
        this._cursor.y = Math.max(-halfH, Math.min(halfH, this._cursor.y));
    }
  }

  teardown(): void {}

  // --- IInputService Implementation ---
  
  public updateCursor(x: number, y: number) {
    // Mouse movement takes precedence over joystick relative motion
    if (!VirtualJoystickService.isActive) {
        this._cursor.x = x;
        this._cursor.y = y;
    }
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

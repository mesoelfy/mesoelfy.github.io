import { IGameSystem, IServiceLocator, IInputService } from '../core/interfaces';

export class InputSystem implements IGameSystem, IInputService {
  private _cursor = { x: 0, y: 0 };
  private _virtualVector = { x: 0, y: 0 };
  private _usingJoystick = false;
  
  // Bounds for clamping (updated by GameEngine/ViewportHelper)
  private _bounds = { width: 30, height: 20 }; 

  setup(locator: IServiceLocator): void {
    // Initial setup
  }

  update(delta: number, time: number): void {
    // If using joystick, move the cursor based on the vector
    if (this._usingJoystick) {
        const speed = 30.0; // Virtual cursor speed
        
        this._cursor.x += this._virtualVector.x * speed * delta;
        this._cursor.y += this._virtualVector.y * speed * delta;

        // Clamp to logical world bounds (approximate, refined by viewport)
        const halfW = this._bounds.width / 2;
        const halfH = this._bounds.height / 2;
        
        this._cursor.x = Math.max(-halfW, Math.min(halfW, this._cursor.x));
        this._cursor.y = Math.max(-halfH, Math.min(halfH, this._cursor.y));
    }
  }

  teardown(): void {}

  // --- IInputService Implementation ---
  
  public updateCursor(x: number, y: number) {
    // Mouse movement overrides joystick
    this._usingJoystick = false;
    this._cursor.x = x;
    this._cursor.y = y;
  }

  public setJoystickVector(x: number, y: number) {
      if (x === 0 && y === 0) {
          this._usingJoystick = false;
      } else {
          this._usingJoystick = true;
      }
      this._virtualVector.x = x;
      this._virtualVector.y = y;
  }
  
  public updateBounds(width: number, height: number) {
      this._bounds.width = width;
      this._bounds.height = height;
  }

  public getCursor() {
    return this._cursor;
  }

  public isPressed(action: string): boolean {
    // Placeholder for future button mapping
    return false;
  }
}

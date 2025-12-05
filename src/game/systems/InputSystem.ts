import { IGameSystem, IServiceLocator, IInputService } from '../core/interfaces';

export class InputSystem implements IGameSystem, IInputService {
  private _cursor = { x: 0, y: 0 };
  private _keys = new Set<string>();

  setup(locator: IServiceLocator): void {
    // In Phase 5, we will add event listeners here.
    // For now, we rely on the React Component passing cursor data, 
    // effectively "mocking" the listeners.
  }

  update(delta: number, time: number): void {
    // No-op for now, cursor is updated externally via public method
  }

  teardown(): void {
    this._keys.clear();
  }

  // --- IInputService Implementation ---
  
  public updateCursor(x: number, y: number) {
    this._cursor.x = x;
    this._cursor.y = y;
  }

  public getCursorPosition() {
    return this._cursor;
  }

  public getCursor() {
    return this._cursor;
  }

  public isPressed(action: string): boolean {
    return this._keys.has(action);
  }
}

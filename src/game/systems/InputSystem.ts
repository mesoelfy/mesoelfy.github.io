export class InputSystem {
  private _cursor = { x: 0, y: 0 };

  public updateCursor(x: number, y: number) {
    this._cursor.x = x;
    this._cursor.y = y;
  }

  public getCursorPosition() {
    return this._cursor;
  }
}

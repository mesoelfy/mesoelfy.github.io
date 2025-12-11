export class VirtualJoystickServiceController {
  private _vector = { x: 0, y: 0 };
  private _isActive = false;

  public setVector(x: number, y: number) {
    this._vector.x = x;
    this._vector.y = y;
    this._isActive = (x !== 0 || y !== 0);
  }

  public getVector() {
    return this._vector;
  }

  public get isActive() {
    return this._isActive;
  }
}

export const VirtualJoystickService = new VirtualJoystickServiceController();

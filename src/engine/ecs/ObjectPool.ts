type FactoryFn<T> = () => T;
type ResetFn<T> = (item: T) => void;

export class ObjectPool<T> {
  private available: T[] = [];
  private factory: FactoryFn<T>;
  private resetFn: ResetFn<T>;
  private _totalCreated = 0;

  constructor(factory: FactoryFn<T>, resetFn: ResetFn<T>, initialSize: number = 100) {
    this.factory = factory;
    this.resetFn = resetFn;
    this.expand(initialSize);
  }

  private expand(amount: number) {
    for (let i = 0; i < amount; i++) {
      this.available.push(this.factory());
    }
    this._totalCreated += amount;
  }

  public acquire(): T {
    if (this.available.length === 0) {
      // Dynamic expansion: Double current size or add 50
      const expandAmount = Math.max(50, Math.floor(this._totalCreated * 0.5)); 
      this.expand(expandAmount);
    }

    const item = this.available.pop()!;
    this.resetFn(item); 
    return item;
  }

  public release(item: T) {
    this.available.push(item);
  }

  public get totalSize() {
    return this._totalCreated;
  }
  
  public get availableSize() {
      return this.available.length;
  }
}

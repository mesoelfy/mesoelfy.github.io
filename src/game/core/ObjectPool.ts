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
    console.log(`[ObjectPool] Expanding by ${amount}. Total: ${this._totalCreated + amount}`);
    for (let i = 0; i < amount; i++) {
      this.available.push(this.factory());
    }
    this._totalCreated += amount;
  }

  public acquire(): T {
    if (this.available.length === 0) {
      // Dynamic Doubling Strategy: If we run out, double the pool size immediately.
      // We cap expansion minimum at 50 to avoid tiny incremental growths.
      const expandAmount = Math.max(50, this._totalCreated); 
      this.expand(expandAmount);
    }

    const item = this.available.pop()!;
    this.resetFn(item); // Ensure it's clean before handing it out
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

interface Cache<T> {
  data: T;
  timestamp: number;
}

export class CacheManager<T> {
  private cache: Cache<T> = null;

  constructor(private interval: number) {}

  public get(): T {
    if (this.cache && Date.now() - this.cache.timestamp < this.interval) {
      return this.cache.data;
    }
    return null;
  }

  public set(data: T): void {
    this.cache = { data, timestamp: Date.now() };
  }

  public clear() {
    this.cache = null;
  }
}

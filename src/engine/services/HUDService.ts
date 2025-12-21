import { IGameSystem } from '@/engine/interfaces';

/**
 * @deprecated
 * UI Updates are now handled reactively via GameStream.
 * This service is kept for interface compatibility until full removal.
 */
export class HUDService implements IGameSystem {
  update(delta: number, time: number): void {}
  teardown(): void {}

  // Stubs for backward compatibility if any legacy code calls these
  public bindScore(el: HTMLElement | null) {}
  public bindVitals(el: HTMLElement | null) {}
  public bindLevelText(el: Element | null) {}
  public updateScore(val: number) {}
  public updateHealth(percent: number, color: string) {}
  public updateXP(percent: number) {}
  public updateLevel(level: number) {}
}

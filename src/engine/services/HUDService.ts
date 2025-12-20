import { IGameSystem } from '@/engine/interfaces';

export class HUDService implements IGameSystem {
  private scoreNode: HTMLElement | null = null;
  private vitalsContainer: HTMLElement | null = null;
  private levelTextNode: Element | null = null;

  update(delta: number, time: number): void {}
  teardown(): void {
      this.scoreNode = null;
      this.vitalsContainer = null;
      this.levelTextNode = null;
  }

  public bindScore(el: HTMLElement | null) { this.scoreNode = el; }
  public bindVitals(el: HTMLElement | null) { this.vitalsContainer = el; }
  public bindLevelText(el: Element | null) { this.levelTextNode = el; }

  public updateScore(val: number) {
    if (this.scoreNode) {
        this.scoreNode.innerText = val.toString().padStart(4, '0');
    }
  }

  public updateHealth(percent: number, color: string) {
    if (this.vitalsContainer) {
        this.vitalsContainer.style.setProperty('--hp-progress', String(percent));
        this.vitalsContainer.style.setProperty('--hp-color', color);
    }
  }

  public updateXP(percent: number) {
    if (this.vitalsContainer) {
        this.vitalsContainer.style.setProperty('--xp-progress', String(percent));
    }
  }

  public updateLevel(level: number) {
    if (this.levelTextNode) {
        this.levelTextNode.textContent = `LVL_${level.toString().padStart(2, '0')}`;
    }
  }
}

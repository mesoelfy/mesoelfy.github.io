/**
 * Zero-overhead bindings for High-Frequency HUD elements.
 * Systems write directly to these nodes to avoid React Render Cycles.
 */

let scoreNode: HTMLElement | null = null;
let vitalsContainer: HTMLElement | null = null;
let levelTextNode: Element | null = null; 

export const HUDGlobals = {
  // --- BINDINGS (Called by React Components) ---
  bindScore: (el: HTMLElement | null) => { scoreNode = el; },
  bindVitals: (el: HTMLElement | null) => { vitalsContainer = el; },
  bindLevelText: (el: Element | null) => { levelTextNode = el; },

  // --- UPDATERS (Called by Engine Systems) ---
  updateScore: (val: number) => {
    if (scoreNode) {
        // Direct text update, no virtual DOM diffing
        scoreNode.innerText = val.toString().padStart(4, '0');
    }
  },

  updateHealth: (percent: number, color: string) => {
    if (vitalsContainer) {
        // Update CSS Variables for the SVG Ring
        vitalsContainer.style.setProperty('--hp-progress', String(percent));
        vitalsContainer.style.setProperty('--hp-color', color);
    }
  },

  updateXP: (percent: number) => {
    if (vitalsContainer) {
        vitalsContainer.style.setProperty('--xp-progress', String(percent));
    }
  },

  updateLevel: (level: number) => {
    if (levelTextNode) {
        levelTextNode.textContent = `LVL_${level.toString().padStart(2, '0')}`;
    }
  }
};

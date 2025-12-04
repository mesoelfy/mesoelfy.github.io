# MESOELFY_OS // DEVELOPMENT ROADMAP

## PHASE 1: VISUAL & LAYOUT POLISH (In Progress)
- [x] **Panel Sizing:** Fixed Art Grid density and HoloComm video aspect ratios.
- [x] **Intro Sequence:** Implemented "Matrix Bootloader" with narrative typing.
- [x] **Typography:** Implemented "VT323" (VCR style) for Headers/Buttons.
- [ ] **Bug Fixes:** Address incoming user tweaks.

## PHASE 2: THE AUDIO ENGINE (Generative)
- [ ] **The "Golden Key":** Bind AudioContext creation strictly to the `[ INITIALIZE_SYSTEM ]` button.
- [ ] **Synth System:** Create `src/core/audio/useSynth.ts` (Web Audio API).
    - Boot Sound: THX-style deep drone + glitch.
    - UI Sounds: High-pitch blips for hover, low-pitch thud for clicks.

## PHASE 3: THE GAME LAYER ("Latent Defense")
- [ ] **Overlay System:** `GameOverlayCanvas` (Z-Index 50) sitting ON TOP of the DOM.
- [ ] **The Turret Cursor:** 
    - Custom cursor component.
    - Auto-fire logic (Raycasting 2D) when enemies are within range.
    - *No clicking required to shoot.*
- [ ] **Panel Registry:** System to map DOM elements (GlassPanels) to Canvas coordinates for enemies to attack.
- [ ] **Health System:** 
    - Visuals: CSS `clip-path` jitter and `hue-rotate` glitches on damaged panels.
    - UI: "INTEGRITY" bars added to panel headers.

## PHASE 4: PERSISTENCE & CONTENT
- [ ] **Save State:** Track high scores and system health in `localStorage`.
- [ ] **Content Injection:** Fill JSON files with final text/links.

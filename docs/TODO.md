# MESOELFY_OS // DEVELOPMENT ROADMAP

## PHASE 1: VISUAL & LAYOUT POLISH (COMPLETE)
- [x] **Panel Sizing:** Fixed Art Grid density and HoloComm video aspect ratios.
- [x] **Intro Sequence:** Implemented "Matrix Bootloader" with narrative typing.
- [x] **Typography:** Implemented "High-Low" system (Montserrat Black + Courier New).
- [x] **Visual Tuning:** Fixed Green Shimmer and Cursor animations.

## PHASE 2: THE AUDIO ENGINE (COMPLETE)
- [x] **The "Golden Key":** AudioContext unlocks on `[ INITIALIZE_SYSTEM ]`.
- [x] **Synth System:** Generative Web Audio API implementation.
    - Boot Sound: Deep drone + glitch.
    - UI Sounds: Hover blips and Click thuds.
- [x] **Soundscaping:** Wired SFX to all interactive elements.

## PHASE 3: THE GAME LAYER ("Latent Defense")
- [ ] **Overlay System:** `GameOverlayCanvas` (Z-Index 50) sitting ON TOP of the DOM.
- [ ] **The Turret Cursor:** 
    - Custom cursor component.
    - Auto-fire logic (Raycasting 2D) when enemies are within range.
- [ ] **Panel Registry:** System to map DOM elements to Canvas coordinates.
- [ ] **Health System:** Visual glitch effects on damaged panels.

## PHASE 4: PERSISTENCE & CONTENT
- [ ] **Save State:** Track high scores and system health in `localStorage`.
- [ ] **Content Injection:** Fill JSON files with final text/links.

## KNOWN BUGS
- [ ] **White Flash on Refresh (FOUC):** The 3D Canvas areas flash white briefly on page reload before the WebGL context initializes, despite CSS background settings. Needs investigation into Next.js/R3F hydration order.

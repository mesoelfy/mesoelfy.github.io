# MESOELFY_OS // DEVELOPMENT ROADMAP

## PHASE 1: VISUAL & LAYOUT POLISH (In Progress)
- [x] **Panel Sizing:** Fixed Art Grid density and HoloComm video aspect ratios.
- [x] **Intro Sequence:** Implemented "Matrix Bootloader" with narrative typing and bespoke UI headers.
- [ ] **Intro Refinement:** 
    - Fine-tune specific timing of "dots" blinking vs text appearance.
    - Polish the "Breach" transition physics.
- [ ] **Bug Fix:** Investigate "White Flash" on browser refresh (FOUC). 
    - *Note: `theme-color` meta tag was added, but next.js hydration might still be causing a flash.*

## PHASE 2: THE AUDIO ENGINE (Generative)
- [ ] **Synth System:** Create `src/core/audio/useSynth.ts`.
    - Web Audio API implementation (No mp3 files).
    - Sounds: Hover (Sine blip), Click (Sawtooth), Error (Sawtooth drop), Open (Sweep).
- [ ] **Music Player:**
    - Hidden HTML5 Audio element.
    - Header UI: `<< [TRACK_NAME] >>` controls.

## PHASE 3: THE GAME LAYER ("Latent Defense")
- [ ] **Overlay System:** Create a 2D Canvas layer that sits **ON TOP** of the DOM UI.
- [ ] **Player:** Custom Reticle cursor + Auto-fire logic.
- [ ] **Enemies:** "Seekers" (Chase Player) and "Eaters" (Attack Panels).
- [ ] **Juiciness:** Particle bursts and screen shake.

## PHASE 4: PERSISTENCE & DESTRUCTION (Tamagotchi Logic)
- [ ] **Health System:** Track HP for Player + 4 Panels. Persist to `localStorage`.
- [ ] **Visual Corruption:** CSS filters/glitch effects on damaged panels.
- [ ] **The Reset:** Konami Code protocol to restore system health.

## PHASE 5: CONTENT INJECTION
- [ ] **Identity:** Real Bio/Stats.
- [ ] **Feed:** Real X posts.
- [ ] **Gallery:** Real X image links.
- [ ] **Videos:** Final Anime/Esper clip IDs.

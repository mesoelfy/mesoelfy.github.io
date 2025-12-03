# MESOELFY_OS // DEVELOPMENT ROADMAP

## PHASE 1: VISUAL & LAYOUT POLISH (Current)
- [ ] **Panel Sizing:**
    - Expand `ART_DB` to 5 rows (15 slots) for higher density.
    - Widen `HOLO_COMM` to ~45% to eliminate YouTube letterboxing (force 16:9).
- [ ] **Fire Intro:** Implement the "Burn Away" GLSL shader transition for the initial load.

## PHASE 2: THE AUDIO ENGINE (Generative)
- [ ] **Synth System:** Create `src/core/audio/useSynth.ts`.
    - Web Audio API implementation (No mp3 files).
    - Sounds: Hover (Sine blip), Click (Sawtooth), Error (Sawtooth drop), Open (Sweep).
- [ ] **Music Player:**
    - Hidden HTML5 Audio element.
    - Header UI: `<< [TRACK_NAME] >>` controls.
    - Global Mute toggle (affects both Synth and Music).

## PHASE 3: THE GAME LAYER ("Latent Defense")
- [ ] **Overlay System:** Create a 2D Canvas layer that sits **ON TOP** of the DOM UI (z-index: 50).
- [ ] **Player:** 
    - Hide system cursor.
    - Render custom "Reticle" that follows mouse.
    - Auto-fire logic (closest enemy).
- [ ] **Enemies:**
    - **Seekers:** Red shapes. Chase the cursor. Damage Player.
    - **Eaters:** Purple/Glitch shapes. Spawn on specific Panels. Damage Panels.
- [ ] **Juiciness:** 
    - Particle bursts on kill.
    - Screen shake on damage.

## PHASE 4: PERSISTENCE & DESTRUCTION (Tamagotchi Logic)
- [ ] **Health System:** 
    - Store `HP` for Player, Identity, Feed, Art, Holo.
    - Persist to `localStorage` (Save state remains on refresh).
- [ ] **Visual Corruption:**
    - **Stage 1 (Damaged):** CSS hue-rotate/blur filters on panels.
    - **Stage 2 (Broken):** "Static Noise" overlay. Interaction disabled.
    - **Footer Status:** Text changes based on total system integrity.
- [ ] **The Reset:**
    - Click `LATENT_CORE` (Footer) to open "KERNEL RESTORE".
    - Input Konami Code (`↑↑↓↓←→←→ba⏎`) to reboot.
    - White flash animation -> Restore all HP to 100%.

## PHASE 5: CONTENT INJECTION
- [ ] **Identity:** Real Bio/Stats.
- [ ] **Feed:** Real X posts.
- [ ] **Gallery:** Real X image links.
- [ ] **Videos:** Final Anime/Esper clip IDs.

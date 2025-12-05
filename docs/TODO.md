# MESOELFY_OS // DEVELOPMENT ROADMAP





## 🟢 COMPLETED 


## 🟡 CURRENT FOCUS: VISUAL POLISH (The "Neon" Vibe)
*Since the post-processing library is incompatible with React 19, we must implement manual shaders.*
- [ ] **Manual Bloom:** Implement a custom shader pass or "Fake Glow" meshes to achieve the neon look without heavy post-processing.
- [ ] **Chromatic Aberration:** Add a glitch effect that triggers on damage/low health.
- [ ] **CRT/Scanline Effect:** Optional overlay for the retro hacker vibe.

## 🟠 GAMEPLAY DEPTH
- [ ] **Player Health UI:** Visualize player HP in MESOELFY_OS header (currently hidden in logic).
- [ ] **Score System:** Display score on HUD and trigger "Level Up" events.
- [ ] **Powerups:**
    -   *Rapid Fire:* Increase fire rate temporarily.
    -   *Spread Shot:* Triple shot.
    -   *Shield:* One-hit protection.
- [ ] **Wave System:** Instead of infinite random spawns, structure waves with increasing difficulty.

## 🔴 NEW ENEMIES (From Audit)
- [ ] **The Glitcher:** Teleports randomly around the screen. Hard to hit.
- [ ] **The Virus:** When destroyed, spawns 3 smaller, faster "bits" (Munchers).
- [ ] **The Boss:** A large, multi-stage entity (Reserved for later).

## 🔵 SYSTEM & TECH
- [ ] **Save State:** Track high score and total deaths in `localStorage`.
- [ ] **Content Injection:** Fill JSON files with final text/links/images.
- [ ] **Mobile Controls:** Add touch controls or ensure playable on mobile.

## 🐛 KNOWN BUGS
- [ ] **White Flash on Refresh (FOUC):** The 3D Canvas areas flash white briefly on page reload.








## THOUGHTS

- should enemies come in waves indicated in MESOELFY_OS Header?
- instead of just panel munchers (rename from seeker), what if there is also a muncher enemy that targets the elements within a panel such as each of the three video slots or each social media button, or the CONTACT and ABOUT ME buttons? What about an enemy type that enters a modal and does damage inside? Can that be coded for them to be moving around doing stuff even though we haven't instantiated the modal yet? How do we deal with the enemies on the MESOELFY_OS screen if we are inside a modal fighting some enemies? Wouldn't that have weird game logic? I need to brainstorm this with AI.
- need health for player and lives and powerups. (increase bullet size / rate of fire)
- need help seeing not obvious stuff that is missing.
- hunter enemy needs to shoot projectiles.
- Kamekazi should be bigger and slow. If it blows up on player and is inside a panel, it does damage to that panel.

- What things does Vampire Survivors do that I should implement? Game design and juice.
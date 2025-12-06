# MESOELFY_OS // REFACTOR ROADMAP

## 🟢 COMPLETED 
- Basic Scene Setup (R3F)
- UI Overlay (Glass Panels)
- Intro Sequence (Matrix Boot)
- Basic Gameplay Loop (Munchers)

## 🐛 KNOWN BUGS
- [ ] **White Flash on Refresh (FOUC):** The 3D Canvas areas flash white briefly on page reload.
- [ ] **Mobile Controls:** Unplayable on mobile (Need Virtual Joystick).

---

## 🏗 PHASE 1: THE FOUNDATION (Architecture & Events)
*Goal: Decouple the monolithic `GameEngine` and establish strict communication channels.*
- [ ] **Strict Event Typing:** Enum-based GameEvents and typed Payloads.
- [ ] **Event Bus 2.0:** Typed EventBus with Debug History Logging.
- [ ] **Service Locator Pattern:** Singleton to manage global services (Audio, Input, FX).
- [ ] **System Interface:** `IGameSystem` enforcing `setup`, `update`, `teardown`.
- [ ] **Engine Coordinator:** Refactor `GameEngine` to iterate systems rather than raw logic.
- [ ] **World Config:** Global constants (Gravity, Bounds) injected into systems.
- [ ] **Time System:** Handle delta time and time scaling (Pause/Slow-mo) centrally.
- [ ] **Service Interfaces:** Abstract Audio and Input behind `IAudioService` and `IInputProvider`.
- [ ] **Game Bootstrapper:** Class to initialize the Locator and start the loop.

## 🧩 PHASE 2: ENTITIES & LOGIC (Composition)
*Goal: Move from hardcoded x/y objects to flexible Entities with reusable logic.*
- [ ] **Entity ID & Tags:** Nominal typing for IDs and Set-based tagging.
- [ ] **Base Entity & Components:** Generic container for `Transform`, `Physics`, `Health` components.
- [ ] **Entity Registry:** Map-based storage for O(1) access.
- [ ] **Spatial Partitioning:** Grid-based collision lookups (removing O(N^2) loops).
- [ ] **Damage Command Pattern:** Queue damage to prevent mid-loop array mutation.
- [ ] **Loot System:** Components for dropping Score/XP/Powerups.
- [ ] **State Machine Core:** Generic FSM for managing Entity behavior.

## 🧠 PHASE 3: GAMEPLAY DEPTH (FSM & Data)
*Goal: Implement the "Fun" using the new architecture.*
- [ ] **Data-Driven Configs:** Extract magic numbers to JSON (Player, Enemy, Waves).
- [ ] **Behavior Registry:** Map strings to specific AI State Machines.
- [ ] **Enemy Logic:** Implement FSMs for Muncher (Eat), Hunter (Orbit/Charge), Kamikaze.
- [ ] **Player FSM:** Idle, Move, Rebooting states.
- [ ] **Wave Parser:** Read JSON wave definitions.
- [ ] **Progression:** XP Curves, Levels, and Upgrade Modifiers.
- [ ] **Global Game State:** Menu -> Playing -> Paused -> GameOver FSM.
- [ ] **Persistence:** LocalStorage adapter for High Scores.

## 🎨 PHASE 4: VISUALS & OPTIMIZATION (R3F & Juice)
*Goal: High performance and "Neon" aesthetics.*
- [ ] **Object Pooling:** Recycle meshes/particles to reduce GC spikes.
- [ ] **Render Interpolation:** Smooth visuals on high-refresh screens.
- [ ] **Visual Component:** Sync Logic Entities to R3F Instances.
- [ ] **Shader Manager:** Centralized uniforms (Global Trauma, Time).
- [ ] **Camera System:** Perlin-noise based screen shake and zoom control.
- [ ] **Trail Renderer:** Single-mesh trails for projectiles.
- [ ] **Audio Bus System:** Mixer for Music/SFX/UI volume control.

## 🖥 PHASE 5: UI & REACT INTEGRATION
*Goal: Seamless communication between the App and the Game.*
- [ ] **Bridge Store:** Split `useGameStore` into UI (Zustand) and Game (Ref-based).
- [ ] **Transient Updates:** Direct DOM manipulation for HUD bars (Perf gain).
- [ ] **Viewport System:** Robust Screen-to-World mapping for resizing/mobile.
- [ ] **Mobile Controls:** Virtual Joystick overlay.
- [ ] **Asset Loader:** Preloading screens.
- [ ] **Debug Overlay:** FPS, Entity Count, Pool Usage stats.






## MISC THOUGHTS

- should enemies come in waves indicated in MESOELFY_OS Header?
- instead of just panel munchers (rename from seeker), what if there is also a muncher enemy that targets the elements within a panel such as each of the three video slots or each social media button, or the CONTACT and ABOUT ME buttons? What about an enemy type that enters a modal and does damage inside? Can that be coded for them to be moving around doing stuff even though we haven't instantiated the modal yet? How do we deal with the enemies on the MESOELFY_OS screen if we are inside a modal fighting some enemies? Wouldn't that have weird game logic? I need to brainstorm this with AI.
- need health for player and lives and powerups. (increase bullet size / rate of fire)
- need help seeing not obvious stuff that is missing.
- hunter enemy needs to shoot projectiles.
- Kamekazi should be bigger and slow. If it blows up on player and is inside a panel, it does damage to that panel.

- What things does Vampire Survivors do that I should implement? Game design and juice.

- Should I have a high score patron screen where people can enter their name with links to whatever they want?

- Full functionality in the site isn't active immediately. the video slots and social media links could be broken until the first wave of munchers that are already there are dealt with. Maybe a power up that clears and heals the board is dropped?

bullet width upgrade lmited

- OPNE_SOURCE video overlay shouldn't be red, since that is for dangerous bad stuff - update design language -

we can skin the munchers/enemies differently as they get stronger with cool indicators including skins and animations of their pattern, and even glow or particles floating around them.

- We need a dramatic visual animation / indication signifying that a panel has reached 0% health like the system restored animation

- When opening modal, our game mouse cursor needs to be visible

- purple regen bar needs to slowly decay when user is not charging it

sharing https://mesoelfy.github.io/ needs to make an awesome twitter link capsule image.

- each upgrade needs its own bespoke icon that looks like what it does

- there could be "burrow" waves where they burrow into modal - - - and there can be a wave indicator in the header so you can keep track of when you need to go back
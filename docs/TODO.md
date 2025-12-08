# MESOELFY_OS // REFACTOR ROADMAP

## 🟢 COMPLETED 




## 🔊 AUDIO ENGINEERING
*Goal: Professional mixing and dynamic sound control.*
- [ ] **Audio Bus System:** Create `GainNodes` for Master, Music, and SFX.
- [ ] **Ducking Logic:** Lower Music volume slightly when heavy SFX (Explosions) trigger.
- [ ] **Sound Pooling:** Prevent audio glitches by recycling Audio nodes.

## 🖥 UI & REACT INTEGRATION
*Goal: Seamless communication between the App and the Game.*
- [ ] **Transient Updates:** Refactor HUD (Health/XP) to bypass React State and update DOM directly for 60fps performance.
- [ ] **Viewport System:** Robust Screen-to-World mapping for resizing/mobile.
- [ ] **Mobile Controls:** Implement Virtual Joystick overlay for touch devices.
- [ ] **Touch Input:** Map touch events to the `InputSystem`.
- [ ] **Asset Loader:** Preload sounds/textures with a progress bar.
- [ ] **Debug Overlay:** FPS, Entity Count, Pool Usage stats toggle.
- [ ] **Settings Modal:** Volume sliders (Music/SFX) and Graphics Quality toggles.

## 🏁 FINAL POLISH & SHIP
- [ ] **Code Freeze & Lint:** Cleanup imports and unused files.
- [ ] **Deployment Check:** Verify GitHub Pages behavior.
- [ ] **Readme Update:** Documentation for future contributors.


## 🐛 KNOWN BUGS
- [ ] **White Flash on Refresh (FOUC):** The 3D Canvas areas flash white briefly on page reload.
- [ ] **Mobile Controls:** Unplayable on mobile (Need Virtual Joystick).

## MISC THOUGHTS


- what if there is a muncher enemy that targets the elements within a panel such as each of the three video slots or each social media button, or the CONTACT and ABOUT ME buttons? What about an enemy type that enters a modal and does damage inside? Can that be coded for them to be moving around doing stuff even though we haven't instantiated the modal yet? How do we deal with the enemies on the MESOELFY_OS screen if we are inside a modal fighting some enemies? Wouldn't that have weird game logic? I need to brainstorm this with AI.
- need health for player and lives and powerups. (increase bullet size / rate of fire)
- need help seeing not obvious stuff that is missing.

- Kamekazi should be bigger and slow. If it blows up on player and is inside a panel, it does damage to that panel.

- What things does Vampire Survivors do that I should implement? Game design and juice.

- Should I have a high score patron screen where people can enter their name with links to whatever they want? - YES

- Full functionality in the site isn't active immediately. the video slots and social media links could be broken until the first wave of munchers that are already there are dealt with. Maybe a power up that clears and heals the board is dropped?

bullet width upgrade lmited



we can skin the munchers/enemies differently as they get stronger with cool indicators including skins and animations of their pattern, and even glow or particles floating around them.

- We need a dramatic visual animation / indication signifying that a panel has reached 0% health like the system restored animation





sharing https://mesoelfy.github.io/ needs to make an awesome twitter link capsule image.

- each upgrade needs its own bespoke icon that looks like what it does

- there could be "burrow" waves where they burrow into modal - - - and there can be a wave indicator in the header so you can keep track of when you need to go back

- hunter spinning animation needs fine tuning - - - hunter bullet needs to start at size 0 and then grow to full size before being launched at player - - - hunter movement logic needs updating, it feels kind of floaty and not menacing. I want it to feel intimidating.

- Game Over left most broken frame looks weird as broken - should retain full shape

- Power UP - Heal panel faster

- should the screen shake just affect the game world mesoelfy_OS and panels and not the player and enemies?



What are screenshake best practices?

- the system breach scrolling text needs to be indepentent for each panel, not a master animation that overlaps for multiple panels.

- 


When player regenerates itself, the health bar shows 50% but I think it might actually be a different number of health that it actually has? Also, even if the identity panel is destoryed or everything is game over state, the player should still be able to lose its health and become the small triangle state.

Music should get distorted, glitchy, and reverbed when Game Over state



“	•	The Skull Glitch:
	◦	We will overlay a 2D, glitchy "Skull" graphic over the 3D canvas.
	◦	This skull stays at opacity: 0 normally.
	◦	As health drops, it randomly flickers to opacity: 1 for a single frame (subliminal glitch).
	◦	At 0% Health, the Crystal vanishes entirely, and the Skull locks in permanently (Red).
“





screen shake - an individual panel should shake when brought to 0% health



For zen mode, can we cycle through cool prismatic color patterns for elements in the header/footer/and the motion grid lines? Making it very cool and psychedelic and chill. We can make flavor text in the header and footer say something cheeky and diegetic too. Something about safe/chill/vibe mode.

Maybe we can have the motion grid affected by the music like a music player visualizer, affected by the song that is playing?

Your cursor could leave a psychedelic trail of colors behind it


1	"Reboot Tick" (Purple State): A gritty, low-pitched electric "zap" (Sawtooth wave) that played while you were actively regenerating a dead panel. designed to sound like forcing power into a broken system, distinct from the clean "healing" chime.

2	"System Restored" (Happy Sound): A "power-on" sweep (Sine wave rising in pitch + high-frequency sparkle) that plays the moment a panel reached 100% and came back online.

3	"Upgrade Selected": A satisfying ascending major arpeggio (3-note chime) when clicking a button in the level-up menu.

4     I’d like a quick simple chime blip to indicate panel healed 100%.




DEBUG mode will have asterisk slots for entering konami code to access it. If they have entered the code at least one time, their browswer will remember and not ask for it again (saves it).



Somtimes driller enemy does not render correctly on the screen. you can see the tip where it is drilling but not rest of body. other enemies render fine.

Indicate to player to press ESC or ~ in zen mode



Make IDENTITY_CORE a little shorter or a panel, and SOCIAL_UPLINK a little taller of a panel












This is a comprehensive architectural audit of the **MESOELFY_OS** codebase. Based on the provided files, I have identified 100 specific refactoring tasks, improvements, and architectural shifts to align the project with SOLID principles, clean code practices, and high-performance standards.

### 🏗️ **Architecture & ECS (Entity Component System)**

1.  **Decouple Engine from React State:** The `GameEngine` reads directly from `useGameStore`. Invert this dependency; the Engine should emit events that the Store subscribes to.
2.  **Interface Segregation for Systems:** `IGameSystem` forces `setup` and `teardown`. Split into `ILifecycleSystem` and `IUpdateSystem` so passive systems don’t implement empty methods.
3.  **Remove Singleton Registry:** `EntityRegistry` is a global singleton. Inject it via the `ServiceLocator` to allow for multiple game worlds or easier testing.
4.  **Strict Component Typing:** Move from string-based component retrieval (`getComponent('Health')`) to Class/Type-based keys to ensure type safety without casting.
5.  **Component Bitmasks:** Implement bitmasks for Component types to speed up Entity filtering (checking `hasComponent` 60 times/sec per entity is slow with Maps).
6.  **System-Specific Queries:** Instead of `Registry.getAll()`, Systems should maintain their own cached lists of relevant entities (e.g., `MovementSystem` keeps a list of entities with `Transform` + `Motion`).
7.  **Spatial Grid Dynamic Resizing:** The `SpatialGrid` cell size is hardcoded (4). Move this to `WorldConfig` and allow it to be tuned based on entity density.
8.  **Tag System Refactor:** `Tag` is an enum. Change to a `BitSet` for faster comparison (e.g., `if (mask & TAG_ENEMY)`).
9.  **Factory Pattern Abstraction:** `EntityFactory` is hardcoded. Create a data-driven `EntityBlueprint` system where entities are defined by JSON config, not hardcoded functions.
10. **Object Pool Generic Constraints:** Tighter constraints on `ObjectPool<T>`. Ensure `T` implements a `Poolable` interface with a `reset()` method.
11. **Collision Logic Extraction:** `CollisionSystem` handles detection *and* resolution. Move resolution (damage, particles) to a `ContactResolutionSystem` (SRP).
12. **Remove Magic Strings in Components:** `readonly _type = 'Health'` is fragile. Use `static readonly TYPE_ID = Symbol('Health')` or a const Enum.
13. **Centralized Time Management:** `TimeSystem` handles delta time, but `GameEngine` passes `time` raw. Normalize time units (seconds vs ms) globally.
14. **Physics Separation:** `MotionComponent` handles velocity and friction. Extract Physics calculation into a dedicated `PhysicsSystem` separate from `EntitySystem`.
15. **Event Bus Typing:** `GameEventBus` uses `any` in some internal logic. Enforce strict payload typing in the internal storage.
16. **Service Locator Safety:** `getSystem` throws errors at runtime. Add `hasSystem` or return `Option/Maybe` types.
17. **Input Service Abstraction:** `InputSystem` relies on `document` events implicitly. Create an adapter pattern to support Keyboard, Mouse, and potential Touch/Gamepad seamlessly.
18. **Behavior Tree/GOAP:** `EnemyBehaviors.ts` uses switch statements/if-else chains. Implement a simple Finite State Machine (FSM) or Behavior Tree for AI.
19. **Command Pattern for Actions:** Wrap player actions (Fire, Move) in Command objects to allow for replay systems or undo functionality later.
20. **Isolate Random Number Generation:** Create a `RandomService` (seeded) instead of `Math.random()` to allow for deterministic gameplay (crucial for "Replay" features).

### ⚛️ **React & UI Layer**

21. **ActiveEngine Global Leak:** `GameDirector.tsx` exports `let ActiveEngine`. This is a side-effect. Use a React Context to provide the Engine instance.
22. **Component Atomization:** `GlassPanel.tsx` is too large (300+ lines). Extract `RebootOverlay`, `IntelligentHeader`, and `BreachOverlay` into separate files.
23. **Strict Prop Interfaces:** Replace inline prop types (e.g., `{ slotIndex: number ... }`) with named interfaces exported from a types file.
24. **Hook Extraction:** Move `useEffect` logic in `HoloCommLog` and `LiveArtGrid` into custom hooks (e.g., `useVideoCycler`, `useArtGrid`).
25. **Remove Style Tags:** `CustomCursor.tsx` injects a `<style>` tag. Move global cursor hiding to `globals.css` or a utility class.
26. **Memoize Context Providers:** If adding Context for the Engine, ensure values are memoized to prevent re-renders.
27. **Zustand Selectors:** In components, select atomic state (e.g., `state => state.health`) rather than the whole slice to prevent unnecessary re-renders.
28. **Generic Modal Component:** `ModalContainer` has hardcoded types (`'about'`, `'feed'`). Make it generic or use a Registry pattern for Modals.
29. **Animation Constant Extraction:** Framer Motion variants are scattered. Centralize them in `ui/animations.ts`.
30. **Avoid Prop Drilling:** `Header.tsx` drills props down to sub-components. Use composition or Context.
31. **Virtualization:** `FeedModal` renders a list. If the feed grows, use `react-window` or `virtuoso` for performance.
32. **Form Handling:** `ContactModal` uses a native `<form>`. Use `react-hook-form` for better validation and state management.
33. **Safe HTML:** If rendering markdown/HTML in Feed, ensure sanitization (DOMPurify) is used, even if trusted source.
34. **Accessibility (a11y):** Buttons lack `aria-label`s (especially icon-only buttons). Add semantic HTML and ARIA attributes.
35. **React.memo usage:** Wrap high-frequency UI updates (like `IdentityHUD` which updates on health change) in `React.memo`.

### 💾 **State Management (Zustand)**

36. **Slice Pattern:** `useGameStore` is becoming a "God Store". Split into `PlayerSlice`, `WorldSlice`, `UISlice`.
37. **Action Separation:** Separate Actions from State definitions to keep the store interface clean.
38. **Middleware Safety:** Ensure `persist` middleware only persists non-volatile state (Options, High Score), never Session State (Current Health).
39. **Immer Integration:** Use `immer` middleware for cleaner immutable state updates (avoiding `...state, nested: { ... }`).
40. **Selector Pattern:** Create a `store.selectors.ts` file to centralize complex state derivations.

### 🎨 **Graphics (Three.js / R3F)**

41. **Shader Externalization:** Move GLSL strings (in `EnemyRenderer.tsx`, `FireTransition.tsx`) to `.glsl` files or a `shaders/` directory.
42. **Material Sharing:** `EnemyRenderer` creates a new `ShaderMaterial` inside `useMemo`. Ensure these are disposed of correctly or shared globally.
43. **Geometry Disposal:** Manually created Geometries (e.g., in `TextureGen.ts`) need manual disposal or valid React lifecycle management to prevent VRAM leaks.
44. **Texture Atlas:** `TextureGen.ts` creates multiple canvases. Combine them into a single Texture Atlas to reduce draw calls.
45. **Instancing Abstraction:** Create a generic `<InstancedEntityRenderer />` component to reduce code duplication between `BulletRenderer`, `EnemyRenderer`, etc.
46. **Throttling Updates:** The `UISyncSystem` runs every 0.1s. Ensure this loop is strictly managed and doesn't drift.
47. **Post-Processing Optimization:** `EffectsLayer` uses `Bloom` and `Vignette`. Ensure `powerPreference="high-performance"` is set on `<Canvas>`.
48. **Orthographic Camera Config:** Hardcoded zoom/position in `GameOverlay`. Move to `CameraConfig`.
49. **Resize Observer Optimization:** `GameDirector` creates an interval to refresh panels. Use a `ResizeObserver` on the `main` container instead of polling.
50. **Pointer Events:** Set `pointerEvents="none"` on the Canvas and only enable on interactive 3D elements to allow HTML UI interactions without z-index fighting.

### 🧹 **Code Quality & Maintenance**

51. **Barrel Files:** Create `index.ts` files for folders (`components`, `systems`, `utils`) to clean up imports.
52. **Path Aliases:** Use strict path aliases. Avoid `../../`.
53. **Remove Console Logs:** Remove `console.log` in `ObjectPool` expansion. Use a `Logger` service that can be silenced in Prod.
54. **Magic Numbers extraction:** `1000` (Max Health), `0.15` (Fire Rate). Move ALL to `BalanceConfig.ts`.
55. **Strict Null Checks:** Ensure `tsconfig.json` has `strict: true` (it does, but ensure code adheres to it—lots of `!` non-null assertions).
56. **Explicit Return Types:** Add return types to all functions, especially Systems and Hooks.
57. **Dead Code Removal:** Delete `_MISC_IGNORE` folder from the repo or `.gitignore` it properly.
58. **Comment cleanup:** Remove "NEW" or "FIX" comments; git history is for that. Use proper JSDoc for complex logic.
59. **Naming Conventions:** Standardize: Components (`PascalCase`), Functions (`camelCase`), Constants (`UPPER_SNAKE_CASE`).
60. **Prettier/ESLint:** Ensure a strict `.prettierrc` and `.eslintrc` configuration is enforced on commit (husky).

### 🛡️ **SOLID Specifics**

61. **SRP (Single Responsibility):** `PanelRegistrySystem` handles Rect calculations *and* Game Logic (Integrity). Split `PanelSpatialSystem` and `PanelHealthSystem`.
62. **OCP (Open/Closed):** Adding a new Enemy type requires editing `EntityFactory`, `EnemyRenderer`, `Identifiers`. Implement a Registry where enemies register *themselves*.
63. **LSP (Liskov Substitution):** Ensure all `IGameSystem` implementations behave consistently. `BreachSystem` is a class but doesn't implement `IGameSystem`. Fix interface compliance.
64. **ISP (Interface Segregation):** Split `IServiceLocator` into `ISystemProvider`, `IAudioProvider`, `IInputProvider`.
65. **DIP (Dependency Inversion):** High-level game logic depends on `EntitySystem` (concrete). It should depend on `IEntitySpawner` interface.

### 🚀 **Performance & Optimization**

66. **Garbage Collection:** Pre-allocate `THREE.Vector3`, `THREE.Euler` in Systems to avoid creating new objects every frame (e.g., in `PlayerSystem`).
67. **Math.pow:** Replace `Math.pow(x, 2)` with `x * x` in tight loops (Collision detection).
68. **Spatial Grid Optimization:** Use a 1D array instead of a Map for the Spatial Grid buckets if the world size is fixed.
69. **Audio Pooling:** `AudioSystem` creates new Oscillators every shot. Implement an `AudioNodePool` for high-frequency SFX.
70. **Debounce Inputs:** Debounce resize events in `ViewportHelper`.
71. **CSS Hardware Acceleration:** Add `transform: translateZ(0)` to heavy UI elements (GlassPanels) to promote to compositor layers.
72. **Reduce DOM Nodes:** `PanelSparks` creates a Canvas per panel? Consider a single full-screen overlay for sparks mapped to panel coordinates.
73. **Image Optimization:** Use `next/image` for the Gallery thumbnails instead of `<img>` or background images.
74. **Lazy Loading:** Lazy load the `GalleryModal` and `FeedModal` contents.
75. **Bundle Analyzer:** Run `next-bundle-analyzer` to ensure Three.js isn't being bundled twice (e.g., three-stdlib vs three).

### 🔧 **Testing**

76. **Unit Tests (Core):** Test `MathUtils`, `SpatialGrid`, and `ObjectPool` with Jest/Vitest.
77. **Unit Tests (Systems):** Mock `ServiceLocator` and test `HealthSystem` logic in isolation.
78. **Integration Tests:** Test the `GameBootstrapper` ensures all systems are registered.
79. **E2E Tests:** Use Playwright to verify the Game Over loop and Modal opening/closing.
80. **Snapshot Testing:** Snapshot the `GlassPanel` rendered output to catch UI regressions.

### 💄 **Styling & Theme**

81. **Tailwind Config:** Move all hex codes from `theme.ts` into `tailwind.config.ts`.
82. **CSS Variables:** Use CSS variables for theme colors so they can be changed at runtime (e.g., Zen Mode changing the palette).
83. **Z-Index Registry:** Create a `zIndex` object/enum in TypeScript. Avoid `z-[100]`, `z-[9999]`.
84. **Responsiveness:** Check `text-[10px]` on high-DPI mobile screens. Might be unreadable. Use `rem`.
85. **Font Loading:** Ensure fonts in `layout.tsx` are using `display: swap` to prevent FOIT.

### 🔊 **Audio**

86. **Web Audio Unlock:** Ensure Audio Context unlock logic handles Touch events for iOS Safari.
87. **Volume Persistence:** Save Volume settings to LocalStorage.
88. **Audio Sprite:** If using MP3s, combine into an Audio Sprite to reduce HTTP requests.
89. **Generative Audio Parametrization:** Move Oscillator frequencies and ramp times to a config file for easier sound design tuning.
90. **Duck Audio:** Implement side-chain compression logic in `AudioSystem` (Music ducks when SFX fires).

### 📦 **Build & Deployment**

91. **CI/CD:** Add a GitHub Action to lint and build on PR.
92. **Environment Variables:** Validate `NEXT_PUBLIC_COMMIT_HASH` existence. Provide fallback.
93. **Asset Hash:** Ensure assets in `public/` get cache-busting headers or hashes.
94. **Git Ignore:** Ensure `.DS_Store` and local debug logs are ignored.

### 🧠 **Code Aesthetics / "Nice to Haves"**

95. **JSDoc:** Add documentation to the `IGameSystem` interface methods.
96. **Error Boundaries:** Wrap the Game View in a React Error Boundary to catch R3F crashes and show a "System Failure" UI.
97. **Loading State:** Implementing a proper `useProgress` loader for the initial 3D scene mount.
98. **Keyboard Access:** Ensure game controls (WASD) don't conflict with UI navigation (Tab/Enter).
99. **Touch Controls:** Add a virtual joystick overlay for Mobile players (currently missing).
100. **Debug Strip:** In production builds, strip the `DebugOverlay` code entirely via Tree Shaking (conditional imports).







Here is the breakdown of the specific areas you asked about, followed by the **Phase-Based Action Plan** to execute the 100-point audit.

### 1. 📂 Are any other files too large?

Yes. While `GlassPanel.tsx` is the worst offender regarding UI, there are significant logic clusters that violate **Single Responsibility Principle (SRP)**:

*   **`src/features/debug/DebugOverlay.tsx` (~350 lines):**
    *   **Why:** It contains the UI for four different tabs, keyboard event listeners, log polling logic, and state management for cheats.
    *   **Fix:** Split into sub-components: `<DebugTabs />`, `<ConsoleTab />`, `<StatsTab />`, `<OverridesTab />`.
*   **`src/game/components/EnemyRenderer.tsx` (~150 lines + Shaders):**
    *   **Why:** It handles the geometry generation, shader definitions, and frame-loop updates for **three** different enemy types (Driller, Kamikaze, Hunter).
    *   **Fix:** Create a generic `<InstancedEntityRenderer />` component that accepts geometry/material as props, or split into `<DrillerRenderer>`, `<KamikazeRenderer>`, etc.
*   **`src/features/intro/MatrixBootSequence.tsx` (~300 lines):**
    *   **Why:** It mixes Canvas rendering (The Matrix rain), React State logic (The boot steps), and ASCII rendering.
    *   **Fix:** Extract the Canvas Matrix effect into `src/ui/effects/MatrixCanvas.tsx`.
*   **`src/game/systems/EntitySystem.ts` (~130 lines):**
    *   **Why:** It manages the Spatial Grid, Entity Lifecycle (death/culling), Movement integration, *and* specific Spawning logic.
    *   **Fix:** Move Spawning logic to a `SpawnerSystem`. Move Spatial Grid logic to the Engine or a dedicated `PhysicsSystem`.

### 2. 👑 Are there other "God Objects"?

Yes. A "God Object" knows too much or does too much.

*   **`useGameStore.ts` (The State God):**
    *   It manages: UI State (isZenMode), Game Logic (Scoring, XP), Entity Data (Panels), and even DOM references (RegisterPanel).
    *   **Risk:** Every time a score updates, components listening for "Panels" might re-render if selectors aren't perfect.
*   **`EntityRegistry.ts` (The Data God):**
    *   It is a global Singleton that holds every entity, tag, and the object pool.
    *   **Risk:** It makes unit testing impossible because state persists between tests unless manually cleared perfectly.
*   **`EntitySystem.ts` (The Logic God):**
    *   It acts as the central hub for updating *everything* that isn't the player. It iterates all entities, checks their tags, applies movement, checks lifetime, and runs AI behaviors.
*   **`AudioSystem.ts`:**
    *   It manages context creation, bus routing, music playback, and SFX generation all in one class.

### 3. 💀 Legacy Code & Cleanup

I have identified the following files/code blocks that are dead, orphaned, or cluttered.

#### **A. Files to Delete**
*   **`src/game/components/GlowRenderer.tsx`**: You explicitly commented `// Component Deprecated`. Delete it.
*   **`src/game/systems/BreachSystem.ts`**:
    *   **Why:** This class exists but is **never registered** in `GameBootstrapper.ts`. It is dead logic. The functionality (spawning enemies when panels die) should be moved to `WaveSystem` or a new `EventSystem`.
*   **`src/_MISC_IGNORE`**: Delete this entire folder from the repo (add to `.gitignore` if you want to keep it locally).

#### **B. Manual Comment & Code Cleanup**
I have generated the diffs to clean up the "Mental Notes" (NEW, FIX, TODO) and remove unused imports.

**1. Clean `src/game/components/BulletRenderer.tsx`**
*   *Remove comment:* `// FIX: Reduced box size from (0.15, 0.4) to (0.1, 0.3)...`
*   *Action:* Just keep the code.

**2. Clean `src/game/components/EnemyRenderer.tsx`**
*   *Remove comment:* `// FIX: Thicker lines (2.0)`
*   *Remove comment:* `// FIX: Render both sides for visibility`
*   *Remove comment:* `// FIX: Z=5.0 to ensure they are well above...`

**3. Clean `src/game/systems/CollisionSystem.ts`**
*   *Remove comment:* `// FIX: Use GameStateSystem, not Store`

**4. Clean `src/ui/atoms/GlassPanel.tsx`**
*   *Remove comment:* `// FIX: Added Purple bar for active rebooting`

**5. Clean `src/game/logic/ai/EnemyBehaviors.ts`**
*   *Remove comment:* `// FIX: Force rotation to face the contact point...`

---

### 📅 PHASE-BASED ACTION PLAN

This plan prioritizes **Stability > Architecture > Performance > Polish**.

#### **PHASE 1: Housekeeping & Decoupling (The "Cleanup" Phase)**
*Goal: Remove dead weight and stop the React Store from driving the Game Loop.*

1.  **Delete Dead Files:** Remove `GlowRenderer.tsx`, `BreachSystem.ts` (or integrate it), and `_MISC_IGNORE`.
2.  **Split GlassPanel:** Extract `RebootOverlay`, `IntelligentHeader`, and `BreachOverlay` into their own files in `src/ui/molecules/panel/`.
3.  **Split DebugOverlay:** Create a `src/features/debug/tabs/` folder and move the tab logic into separate components.
4.  **Invert Engine Dependency:**
    *   Create a `GameStateSystem` in the ECS layer (You have this partially, but fully utilize it).
    *   Make `GameEngine` update `GameStateSystem`.
    *   Have `UISyncSystem` read from `GameStateSystem` and push to `useGameStore` **only once per 100ms** (Throttling).
    *   *Result:* The Game runs at 60FPS; React updates at 10FPS.
5.  **Fix GameBootstrapper:** Ensure all systems are registered via a configuration array rather than hardcoded `registerSystem` calls, making it easier to add/remove systems.

#### **PHASE 2: Core Architecture Refactor (The "SOLID" Phase)**
*Goal: Enforce strict boundaries between Data, Logic, and Presentation.*

6.  **Refactor EntityRegistry:**
    *   Remove the Singleton export `export const Registry = new ...`.
    *   Instantiate `Registry` in `GameBootstrapper`.
    *   Pass `Registry` to systems via `ServiceLocator`.
7.  **System Interfaces:**
    *   Split `IGameSystem` into `IUpdatableSystem` (Movement, Collision) and `IReactiveSystem` (Input, Audio).
8.  **Split EntitySystem:**
    *   Create `PhysicsSystem.ts`: Handles `Transform` + `Motion` updates.
    *   Create `LifeCycleSystem.ts`: Handles `Lifetime` and Health checks.
    *   Create `SpawnerSystem.ts`: Handles Wave/Debug spawning logic.
    *   *EntitySystem* should strictly be the manager of the Grid, not the logic runner.
9.  **Standardize Components:**
    *   Refactor Component "Types" from strings (`'Health'`) to Symbols or Enum `ComponentType.Health` to prevent typo bugs.
10. **Refactor useGameStore:**
    *   Split into `usePlayerStore` (Health, XP, Upgrades) and `useWorldStore` (Panels, Game State).

#### **PHASE 3: Rendering & Performance (The "Speed" Phase)**
*Goal: Optimize for 60FPS on lower-end devices.*

11. **Generic Instancing:**
    *   Create `InstancedActor.tsx`. Pass it a `tag` (e.g., 'ENEMY') and a `material`.
    *   It handles the `useFrame` loop to sync R3F meshes with the ECS Registry.
12. **Texture Atlas:**
    *   Combine `TextureGen.ts` separate canvases into one large Texture Atlas.
    *   Update Shaders to use UV mapping to look at specific parts of the atlas.
13. **Audio Pooling:**
    *   In `AudioSystem`, implement a pool of `OscillatorNodes` and `GainNodes`. Creating/Destroying audio nodes every shot (10x/sec) triggers Garbage Collection.
14. **Spatial Grid Optimization:**
    *   Move `SpatialGrid` cell size to `WorldConfig`.
    *   Implement a visual debug mode for the Grid in `DebugOverlay` to tune cell sizes.

#### **PHASE 4: Gameplay Polish (The "Fun" Phase)**
*Goal: Make the game feel responsive and juicy.*

15. **Input System Overhaul:**
    *   Add `KeyboardListener` and `TouchListener` classes.
    *   Implement "Coyote Time" (allow input slightly after death/cooldown) for better feel.
    *   Add Virtual Joystick for mobile.
16. **Audio Mixing:**
    *   Implement "Ducking" (Side-chain compression). When `Explosion` sound plays, lower `Music` volume by 30%.
17. **Breach Logic:**
    *   Re-implement the logic from the deleted `BreachSystem` into `WaveSystem`.
    *   Logic: If a panel is Dead, spawn enemies *from* that panel's coordinates.

#### **PHASE 5: DevOps & Maintenance (The "Professional" Phase)**
*Goal: Ensure the project remains maintainable.*

18. **Barrel Files:** Create `index.ts` for `src/game/components`, `src/game/systems`, etc., to simplify imports.
19. **Strict Types:** Run `tsc --noEmit` and fix all `any` types (specifically in EventBus and ServiceLocator).
20. **Linting:** Standardize Imports order (React -> 3rd Party -> Local).

### Immediate Next Step
I recommend starting with **Phase 1 (Step 1 & 2)**: Deleting the dead code and splitting `GlassPanel.tsx`. This immediately reduces cognitive load before tackling the complex architectural changes.
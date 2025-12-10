# MESOELFY_OS // REFACTOR ROADMAP




- [ ] **Deployment Check:** Verify GitHub Pages behavior.



## 🐛 KNOWN BUGS
- [ ] **White Flash on Refresh (FOUC):** The 3D Canvas areas flash white briefly on page reload.
- [ ] **Mobile Controls:** fine tune on mobile 

## MISC THOUGHTS


- what if there is a muncher enemy that targets the elements within a panel such as each of the three video slots or each social media button, or the CONTACT and ABOUT ME buttons? What about an enemy type that enters a modal and does damage inside? Can that be coded for them to be moving around doing stuff even though we haven't instantiated the modal yet? How do we deal with the enemies on the MESOELFY_OS screen if we are inside a modal fighting some enemies? Wouldn't that have weird game logic? I need to brainstorm this with AI.
- need health for player and lives and powerups. (increase bullet size / rate of fire)
- need help seeing not obvious stuff that is missing.

- Kamekazi should be bigger and slow. If it blows up on player and is inside a panel, it does damage to that panel.

- What things does Vampire Survivors do that I should implement? Game design and juice.

- Should I have a high score patron screen where people can enter their name with links to whatever they want? - YES



- we can skin the munchers/enemies differently as they get stronger with cool indicators including skins and animations of their pattern, and even glow or particles floating around them.

- We need a dramatic visual animation / indication signifying that a panel has reached 0% health like the system restored animation


sharing https://mesoelfy.github.io/ needs to make an awesome twitter link capsule image.

Lucide icons: gitlab(a fox head) and shovel and puzzle and pickaxe and bow-arrow and biohazard and battery-charging and battery-plus and circle-dot-dashed and gem and loader-pinwheel and locate-fixed and swords and sparkles and snail and snowflake and ship-wheel look good. the cannabis one looks like an explosion. maybe the different chess pieces could be used for something. fan looks like a razer blade.




- Power UP - Heal panel faster (cursor should show a visual upgrade - - - there should be additional upgrades to the visuals of the cursor to indicate upgrades - - - ask AI how it is currently being put together) - dead cursor needs updating too.


- Damage from drillers should be at a constant rate.

- Bullet trails need to match the new sizes of bullets after upgrading them. Let's overhaul how trails are rendered.

- the system breach scrolling text needs to be indepentent for each panel, not a master animation that overlaps for multiple panels.

- even if the identity panel is destoryed or everything is game over state, the player should still be able to lose its health and become the small triangle state.

- Music should get distorted, glitchy, and reverbed when Game Over state for a moment before returning to normal



“	•	The Skull Glitch:
	◦	We will overlay a 2D, glitchy "Skull" graphic over the 3D canvas.
	◦	This skull stays at opacity: 0 normally.
	◦	As health drops, it randomly flickers to opacity: 1 for a single frame (subliminal glitch).
	◦	At 0% Health, the Crystal vanishes entirely, and the Skull locks in permanently (Red).
“

- Should a panel jitter when driller damages it and jitter more when more drillers are drilling?

For zen mode, can we cycle through cool prismatic color patterns for elements in the header/footer/and the motion grid lines? Making it very cool and psychedelic and chill. We can make flavor text in the header and footer say something cheeky and diegetic too. Something about safe/chill/vibe mode.

Maybe we can have the motion grid affected by the music like a music player visualizer, affected by the song that is playing?

Your cursor could leave a psychedelic trail of colors behind it

- a quick simple chime blip to indicate panel healed 100%.


- DEBUG mode will have asterisk slots for entering konami code to access it. If they have entered the code at least one time, their browswer will remember and not ask for it again (saves it).


- Indicate to player to press ESC or ~ in zen mode



- there could be "burrow" waves where they burrow into modal - - - and there can be a wave indicator in the header so you can keep track of when you need to go back

- hunter spinning animation needs fine tuning - - - hunter bullet needs to start at size 0 and then grow to full size before being launched at player - - - hunter movement logic needs updating, it feels kind of floaty and not menacing. I want it to feel intimidating.

- Hunter weapon needs to start small and get bigger before launching

- kamikaze should hurt player. if kamikaze explodes in panel, it does same amount of damage to panel as it does to player.

- player colliding with any enemy should hurt player and make that enemy explode (by doing damage to them)



- Audio ducking / side-chaining needs to be fine tuned and architecture assessed.


- mobile - chrome devtools - device toolbar - confirm compatibility with different devices - right now the touch joystick isn't working because touching anywhere on skin moves character. also, everything isn't being resized properly for mobile and needs an overhaul.

- Sometime green system restored animation appears in a panel during game over state.

- enemy kill count is going up even when not killing them

- Resetting via debug menu then starting another game, player wasn't shooting correctly and at the GAME OVER state the second time the bomb reset didn't appear.




- Make the red crystal pulse with the heartbeat too

- have the panels behave more like the glitched local one where you can see the lines - CSS layer thing? - - - have panels glow opposite direction/timing as the heart beat?


- The LV_XX text isn't rendering properly in Firefox. (try other browswers)

- Increase the reboot heal rate by 50%.

- Stereo panning, so sounds on the left side of the screen have most of their volume in the left side, and SFX from entities happening on the right side of the screen have most of their volume on the right side, and to have the percentage degree of how much this happens depend on their position.


- Can we detect if a user is having a poor FPS experience, pause everything, then offer to switch to potato-quality graphics turning things like particles and animations off so they can navigate the site?


- For portfolio and social media items and youtube videos, instead of for example using all the iframe information copy pasted a bunch of times, can we use something like JSON to just keep all the code that is the same each time and then swap out the ID/different values? Even though I haven't done it yet for twitter feed links and IMG_XX links, I'd like it commented in the code that I should do the same idea if possible.


 (ask AI to give a bunch of samples for sounds that are still needed)


- Need to add some kind of "begin" click prompt to enable sound in the intro. then we can add variable typing sounds, a ... sound in sync with how they appear, and sparkly shimmer sounds for the matrix rain.

  - Have Boot_Loader.sys be a pixel art folder of Elfy's face that does a cute animation after double clicking (coyote time or whatever with a larger grace window than MAC and PC open folder, but still a timing window that needs to be a double click, not clicked too far apart in time) - maybe each click moves forward an animation frame a total of three clicks without timing at all and she blows a kiss?
  
    - ambient sound begins playing with matrix rain




        - next is "feel' for sliders with snapping and SFX in increments of 5 units.




- Clean chrome console log of all the youtube errors. the youtube stuff is working just fine as intended, but something in the console doesn't know that. Can we make it stop giving us all the warnings so I can read the console stuff that actually matters?




- Look for God-Components and violations of the Single Responsibility Principle.

- Where am I wasting resources and could optimize to have a cleaner faster running build without removing functionality?

- Am I doing anything in a clunky way in the codebase?







- enemies should be spawning in the coordinates where a broken panel is with their own sophisticateds spawn rate separate from the waves

- Add a spinning gear in the top right of the intro scene. - also


Here is the phase-based action plan to execute the audit recommendations. We will move from **safe, isolated UI refactoring** to **deep engine architecture changes**.

### **Phase 1: UI Decomposition (The `IdentityHUD` Refactor)**
**Goal:** Break the "God Component" into manageable pieces and fix React performance via granular state selection.

1.  **Create Atomic Component: `VitalsRing`**
    *   Extract the SVG logic for Health and XP rings into `src/ui/atoms/VitalsRing.tsx`.
    *   Ensure it accepts simple props (`health`, `maxHealth`, `xp`, `level`) and contains **no** store subscriptions.

2.  **Create Molecular Component: `UpgradeTerminal`**
    *   Extract the list of upgrades (Kernel Modules) into `src/ui/molecules/UpgradeTerminal.tsx`.
    *   Implement granular Zustand selectors so this component *only* re-renders when `upgradePoints` or `activeUpgrades` change, ignoring health changes.

3.  **Create Molecular Component: `SystemOps`**
    *   Extract the "System Ops" buttons (Purge, Restore, Repair) into `src/ui/molecules/SystemOps.tsx`.
    *   Isolate the specific click handlers for these actions.

4.  **Create Molecular Component: `IdentityFooter`**
    *   Extract the "About" and "Contact" buttons into `src/ui/molecules/IdentityFooter.tsx`.
    *   This component should be virtually static.

5.  **Reassemble `IdentityHUD`**
    *   Rewrite `src/ui/molecules/IdentityHUD.tsx` to act as a "dumb" layout container that simply imports and positions the four components created above.
    *   Remove all heavy logic calculations from this file.

---

### **Phase 2: ECS Data Purity & Configuration**
**Goal:** strictly enforce the "Data-Only" rule for ECS Components and centralize magic numbers.

1.  **Purify Data Components**
    *   Audit `HealthComponent.ts`, `CombatComponent.ts`, and others.
    *   **Action:** Remove all methods (e.g., `.damage()`, `.heal()`, `.isDead`).
    *   Refactor these files to contain *only* public properties.

2.  **Migrate Logic to Systems**
    *   Open `CombatSystem.ts` and `InteractionSystem.ts`.
    *   **Action:** Move the logic previously found in `.damage()` directly into these systems. Instead of calling `entity.health.damage(10)`, the system will explicitly perform `health.current -= 10`.

3.  **Centralize Logic Constants**
    *   Audit `HunterLogic.ts`, `DaemonLogic.ts`, and `DrillerLogic.ts`.
    *   Identify hardcoded values (Rotation speeds, engagement distances, timers).
    *   **Action:** Move these values into `src/game/config/EnemyConfig.ts` or a new `AIConfig.ts`.
    *   Refactor the Logic files to import values from the config.

---

### **Phase 3: Interface Enforcement (Tightening the Architecture)**
**Goal:** Remove "Leaky Abstractions" by enforcing strict interface usage between systems.

1.  **Define System Interfaces**
    *   Update `src/game/core/interfaces.ts`.
    *   Create specific interfaces for systems that are dependencies of others (e.g., `IPhysicsSystem` exposing `querySpatialGrid`, `ICombatSystem` exposing `resolveCollision`).

2.  **Refactor Service Locator Usage**
    *   Update `CollisionSystem.ts` and `PlayerSystem.ts`.
    *   **Action:** Change properties from concrete classes (e.g., `private physics: PhysicsSystem`) to interfaces (`private physics: IPhysicsSystem`).
    *   Ensure `ServiceLocator` returns the interface type, preventing access to private system internals.

3.  **Decouple Systems via Events**
    *   Audit instances where Systems call methods on other Systems directly (e.g., Behavior calling Spawner).
    *   **Action:** Replace direct method calls with `GameEventBus.emit(...)`.
    *   Update `EntitySpawner` or `WaveSystem` to listen for these events and react, creating a true one-way data flow.

---

### **Phase 4: The Simulation Loop (Engine Core)**
**Goal:** Decouple Game Logic speed from Frame Rate (Rendering speed).

1.  **Implement Accumulator in `GameEngine`**
    *   Modify `src/game/core/GameEngine.ts`.
    *   **Action:** Introduce an `accumulator` variable.
    *   **Action:** Define a constant `FIXED_TIMESTEP` (e.g., 1/60th of a second).

2.  **Refactor the Update Loop**
    *   Change the `update()` loop to a `while (accumulator >= FIXED_TIMESTEP)` loop.
    *   Pass the fixed timestep to all Systems instead of the variable `delta` from requestAnimationFrame.

3.  **Interpolation (Optional but Recommended)**
    *   Pass an `alpha` (interpolation factor) to the Renderers (Components) to smooth out visual jitter between the fixed physics steps and the variable render steps.

4.  **Final Polish**
    *   Run a full regression test to ensure physics (collisions, movement speeds) feel identical at 30fps and 144fps.
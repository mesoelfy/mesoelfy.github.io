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




4     I’d like a quick simple chime blip to indicate panel healed 100%.




DEBUG mode will have asterisk slots for entering konami code to access it. If they have entered the code at least one time, their browswer will remember and not ask for it again (saves it).



Somtimes driller enemy does not render correctly on the screen. you can see the tip where it is drilling but not rest of body. other enemies render fine.

Indicate to player to press ESC or ~ in zen mode



Make IDENTITY_CORE a little shorter or a panel, and SOCIAL_UPLINK a little taller of a panel


Hunter weapon needs to start small and get bigger before launching

kamikaze should hurt player. if kamikaze explodes in panel, it does same amount of damage to panel as it does to player.
player colliding with any enemy should hurt player and make that enemy explode (by doing damage to them)


Audio ducking / side-chaining needs to be fine tuned and architecture assessed.


mobile - chrome devtools - device toolbar - confirm compatibility with different devices - right now the touch joystick isn't working because touching anywhere on skin moves character. also, everything isn't being resized properly for mobile and needs an overhaul.

Sometime green system restored animation appears in a panel during game over state.


enemy kill count is going up even when not killing them

Resetting via debug menu then starting another game, player wasn't shooting correctly and at the GAME OVER state the second time the bomb reset didn't appear.








We're using (Waveforms, Envelopes, Frequency Ramps) for our SFX. With those, what are some more really cool sounding techniques to implement that we haven't yet? And what are other things besides those three categories?

How do these ideas sound for what is missing?

1	"Reboot Tick" (Purple State): A gritty, low-pitched electric "zap" (Sawtooth wave) that played while you were actively regenerating a dead panel. designed to sound like forcing power into a broken system, distinct from the clean "healing" chime.

2	"System Restored" (Happy Sound): A "power-on" sweep (Sine wave rising in pitch + high-frequency sparkle) that plays the moment a panel reached 100% and came back online.

3	"Upgrade Selected": A satisfying ascending major arpeggio (3-note chime) when clicking a button in the level-up menu.

What are some other moments in the game so far that are missing sounds? 

I think the drilling sound needs to be overhauled.




Can we detect if a user is having a poor FPS experience, pause everything, then offer to switch to potato-quality graphics turning things like particles and animations off so they can navigate the site?




Clean chrome console log of all the youtube errors. the youtube stuff is working just fine as intended, but something in the console doesn't know that. Can we make it stop giving us all the warnings so I can read the console stuff that actually matters?



# MESOELFY_OS // REVISED ARCHITECTURE SPECIFICATION

## **1. CORE PHILOSOPHY**
*   **Separation of Concerns:** `CollisionSystem` detects hits. `CombatSystem` resolves damage. `FXManager` plays sounds. They do not overlap.
*   **Data over Code:** If a value affects gameplay (speed, damage, color), it belongs in a Config file, not a Class file.
*   **Event-Driven:** Systems communicate via `GameEventBus`. They rarely call each other directly.

---

## **2. PHASE 1: PHYSICS & COMBAT (The "Bleeding Edge")**
*Goal: Untangle the `CollisionSystem`. Currently, it handles physics, damage, particle spawning, and event emission all in one loop. This is the hardest part to maintain.*

*   **Step 1.1: Physics Configuration & Layers**
    *   Create `src/game/config/PhysicsConfig.ts`.
    *   Define **Collision Layers** (Bitmasks): `NONE`, `PLAYER`, `ENEMY`, `BULLET`, `PANEL`, `PICKUP`.
    *   Define **Hitbox Sizes** in config, removing hardcoded numbers like `0.36` or `0.49` from `CollisionSystem`.
*   **Step 1.2: The Collider Component**
    *   Create `ColliderComponent.ts`.
    *   Properties: `radius`, `layer` (what I am), `mask` (what I hit).
    *   *Refactor:* Update `EntitySpawner` to attach this component instead of relying on implicit tag checks.
*   **Step 1.3: Pure Collision System**
    *   Refactor `CollisionSystem.ts`.
    *   **Sole Responsibility:** Update the `SpatialGrid`, query it, check overlaps using `ColliderComponent` data.
    *   **Output:** It does *not* destroy entities. It creates a `CollisionEvent` or attaches a `CollisionResultComponent` to the entity for processing next frame.
*   **Step 1.4: The Combat System**
    *   Create `CombatSystem.ts`.
    *   **Responsibility:** Listens for Collision events/components.
    *   **Logic:** "Bullet hit Enemy" -> Deduct HP -> If HP <= 0, emit `ENEMY_DESTROYED`.
    *   **Logic:** "Enemy hit Panel" -> Deduct Panel HP -> Emit `PANEL_DAMAGED`.

---

## **3. PHASE 2: DATA-DRIVEN SPAWNING (Scalability)**
*Goal: Stop editing `EntitySpawner.ts` every time we add a new enemy. We want to define enemies in JSON/Objects.*

*   **Step 2.1: The Archetype System**
    *   Create `src/game/data/Archetypes.ts`.
    *   Define templates:
        ```typescript
        export const ARCHETYPES = {
          HUNTER: {
            components: [
              { type: 'Transform', args: { scale: 1.5 } },
              { type: 'Motion', args: { maxSpeed: 12 } },
              { type: 'Health', args: { max: 3 } },
              { type: 'Identity', args: { variant: 'hunter' } }
            ]
          }
        }
        ```
*   **Step 2.2: Generic Spawner**
    *   Refactor `EntitySpawner.ts`.
    *   Replace `spawnHunter()`, `spawnDriller()` with a single `spawn(archetypeId: string, x: y)`.
    *   The spawner reads the Archetype config and assembles the entity dynamically.

---

## **4. PHASE 3: BEHAVIORS & STATE (The "Brain")**
*Goal: Clean up `EnemyBehaviors.ts` and allow for complex enemy states without massive `if/else` chains.*

*   **Step 3.1: Finite State Machine (FSM) Utility**
    *   Create a lightweight FSM class in `src/game/utils/FSM.ts`.
    *   Structure: `enter()`, `update()`, `exit()`.
*   **Step 3.2: Behavior Strategies**
    *   Refactor `EnemyBehaviors.ts`. Break it into separate files:
        *   `src/game/logic/ai/DrillerLogic.ts`
        *   `src/game/logic/ai/HunterLogic.ts`
    *   Refactor `BehaviorSystem.ts` to simply delegate: `behaviors[id].update(entity, delta)`.
*   **Step 3.3: Panel Targeting**
    *   Implement logic for enemies to specifically target Panels (Social, Video, etc).
    *   Add `TargetComponent` to enemies to store *what* they are attacking (Player vs Panel ID).

---

## **5. PHASE 4: GAME FEEL & AUDIO (The "Juice")**
*Goal: Make the game sound and look professional by centralizing assets.*

*   **Step 4.1: Audio Configuration**
    *   Create `src/game/config/AudioConfig.ts`.
    *   Map logical events to sounds: `PLAYER_FIRE: { id: 'laser', vol: 0.5, pitchVar: 0.2 }`.
    *   Refactor `AudioSystem` to read from this config, removing hardcoded strings.
*   **Step 4.2: Visual Telegraphs**
    *   Create `TelegraphComponent` (duration, color, shape).
    *   Create `TelegraphSystem`.
    *   Logic: When an enemy prepares an attack, add this component. The System renders a warning indicator (line/circle) automatically.
*   **Step 4.3: Global FX Listener**
    *   Refactor `FXManager.ts`. Ensure it is the *only* place spawning particles.
    *   Systems emit events (`SPAWN_PARTICLE`); they do not call `spawner.spawnParticle` directly.

---

## **6. PHASE 5: OPTIMIZATION & CLEANUP**
*Goal: Ensure 60 FPS on lower-end devices.*

*   **Step 5.1: Strict Object Pooling**
    *   Audit `ObjectPool.ts`. Ensure `reset()` actually clears *all* dirty data from recycled entities.
    *   Implement pooling for Particles (currently they might be generating garbage).
*   **Step 5.2: Transient Updates**
    *   Review `UISyncSystem.ts`. Ensure no high-frequency data (like current HP or Score) triggers React re-renders.
    *   Ensure all HUD elements use `useTransientRef`.

---

## **DIRECTORY STRUCTURE TARGET**
*Final visual of where files will live:*

```text
src/game/
├── config/             # ALL magic numbers go here (Balance, Audio, Physics)
├── components/         # React Views (Renderers)
│   └── data/           # ECS Data Containers (Schema only, no logic)
├── core/               # Engine, Loop, Input, SpatialGrid
├── data/               # Archetypes, LootTables
├── events/             # EventBus, Enum definitions
├── logic/              # Pure math strategies (AI, Movement patterns)
├── systems/            # The worker bees (Physics, Combat, Behavior)
└── types/              # TS Interfaces
```

---

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



- player bullet sound should change as it gets more powerful
    - and different shots / daemon and stuff should be different sounds
        - hunter enemy should have bespoke shot sound too
            - all enemies should have bespoke sounds



- mini mode causes the custom cursor to persist, but it shouldn't be visible when minimized like that because we are back to the game dashboard.
  - disabling god suite toggles makes a sound, but enabling doesn't make a sound. for now use the same menu enter/leave sounds for activating toggle/deactivating toggle.

- the way 0% panels flash is different from the heartbeat extra flash - what is the logic and how can we have the other method also tied to the heart beat?


- enemies should be spawning in the coordinates where a broken panel is with their own sophisticateds spawn rate separate from the waves

- Add a spinning gear in the top right of the intro scene. - also


    JUICE
    - When an Enemy takes damage, it should flash white and scale down to 0.9 then spring back to 1.0
    - Physics-based (Springs > Lerp)

The UI Notification (The "Toast")
    When an event triggers (e.g., GameEventBus.emit('ACHIEVEMENT_UNLOCKED')), a DOM element slides down from the top of the screen.
        Visual: It looks like a sleek, dark glass card. It has a progress bar (usually filling instantly to 100%), a title, and an icon.
            Motion: It uses a spring physics animation—it doesn't just appear; it slides down with momentum, hangs there for 4 seconds, and slides back up.
                Queueing: If you unlock three things at once, they don't overlap. They queue up and show one after another.
When an Enemy takes damage, it should flash a light version of its base color and scale down to 0.9 then spring back to 1.0


Squash and Stretch (Dynamic Deformation)
"The ball elongates when moving fast. This gives the object "mass" and "elasticity."" - - - we should make this happen with hunter and demon ball attacks.

Damped Harmonic Oscillators (Spring Physics)
Course Concept: Instead of Lerp (which is linear easing), the course uses a spring formula (Force = -Spring * Displacement - Damp * Velocity). This makes the paddle "bounce" past its target and settle, or lean into movement naturally.
Current Mesoelfy Status: You use MathUtils.lerp heavily (e.g., HunterLogic.ts, DaemonRenderer.tsx). Lerp is smooth but "robotic." It lacks the "overshoot" and "settle" that makes movement feel organic.
The Gap: Movement feels mathematically perfect rather than physically reactive.

"Ghosting" / After-Images
Course Concept: When the paddle dashes, it leaves static translucent copies of itself behind that fade out.
Current Mesoelfy Status: You have ProjectileTrails, which are continuous ribbons. You do not have discrete "Ghost" instances for the player or enemies during rapid movement (dashing/teleporting).


Hit Stop (Freeze Frames)
Course Concept: When a heavy impact occurs, the entire game (or specific actors) pauses for X frames (e.g., 0.1s). This sells the impact.
Current Mesoelfy Status: You have a TimeSystem with a freeze() method called by FXManager.
The Gap: It is currently binary (Frozen or Not). The course suggests Variable Hit Stop:
Small hit = No freeze.
Medium hit = 3 frames.
Critical hit = 10 frames + Vibration.
You are currently only triggering hit stop on Player Hit or Panel Destruction, not on successful enemy kills.





Health: When taking damage, the health bar shouldn't just shrink. The lost segment should turn a lighter versio of its color with partial transparency, hang for a moment, and then go away. This should be applied to player health and the panel health for its different stages.

Damage Sound: the impact sound for each bullet/projectile that lands on a particular enemy in a short time window should inrease slightly in pitch until the "enemy dies" sound plays to increase feel. (maybe resets after 2 seconds?)

Audio Logic: When SystemIntegrity < 20% or PlayerHealth is critical, apply a BiquadFilterNode (Low Pass) to the Music track and lesser degree to the SFX track. Cut off high frequencies (muffled sound).

GAME OVER - Sound: A high-pitched "whine-down" (pitch shifting a sine wave from 1000Hz to 0Hz).


 "Harmonic Escalation."
Logic: Track a comboCount in AudioSystem.
Scale: Define a musical scale (e.g., Pentatonic Minor).
Action:
Kill 1: Play SFX at Pitch 1.0 (Root).
Kill 2: Play SFX at Pitch 1.12 (Major 2nd).
Kill 3: Play SFX at Pitch 1.25 (Major 3rd).




. Audio-Reactive FFT (Visualizer Integration)
The Concept: The environment should dance to the music. Not just a "beat" pulse, but reacting to specific frequency bands (Low/Mid/High).
Current Mesoelfy Status: You have a heartbeat system, but the MiniCrystalCanvas and MatrixGrid move on rigid sine waves or delta time.
The Gap: The world ignores the rhythm of the soundtrack.
Mesoelfy Application: "The Equalizer Grid."
Implementation: Use AudioContext.createAnalyser() to get an FFT array (frequency data).
Visual:
Bass (0-60Hz): Controls the displacementHeight of the MatrixGrid. Heavy bass = taller mountains.
Mids/Highs: Controls the emissiveIntensity of the SoulCrystal or PlayerAvatar. Snare drum = Flash of light.

I want to overhaul how projectiles look. How are we currently handling them? Are they billboards? I want them to look awesome like Geometry Wars. The way they are built and do glow and leave trails could be refactored and rethought better. Each o fthe players different attack upgrades also need different colors and shapes and properties. I do want the daemon shot to be a a blue ball shape that increases like it currently does. If we can refactor it using a new method that'd be good.



For trails, what if we manipulate the pixels to smear them based on motion vectors? How expensive would that be? 
What about a Phosphor Decay? an "Afterimage" post-processing pass (render the previous frame on top of the current frame with 90% opacity).
Result: Everything leaves a very faint, ghostly trail. Fast moving bright objects (like bullets) effectively paint lines of light on the screen that fade over 0.2s.

Please share thoughts about both those ideas.

I'd want it applied to player attacks, daemon, hunter (basically anything that has a projectile property - - - do we presently have the idea of projectile shared by all entities that use one for cleaner code in like a config/JSON or something so they can all be edited in one place with shared values?) 




    generate favicons dynamically in relation to the story telling and gameplay. / Health/status indication / enemy wave Countdown timer

    animate Page Title (Tab Text) (blinking and scrolling? what other ways can we animate it?)

    Browser UI Theme Color that matches MESOELFY_OS health state.



IMG_XX are all character squares that open that characters sub menu, which then shows lall the tiwtter hyperlinks. the twitter links can always be switched out to something like DeviantArt later. It's not that serious or big of a deal to delete the twitter posts later if they get infected with haters.


Upgrade ELFY icon to 64x64
 



### **// NEXT_OBJECTIVE: THE_SENTINEL_UPDATE**

Now that the system is stable and "aware," we need a threat worthy of these defenses. You mentioned a **Boss Character**.

I propose **Operation: DAEMON_PRIME**.

#### **PHASE 1: THE ARCHETYPE**
*   **Identity:** "The Sentinel" (or "Daemon Prime").
*   **Logic:** A multi-stage boss that spawns at **Wave 10**.
*   **Mechanics:**
    *   **Phase 1 (Shield):** Orbits the center, immune to damage until its orbiting "Nodes" are destroyed.
    *   **Phase 2 (Glitch):** Teleports randomly, spawning "Driller" minions.
    *   **Phase 3 (Rage):** Chases the player while firing a spread shot.

#### **PHASE 2: THE VISUALS**
*   **Model:** A complex compound geometry (e.g., a central Icosahedron surrounded by floating Cubes).
*   **Shader:** A "Corrupted" shader that shifts colors violently (Green -> Red -> Static).
*   **Health Bar:** A dedicated, large health bar at the top of the screen (Boss HUD).

#### **PHASE 3: THE META-ATTACK**
*   **Re-integration:** We bring back the **URL Hex Flood** idea.
*   **Behavior:** When the Boss enters "Rage Mode," it hijacks the URL bar (`#/0x99A...CRITICAL`) and shakes the browser window heavily.

**Shall we begin designing the Boss Archetype?**


Black Blink: The critical blinking state now renders a black rectangle instead of clearing the canvas (transparency), ensuring high contrast.
Slower ASCII Blink: Adjusted the health bar blink rate to tick % 20 (1 second cycle) for a steadier pulse.
Favicon Stability:
Implemented a specific ID (id="dynamic-favicon") for the link element to prevent conflicts with Next.js auto-injected tags.
Added logic to hide/remove other conflicting icons when dynamic mode is active.
Refined the isStaticState logic to ensure strict adherence to the "INIT phase or 3s Idle" rule.








After 3 seconds of 100% health, the ASCII health bar cycles through a blink of each individual bar, and then they all blink in unison with a green check mark, THEN the default favicon appears.




This decouples the visual update frequency (20fps) from React's render cycle, preventing the interval from thrashing when state changes rapidly. This stability should eliminate the visual glitches and flickering default icon.




But in the game dashboard, the default and new icon still flicker into view instead of only the

The default favicon keeps appearing after every new icon transition, and then after clicking initialize, the new initialize icon gets stuck as the only one showing.

Instead of 







Also, red favicon health should blink in perfect unison with the ASCII health bar in the browser tab title.

Add a wave form visualizor for all sound affects with some sliders to change them and show how they work. Include an export button? Is that a lot of code? What if it just gave code to paste into terminal or give to AI to instuct how to


- Theme Color Injection. - - - doesn't seem to be working for me?
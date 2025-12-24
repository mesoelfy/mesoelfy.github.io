# MESOELFY_OS // MASTER DEVELOPMENT LOG

## 🐛 KNOWN BUGS & INSTABILITY
- [ ] **White Flash on Refresh (FOUC):** The 3D Canvas areas flash white briefly on page reload.
- [ ] **Firefox Rendering:** The `LV_XX` text isn't rendering properly in Firefox. (try other browsers).
- [ ] **Sandbox/Holodeck:** 
    - Holodeck is slow and glitchy.
    - Player pointer cursor and battle reticle both appearing, but not in sync. Should just be battle cursor if not hovering on settings.
    - **AudioMatrix:** The sounds aren't playing in `audio_matrix`.

- [ ] **Visual Glitches:**
    - Video Slots: I could see the third video already loaded but the [mask] was still being obscured. The stagger of loading is being faked? New videos coming in you can see the edges... take another long look at this section.
    - Mini mode causes the custom cursor to persist, but it shouldn't be visible when minimized like that because we are back to the game dashboard.
    - Disabling god suite toggles makes a sound, but enabling doesn't make a sound.
    - It appears that I'm seeing some white particles from an enemy when it dies? Am I assessing that correctly?

## ⚔️ GAMEPLAY MECHANICS & DESIGN
- [ ] **Tuning:**
    - **First Upgrade:** Should be a bullet speed increase to what you'd actually want to start the game at. This lets the player feel relief early on by a significant boost.
    - **Incentive:** What is the incentive to keep all panels alive instead of just puppy guarding one? Maybe you only get your upgrades if in green status or 100%?
    - **Health:** Need health for player and lives and powerups. (increase bullet size / rate of fire). Make players health slowly auto regenerate.
- [ ] **New Enemies & logic:**
    - **Muncher:** What if there is a muncher enemy that targets the elements within a panel such as each of the three video slots or each social media button? (Slots within a green health panel like IMG_XX can be targeted by a new driller type. if it gets destroyed, it does a certain percentage amount of damage to the entire panel).
    - **Weaver (Firewall Enemy):** JezzBall/Qix inspired. Crawls GlassPanel edges. Embeds anchor nodes. Makes a bee line to close triangle shape. Area inside turns to hazard.
    - **Burrower:** There could be "burrow" waves where they burrow into modal. Can it be coded for them to be moving around doing stuff even though we haven't instantiated the modal yet?
    
   
    - **Collisions:** Player colliding with any enemy should hurt player and make that enemy explode (by doing damage to them).
    - **Spawn Logic:** Enemies should be spawning in the coordinates where a broken panel is with their own sophisticated spawn rate separate from the waves.
- [ ] **Bosses:**
    - **Citadel (Star Castle):** 3 concentric rings of "Segment" entities around the Core. Core is invulnerable while Inner Ring exists. 
    - **Daemon Boss:** Shoots giant balls that even kill its own units.
- [ ] **Progression / Shop:**
    - EXP points unlock upgrade tokens to spend in "shop", and different upgrades and aspects cost different amounts. Have Legend of Zelda OoT style slots that are empty and fill in when purchase. Badge-like.
    - Upgrades such as execute/damage increase could be awarded after every boss battle and have some special kind of heraldry in its badge design.
- [ ] **Interactions:**
    - Player can only heal if identity core panel is at 100%, then they have to hover over the 3D crystal and they will spin like rebooting but will be green.
    - Have a notch/panel on the side of identity panel like a gear / slot for charging health?
    - Collapse panels: What if you could collapse panels so it is just the headers, and that's how you protect panels? But baddies will still get inside and you have to open them to squish them?

## 🎨 VISUALS, JUICE & AESTHETICS
- [ ] **Projectile Overhaul:**
    - I want them to look awesome like Geometry Wars. Refactor using SDF shapes (Capsules, Diamonds, Circles).
    - **Shapes:** Capsule (Standard), Chevron/Arrow (Fork), Diamond/Kite (Sniper), Ring/Donut (Backdoor), Plus (Daemon).
    - **Backdoor:** One large crescent wave that fires 4X slower than default baseline attack.
    - **Trails:** Bullet trails need to match the new sizes of bullets after upgrading them. Let's overhaul how trails are rendered. (Phosphor Decay/Afterimage?).
    - Tip Color: It would also be nice if the tip that becomes upgraded became a color as indication.
- [ ] **Panel & Environment:**
    - **0% Health:** We need a dramatic visual animation / indication signifying that a panel has reached 0% health like the system restored animation.
    - **Jitter:** Should a panel jitter when driller damages it and jitter more when more drillers are drilling?
    - **Skull Glitch:** Overlay a 2D, glitchy "Skull" graphic. Randomly flickers to opacity: 1 for a single frame. At 0% Health, the Crystal vanishes entirely, and the Skull locks in permanently (Red).
    - **Breach Text:** The system breach scrolling text needs to be independent for each panel, not a master animation that overlaps for multiple panels.
    - **Background:** What is background motion grid called and what can it be renamed to? Relabel motion grid.
    - **Colors:** #070B06 IMG_XX BG color.
- [ ] **Juice & Feel:**
    - **Squash and Stretch:** "The ball elongates when moving fast." Implement for Hunter and Demon ball attacks. Hunter should squish from front to back like a spring compressing while charging.
    - **Spring Physics:** Replace `MathUtils.lerp` with Damped Harmonic Oscillators. Movement feels mathematically perfect rather than physically reactive.
    - **Ghosting:** Discrete "Ghost" instances for player during dashing/teleporting.
    - **Hit Stop:** Variable Hit Stop (Small=No, Medium=3 frames, Critical=10 frames + Vibration). Currently only triggering on Player Hit/Panel death.
    - **Flash:** When an Enemy takes damage, it should flash a light version of its base color and scale down to 0.9 then spring back to 1.0.
    - **UI Notification (The Toast):** A sleek, dark glass card slides down with spring physics when an achievement is unlocked.
- [ ] **Zen Mode:**
    - Cycle through cool prismatic color patterns for elements in the header/footer/and the motion grid lines.
    - Flavor text in the header and footer say something cheeky and diegetic (safe/chill/vibe mode).
    - Motion grid affected by the music like a visualizer.
    - Cursor leaves a psychedelic trail.

## 🔊 AUDIO ENGINE
- [ ] **Music & Atmosphere:**
    - **Playlist:** The music has a set playlist order, but if the player clicks >> for next track, the next track will be random. Once a track has played, it gets removed from the set.
    - **Low Health:** When SystemIntegrity < 20% or PlayerHealth is critical, apply a BiquadFilterNode (Low Pass).
    - **Game Over:** Music should get distorted, glitchy, and reverbed when Game Over state for a moment. High-pitched "whine-down" (pitch shifting a sine wave from 1000Hz to 0Hz).
- [ ] **Sound Effects:**
    - **Harmonic Escalation:** Track comboCount. Kill 1: Pitch 1.0. Kill 2: Pitch 1.12 (Major 2nd). Kill 3: Pitch 1.25.
    - **Differentiation:** Healing sound needs to be different from rebooting sound.
    - **Specifics:** 
        - Hunter weapon needs charge up and release sound.
        - All enemies should have bespoke sounds.
        - Variable typing sounds, a ... sound in sync with how they appear.
        - Sparkly shimmer sounds for the matrix rain.
        - "Feel' for sliders with snapping and SFX in increments of 5 units.
- [ ] **Tech:**
    - **Waveform:** Add a wave form visualizer for all sound affects with some sliders to change them and show how they work.
    - **Errors:** Clean chrome console log of all the youtube errors.

## 💻 UI / UX & META
- [ ] **Intro:**
    - Need to add some kind of "begin" click prompt to enable sound in the intro.
    - Have `Boot_Loader.sys` be a pixel art folder of Elfy's face that does a cute animation after double clicking (coyote time).
    - Add a spinning gear in the top right of the intro scene.
- [ ] **Patron Panel:**
    - Cycles between top all time patron, top month patron, latest patron, leader board. Links to Ko-fi.
- [ ] **Gate / Settings:**
    - **Potato Mode:** Can we detect if a user is having a poor FPS experience, pause everything, then offer to switch to potato-quality graphics?
    - **Mobile:** Mobile joystick sensitivity adjustment settings.
    - **Keybindings:** Keyboard and gamepad support (with sensitivity settings).
    - **Vibe Code:** Settings tab instructions for how to use AI Studio and command to get all source code.
    - **Donate:** Have a pop-up like wikipedia does asking for money $2.75 / $4.20 / $6.66 / $7.77 / $11.11.
- [ ] **Browser Integration:**
    - **Scroll bar:** Should match the health status color of the OS (GREEN/YELLOW/RED).
    - **Favicons:** Generate favicons dynamically (Health/status indication / enemy wave Countdown timer). Blinking pause favicon color should correlate to the health status.
    - **Tab Title:** Animate Page Title (blinking and scrolling).
    - **Theme Color:** Browser UI Theme Color that matches MESOELFY_OS health state (doesn't seem to be working for me?).
- [ ] **Content Management:**
    - **IMG_XX:** Make IMG_XX thumbnails videos (2X bigger than they need to be and downscaled). Loop.
    - **JSON:** Use JSON to just keep all the code that is the same each time and then swap out the ID/different values for portfolio/socials (DRY).
    - **Sharing:** Sharing link needs to make an awesome twitter link capsule image.
- [ ] **Debug:**
    - DEBUG mode will have asterisk slots for entering konami code to access it.
    - Update custom debug console to direct users to pressing F12 with some nice graphic design.
    - `~` to exit debug should be at the bottom of the window like it is in the settings window.

## 🛠 ARCHITECTURE & OPTIMIZATION
- [ ] **Refactoring Audits:**
    - Is there scattered logic in components that should be consolidated?
    - Tell me what in the project has become a God Object.
    - What in the architecture relies on tight coupling?
    - Where is "Tech Debt" accumulating?
    - Configuration should just be data, not repeated logic.
    - Remove Magic strings / magic numbers / constants / Primitive Obsession.
    - Are there any legacy systems that need to be scrubbed?
- [ ] **Performance:**
    - **Threading:** Browsers are single-threaded yes? What optimizations do you see available to run different aspects of the project like a multi-core application (Game Logic, Rendering, UI)?
    - **Workers:** Move Physics/Collision/Pathfinding to a Worker thread?
    - **FPS:** Is the framerate capped at 60? Would uncapping it cause wasted processing? Should we have an uncapped frame rate setting?
    - **Throttling:** Don't load iframes in Potato Mode.

## ❓ OPEN QUESTIONS & BRAINSTORMING
- [ ] "What things does Vampire Survivors do that I should implement? Game design and juice."
- [ ] "How expensive is it to render our 3D enemy models? What other kinds of 3D shapes do you know how to render? Can you make models that look like fighter space ships?"
- [ ] "Can we have some constantly moving graphic design like we have for the mobile section?"
- [ ] "Can we force the iframe'd youtube video to start paused and then turn on after a set timer?"
- [ ] "Can we implement a "zoomed" magnifying glass view under the action button?"
- [ ] **Weapon Registry:** Instead of switching guns, define Mutation Paths. Level 6 (Mutation): "Split Stream". Level 10 (Mutation): "Railgun".

---

## MISC
*These items appear to be addressed in the current codebase or superseded by recent fixes.*

- **Audio Bug:** "If I click the next track >> button a second time too quickly, the game fades to silence." *(Fixed in recent commit via VoiceManager cancelStop logic).*
- **Deployment:** "Deployment Check: Verify GitHub Pages behavior." *(Likely standard procedure, can remain or be removed if live).*
- **Misc:** "need help seeing not obvious stuff that is missing." *(Vague, covered by Refactoring Audits)*.
- **Misc:** "sharing https://mesoelfy.github.io/ needs to make an awesome twitter link capsule image." *(Metadata exists, covered by "Sharing" item in UI).*


add muzzle flash particle effect at the gun tip when firing

screenflash on refresh issue persists


multi shot just isn't satisfying or aimable. let's just make the upgrade make your single shot wider

)>  curve with point dead center. more points with every upgrade.

SFX text too low in toggle

technical debt

MICROINTERACTIONS - - - great motion graphic design prompt - ask for list of what could be added


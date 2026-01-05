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



technical debt

MICROINTERACTIONS - - - great motion graphic design prompt - ask for list of what could be added

player ability, leave a snail slime trail where the cursor was. upgrades - can increase the frequency at which you drop slime and the length of time you drop slime, and damage. center reticle can change color like tip whenever dropping slime


Increase Lighthouse Score.
Is my site optimized for things Google loves? (without unnecessary bloat)

should I be implementing GSAP into my project in any way?

Lenis github page has great README banner:
https://github.com/darkroomengineering/lenis


Now one of Elfy's closest allies, Zing

player isn't properly dying to red state







MONEY // CRYPTO // BLOCKCHAIN
Etherscan Watch List:
Go to Etherscan.io.
Create a free account.
Add your 0x address to your "Watch List".
Enable "Email Notification on Incoming Tx".
Result: You get an email instantly when someone tips you.


Proposal for a new Component: CryptoTipJar.tsx
Visual: A QR Code rendered in a "pixelated" style (using a library like react-qr-code styled with CSS filters to look green/CRT).
Interaction: Click to Copy Address.
Feedback: Sound effect (syn_data_burst) and a toast message: ADDRESS_COPIED_TO_CLIPBOARD.

    "ens": "mesoelfy.eth",
    "eth_address": "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
    "signature": "0x[PENDING_CRYPTOGRAPHIC_PROOF_OF_OWNERSHIP]",
    "kofi_url": "https://ko-fi.com/mesoelfy"



Send me $5 for teaching you how to buy and send crypto.

If you're clever you can figure it out on your own. AI will know right away what the password is if you ask it.

https://app.ens.domains/mesoelfy.eth



Update crypto section to mention bitcoin vs ethereum and the technical reasons why I don't accept bitcoin but do accept ethereum (and others I do accept)








* EXP HUD in Identity Panel is getting cropped at short width windwo
* Hunter projectiles expiring in view
* YouTube videos not loading - "An error occurred. Please try again later (playback ID:)"
* First song looped instead of playing the next track. (can I test this stuff by building it myself locally for Mac?)
* HUD crystal moves when going to full screen instead of staying centered in its circle container.




/MESOELFY_PRODUCTION_VAULT
├── 00_RAW_LATENT_SPACE      <-- The "Dump". Date-stamped folders of raw AI output.
│   ├── 2025-01-01_Elfy_Cyber_Tests
│   ├── 2025-01-02_Demons_Concept
│   └── 2025-01-05_Zing_Designs
│
├── 01_CANON_CHARACTERS      <-- The "Chosen Ones". Only the best make it here.
│   ├── PROTAGONISTS
│   │   ├── ELFY
│   │   │   ├── Base_Form
│   │   │   ├── Variant_Cyberpunk
│   │   │   ├── Variant_HighFantasy
│   │   │   └── Variant_Glitch
│   │   └── ZING             <-- The Ally (Piccolo/Proto Man archetype)
│   │       ├── Base_Form
│   │       └── Variant_Armored
│   │
│   ├── ANTAGONISTS
│   │   ├── AKUMA_CLASS      <-- Demons/Spirits
│   │   ├── VOID_ALIENS      <-- Cosmic Horror/Aliens
│   │   └── CONSTRUCTS       <-- Robots/Drones
│   │
│   └── NPCS
│       ├── MERCHANTS
│       └── GLITCH_CITIZENS
│
├── 02_ENVIRONMENTS          <-- Settings/Backgrounds
│   ├── NEON_CITY
│   ├── THE_VOID
│   └── ANCIENT_RUINS
│
└── 03_MARKETING_FINAL       <-- Ready for X/Twitter
    ├── HighRes_Upscaled     <-- 4k+ versions
    └── Web_Optimized        <-- 1:1 Pixel Art crops & Low-Res Previews





    Here's your complete organized enemy type list:

## CORE ENEMY CATEGORIES

### ORGANIC/BIOLOGICAL
- Cronens - Cronenbergian fleshy nightmare monsters
- Insectoid - Mindless monster bugs
- Anthro Insects - Smart bug warriors (mantis, beetle, etc.)
- Mutants - Radiation/chemical altered humans or creatures
- Chimeras - Multi-animal hybrids, grafted beasts
- Hybrids - Fusion experiments, mixed enemy types
- Parasites - Infection-type enemies, host-takers
- Swarms - Collective small creatures acting as one unit
- Xenomorphs - Rapidly evolving adaptive organisms
- Aberrations - Reality-warped biological anomalies
- Colonies - Interconnected organisms sharing consciousness
- Spore-Hosts - Fungal-infected creatures retaining base form

### UNDEAD/NECROMANTIC
- Undead - Revenants, necromantic threats
- Wraiths - Death-aligned spirits beyond basic Phantoms
- Liches - Undead sorcerer-kings

### SUPERNATURAL/MYSTICAL
- Akuma - Smart demon race (horned and non-horned variants)
- Espers - Beefy psychic power villains
- Phantoms - Spectral entities, illusion-casters
- Fae - Trickster nature spirits, wild magic beings
- Djinn - Wish-twisting entities, reality benders
- Yokai - Japanese supernatural creatures
- Cryptids - Bigfoot/Mothman-style unknown creatures
- Eldritch - Lovecraftian cosmic horrors
- Celestials - Angel/divine warrior types
- Infernal Knights - Armored demon soldiers

### ELEMENTAL ENTITIES
- Infernals - Fire/lava creatures, heat-based entities
- Cryomancers - Ice/frost beings, cold-radiating enemies
- Voltaic - Electric/lightning creatures, electromagnetic entities
- Geomancers - Earth manipulators beyond basic golems
- Aquamancers - Water-controlling beings, liquid manipulators
- Aeromancers - Wind/storm entities, atmospheric controllers
- Photonic - Light-based beings different from Radiants
- Umbral - Shadow/darkness creatures, void-dwellers

### CONSTRUCTS/ARTIFICIAL
- Golems - Rock/earth-based animated creatures
- Constructs - Magical or technological automatons
- Automatons - Mechanical robots/machines
- Mechs - Piloted or AI-controlled war machines
- Drones - Mass-produced robot swarms
- Androids - Humanoid robots
- Warframes - Combat exoskeletons
- Synths - Synthetic lifeforms, bio-mechanical
- Nanomachines - Microscopic swarm tech
- Hardlight Constructs - Holographic solid projections
- Clones - Genetically identical mass-produced soldiers
- Cyborgs - Biological/mechanical hybrid soldiers
- Holograms - Deceptive projection enemies

### DIMENSIONAL/COSMIC
- Primordials - Ancient cosmic entities
- Void-Spawn - Entities from between dimensions
- Time Wraiths - Temporal predators
- Mirror Entities - Reflection-based doppelgangers
- Fractal Beings - Self-similar recursive organisms
- Tesseract Beings - Higher-dimensional technological entities

### GIANT/MASSIVE
- Kaiju - Giant monsters
- Behemoths - Massive brutes, siege monsters
- Titans - Ancient giant/god-tier beings

### ORGANIZED FORCES
- Sentai Squad - Super sentai style villain teams
- Cultists - Fanatical human/humanoid followers
- Mercs/PMCs - Professional military contractors
- Slavers - Hostile organized crime syndicates
- Pirates - Space/land raiders, resource thieves
- Zealots - Religious extremist warriors

---

## ALIEN SPECIES (by form/material)

### BIOLOGICAL FORMS
- Humanoid - Bipedal, human-like proportions
- Reptilian - Scaled, cold-blooded, serpentine or lizard-like
- Avian - Bird-like, winged, feathered or beaked
- Mammalian - Bear/wolf/cat-like alien variants
- Aquatic - Fish/amphibian/cephalopod traits, water-dependent
- Chitinous - Armored shell creatures beyond just insects
- Arachnid - Spider-like, web-spinners, many-eyed
- Cephaloid - Tentacled, multiple brains, distributed nervous systems

### ALTERNATIVE BIOLOGY
- Amorphous - Slime/gel-based, shapeshifters, liquid forms
- Crystalline - Silicon-based, gemstone bodies, mineral composition
- Lithoid - Rock-based lifeforms, living stone
- Plantoid - Flora-based, photosynthetic, root/vine bodies
- Fungal - Spore-based, mycelium networks, decomposer biology
- Gaseous - Cloud beings, atmospheric entities, energy forms
- Radiant - Energy beings, light/plasma forms, no solid body
- Ethereal - Semi-transparent, phase-shifting, dimensional
- Mechanical - Naturally evolved machine life, living metal

### COLLECTIVE/COMPOSITE
- Composite - Hive minds, colony organisms, many-as-one
- Symbiotic - Two species functioning as one organism


Give list to gemini, have it label each image with all categories it should, including new ones that aren't provided but also should be included. Then give ls to new session of images and ask to relable and recategorize and organize everyhthing in proper folders and naming structure.


there needs to be a ding on healing player to 100% like healing a panel but lower in pitch.




All the images will be placed in a single folder, so their naming structure needs to be refined so everyhing is organized appropriately. - - - do so after showing codebase so it knows the kind of thing you want






Last login: Sat Jan  3 09:42:54 on console
stevencasteel@Stevens-Mac-mini ESPER ELFY CHARACTERS % ls
Akuma_Humanoid_Esper_Hybrid_Cultist_Zealot_Aristocrat_Masked_Sorcerer_Malphas_Xerxes_Valerius.jpeg
Alien Humanoid Warframe Celestial Synth Bio-Mechanical Armor White Gold Trim Hammerhead Helm Red Eyes Elite Soldier - Praetorian Zenith, Arbiter Sol, Exarch Aurum.jpeg
Alien Species - Alternative Biology - Lithoid - Giant:Massive - Behemoths - Reptilian - Orange Rock Skin - Spiked Spine - Tail - Tectonic Ravager, Boulder-Hide Beast, Subject Geo-Gnash.jpeg
Alien Species - Alternative Biology - Plantoid - Humanoid - Bark Skin - Glowing Green Veins - Root Hair - Spiked Club - Dark Nature - Lady Ironwood, Sylva the Corrupted, The Root-Bound Berserker.jpeg
Alien Species - Biological Forms - Aquatic - Reptilian - Beast - Purple and Teal Scales - Dorsal Fin - Vestigial Arms - Claws - The Abyssal Ravager, Deep-Dweller Rex, Trench Stalker.jpeg
Alien Species - Biological Forms - Reptilian - Humanoid - Hybrid - Blue Fur - Scales - Leather Harness - Tail - Beast - Vorag the Hunter, Ryl the Azure Stalker, The Midnight Ravager.jpeg
Alien Species Alternative Biology Mechanical Constructs Artificial Androids Synths Humanoid Aristocratic Formal-Wear Masked - Baron Byte-Ruff Marquis Mechanus Silver-Tongued Synth.jpeg
Alien Species Alternative Biology Mechanical Constructs Artificial Automatons Humanoid Organized Forces Zealots Cultists Photonic Cyclopean Bronze-Armored Robed - Sol-Occulus Brass-Apostle Ohm-Venerate.jpeg
Alien Species Biological Forms Humanoid Anthro Insects Chitinous Winged Organized Forces Mercs PMCs Tech-Enhanced - Vex-Pilot Chitin Humanoid Anthro Insects Chitinous Winged Organized Forces Merc.jpeg
Alien Species Biological Forms Humanoid Aquatic Reptilian Hybrid Organized Forces Cultists Supernatural Mystical Espers Bioluminescent Iridescent - Taroited Zealot Gill-Priest Abyssal-Acolyte.jpeg
Alien Species Biological Forms Humanoid Aquatic Reptilian Hybrid Organized Forces Mercs PMCs Tactical Armor Bioluminescent Axolotl-Type - Lotl-Commando Siren-Vanguard Axo-Grunt.jpeg
Alien Species Biological Forms Humanoid Avian Reptilian Hybrid Chimera Umbral Organized Forces Cultists Mercs PMCs Armored Iridescent Beaked Feather-Crested - Talon-Voss Night-Avis Corvax-Elite.jpeg
Alien Species Biological Forms Humanoid Cephaloid Hybrid Aberrations Eldritch Organized Forces Slavers Pirates Cyclopean Tentacled Iridescent-Tailored - Baron Octo-Gaze Cephalo-Cipher Void-Tailor Vane.jpeg
Alien Species Biological Forms Humanoid Cephaloid Mammalian Hybrid Eldritch Organized Forces Aristocratic Jeweled-Tailored Tentacled-Mouth - Baron Ink-Vein Lord Depth-Stalker Chancellor Void-Grasp.jpeg
Alien Species Biological Forms Humanoid Mammalian Chiropteran Hybrids Iridescent Bioluminescent Organized Forces Mercs PMCs Tech-Enhanced Anti-Gravity - Glint-Stalker Echo-Prime Void-Reiver.jpeg
Alien Species Biological Forms Humanoid Mammalian Chiropteran Supernatural Mystical Espers Organized Forces Cultists Glow-Patterned Robes - Echo-Seer Night-Stalker Acolyte Chirop-Mystic.jpeg
Alien Species Biological Forms Humanoid Mammalian Mutants Hybrids Cyborgs Organized Forces Mercs PMCs Pirates Spiked Iridescent-Leather Dagger-Wielder - Razor-Fang Varg-Vandal Blood-Biker.jpeg
Alien Species Biological Forms Humanoid Parasites Hybrids Symbiotic Aberrations Organized Forces Cultists Multi-Armed Bone-Adorned Segmented - Vermis-Acolyte Flesh-Stitcher Gore-Sovereign.jpeg
Alien Species Biological Forms Humanoid Reptilian Aquatic Hybrid Organized Forces Pirates Slavers Mercs PMCs Tech-Enhanced Iridescent Spiked Moray-Type - Reef-Reaver Moray-Vandal Scaled-Mercenary.jpeg
Alien Species Biological Forms Humanoid Reptilian Arachnid Hybrid Aberrations Organized Forces Pirates Slavers Mercs Tech-Enhanced Multi-Eyed Goggled Iridescent - Optic-Scavenger Gear-Gaze Slink-Sprocket.jpeg
Alien Species Biological Forms Mammalian Arachnid Hybrid Aberrations Cronens Organized Forces Slavers Pirates formal attire Hexapedal Bioluminescent Pustules Iridescent - Lord Vesper-Gore Baron Silk-Blight Count Arach-Mane.jpeg
Alien Species Biological Humanoid Aquatic Reptilian Hybrid Cryptid Elemental Aquamancers Bioluminescent Deep-Sea Slime-Dripping - Fin-Gorgon Tide-Stalker Marrow-Deep.jpeg
Alien Species Biological Reptilian Humanoid Elemental Infernals Crystalline Mutants Behemoths Magma-Infused Spiked Brute - Magmaw Shard-Scale Ignis-Rex.jpeg
Alien_Humanoid_Anthro_Insects_Chitinous_Hybrid_Cyborg_Mercs_PMCs_Armored_Beetle-Like_Multi-Eyed_Scovox_Carapace_Krellis.jpeg
Alien_Humanoid_Anthro_Insects_Cyborgs_Hybrids_Synths_Phantoms_Aristocrat_Masked_Infiltrator_Silas_Maven_Thorne.jpeg
Alien_Humanoid_Aquatic_Reptilian_Organic_Biological_Aristocrat_Multi-Eyed_Bioluminescent_Zale_Caspian_Thalassos.jpeg
Alien_Humanoid_Avian_Cyborg_Synth_Sentai_Squad_Mercs_PMCs_Masked_Umbral_Tactical_Infiltrator_Vane_Kyro_Shift.jpeg
Alien_Humanoid_Cyborg_Hybrid_Synth_Ethereal_Radiant_Merc_PMC_Operative_Tech_Integrated_Bioluminescent_Vela_Xandris_Kora.jpeg
Alien_Humanoid_Cyborgs_Synths_Androids_Automatons_Mercs_PMCs_Pirates_Masked_Tactical_Infiltrator_Blade-Tails_Vector_Kross_Mordecai.jpeg
Alien_Humanoid_Dimensional_Cosmic_Primordials_Radiant_Crystalline_Photonic_Ethereal_Iridescent_Aristocrat_Cyborg_Synth_Mercs_PMCs_Operative_Astra_Lyra_Galaxia.jpeg
Alien_Humanoid_Fae_Mercs_PMCs_Pirates_Cyborgs_Tech_Integrated_Marksman_Aris_Lyra_Nyx.jpeg
Alien_Humanoid_Organic_Biological_Cronens_Aberrations_Cyborgs_Mutants_Slavers_Scavenger_Buzz_Kraz_Vortn.jpeg
Alien_Humanoid_Organic_Biological_Reptilian_Symbiotic_Espers_Mercs_PMCs_Gem-Core_Bio-Integrated_Varkas_Xeron_Thall.jpeg
Alien_Humanoid_Reptilian_Biological_Organic_Mercs_PMCs_Pirates_Scaled_Tactical_Rask_Surok_Thrax.jpeg
Anthro Insects Insectoid Warframes Humanoid Bio-Mechanical Silver Armor White Plating Tail Wings Glaive Polearm Serrated Blade - Valkyrie Chitin, White Stinger, Knight-Commander Argent.jpeg
Arachnid Mammalian Hybrid Chimera Alien Biological Cronens Slaver Aberration Simian Iridescent Sac-Back Baron-Bile Silk-Simian Vester-Venom.jpeg
Automaton_Cyborg_Cronen_Hybrid_Mechanical_Porter_Brassgut_Rustjaw_Cogmarrow.jpeg
Automaton_Warframe_Mechanical_Humanoid_Monstrous_Maw_Blue_Orange_Energy_Wrist_Blasters_Hyperion_Ravage_Cobalt_Flare.jpeg
Avian_Kaiju_Cyborg_Mechanical_Hybrid_Behemoth_Stormwing_Aviacore_Ironbeak.jpeg
CONSTRUCTS HARDLIGHT HOLOGRAMS SYNTHS AKUMA PHOTONIC RADIANT MECHANICAL HUMANOID BLUE DIGITAL CIRCUITRY HORNED Neon-Daimon Vector-Alpha Zale-the-Glass-Horned.jpeg
ChatGPT Image Dec 29, 2025, 08_12_29 PM.png
Constructs Artificial Androids Synths Humanoid Mechanical Female Blue Hair Blue Armor Cosmic Star Pattern Galaxy Texture Headphones Sleek Cybernetic Space - Unit 01 Celestia, Cyber-Idol Nova, Star-Pilot Azure.jpeg
Constructs Artificial Androids Synths Humanoid Mechanical Female Blue Hair Blue Armor Wings Thrusters Flight Cybernetic Fairy - Unit 02 Pixie, Cyber-Fae Azure, Sky-Striker Cobalt.jpeg
Constructs Artificial Androids Synths Warframes Humanoid Mechanical Female Teal Braid Long Hair Energy Sword Katana Power Suit Helmet Visor Sci-Fi Assassin Cybernetic Hardlight Weapon - Cyber-Ninja Azure, Project Valkyrie, Agent Neon.jpeg
Constructs Artificial Automatons Androids Synths Mechanical Humanoid Robot Bronze Metallic Frame Glass Dome Helmet Orange Glow Internal Core Padded Tunic Strapped Fabric Cargo Pants High-Tech Boots_Unit-836_Brass-Visor Monk_Automata Wanderer.jpeg
Constructs Artificial Mechs Automatons Industrial Robot Heavy Armor Yellow Orange Drill Arm Tank Treads Skull Icon Glowing Core Mining Excavator - Heavy Unit "Quake", Excavator MK-IV, Siege Breaker "Goliath".jpeg
Constructs Artificial Warframes Mechs Automatons Humanoid Mechanical Shoulder Cannons Thrusters Shark-like Visor Sleek Purple Orange Armor - Unit Mako, Cobalt Razor, V-Raptor.jpeg
Constructs Golems Lithoid Crystalline Humanoid Undead Aberration Cracked Rock-Skin Grinning Skull-Face Heart-Shaped Gemstone Core Ornate Teal Vest Root-Patterns_Crystalline-Core Golem_Stone-Grin Zealot_Shard-Heart Sentinel.jpeg
Constructs:Artificial - Androids - Reptilian - Humanoid - Green Plating - Segmented Tail - Drill Staff - Grid Helmet - Purple Accents - Unit Serpens, General Python, The Emerald Enforcer.jpeg
Constructs:Artificial - Cyborgs - Humanoid - Elf - Dark Skin - White Braided Hair - Tech Bodysuit - Glowing Cyan Lines - Gold Accents - Sci-Fi Operative - Agent Vora, Cyber-Elf Xylia, Unit 88 Kaelen.jpeg
Constructs:Artificial - Cyborgs - Organic - Mutants - Humanoid - Bone Mask - Exposed Muscle - Multi-Eyed Shoulders - Blue Tubes - Hook Blades - Runic Skirt - Subject Rune-Flay, The Bio-Hook Butcher, Unit 9 Flesh-Render.jpeg
Constructs:Artificial - Cyborgs - Organic - Mutants - Quad-Armed - Cyclops - Exposed Muscle - Orange Armor - Biomechanical - The Ocular Hulk, Quad-Grappler Unit, Subject Watcher.jpeg
Constructs:Artificial - Cyborgs - Organized Forces - Mercs:PMCs - Humanoid - Elf - Dark Skin - Short White Hair - Tactical Bodysuit - Cybernetic Arm - Tech Visor - Agent Cyra, Operative Lynx, Specialist Ryla.jpeg
Constructs:Artificial - Undead:Necromantic - Cyborgs - Humanoid - Skull Face - Shoulder Spikes - Mechanical Spine - Orange Plating - Waist Cape - Cyber-Lich Xar, Unit Grave-Walker, The Iron Revenant.jpeg
Constructs:Artificial - Warframes - Humanoid - Gold Armor - Blue Undersuit - Dual Energy Pistols - Glowing Visor - Lightning - Centurion Prime, The Gilded Striker, Unit Aurum.jpeg
Constructs:Artificial - Warframes - Supernatural - Wraiths - Humanoid - White Armor - Skeletal Spine - Purple Smoke - Scythe - Glowing Eyes - Unit Specter, The Pale Reaper, Void-Frame Nyx.jpeg
Constructs_Artificial_Androids_Synths_Humanoid_Mechanical_White-Mask_Stitched-Mouth_Teal-and-Gold-Robes_Alien-Script_Backpack-Unit_Synthetic-Agent_Unit-Omega_Scribe-Prime_Vora-Syn.jpeg
Constructs_Artificial_Automatons_Androids_Mechanical_Humanoid_Organized_Forces_Mercs_PMCs_Bronze_Armored_Clawed_Brass_Bulwark_Talon_Sentry_Copper_Vanguard_Unit_X.jpeg
Constructs_Artificial_Automatons_Cyborgs_Mercs_Humanoid_Mechanical_Bronze-Skull_Spiked-Head_Tactical-Gear_Leather-Jacket_Metal-Skeleton_Brass-Reaper_Dead-Circuit_Copper-Skull.jpeg
Constructs_Artificial_Cyborg_Android_Synth_Humanoid_Arachnid_Chitinous_Mechanical_Scorpion-Tail_Stinger_Merc_Bronze_Tactical_Serket_Scorpia_Venoma.jpeg
Constructs_Artificial_Cyborgs_Synths_Organized_Forces_Mercs_PMCs_Humanoid_Red_Armored_Spinal_Blade_Faceless_Hunter_Krux_The_Crimson_Spine_Vez_Blood_Scythe_Zeth_The_Vertebrae_Slayer.jpeg
Constructs_Automatons_Androids_Cronens_Hybrids_Mechanical_Akuma_Zealots_Masked_Chest-Mouth_Brass_Archon_Krux_Maw.jpeg
Crystalline Humanoid Fae Dark Elf Blue Skin White Hair Crystal Armor Arcane Veins Warrior - Vylara Shard-Soul, Kyris the Fractured, Amethyst Vanguard-2.jpeg
Crystalline Humanoid Fae Dark Elf Blue Skin White Hair Crystal Armor Arcane Veins Warrior - Vylara Shard-Soul, Kyris the Fractured, Amethyst Vanguard-3.jpeg
Crystalline Humanoid Fae Dark Elf Blue Skin White Hair Crystal Armor Arcane Veins Warrior - Vylara Shard-Soul, Kyris the Fractured, Amethyst Vanguard-4.jpeg
Crystalline Humanoid Fae Dark Elf Blue Skin White Hair Crystal Armor Arcane Veins Warrior - Vylara Shard-Soul, Kyris the Fractured, Amethyst Vanguard.jpeg
Cyborg_Hybrid_Humanoid_Aquatic-Trait_Merc_Bio-Mechanical_Exhaust-Head_Bronze-Armor_Tactical_Heavy-Gunner_Trench-Stalker_Vent-Face_Copper-Cuda.jpeg
Cyborg_Hybrid_Reptilian_Akuma_Infernals_Bio-Mechanical_Dinosaur-Headed_Glow-Core_Saurian_Plated-Armor_Tail-Blade_Ignisaur_Cinder-Scale_Mecha-Drake.jpeg
Dimensional:Cosmic - Alien Species - Reptilian - Humanoid - Cobra Hood - Scythe - Galaxy Pattern - Lightning - Black Armor - Gold Accents - Serpent of the Stars, Void-Reaper Nagini, Astral Assassin Vipera.jpeg
Dimensional_Cosmic_Supernatural_Mystical_Photonic_Radiant_Ethereal_Fae_Synths_Humanoid_Iridescent-Skin_Galaxy-Fabric_Nebula-Jacket_Pointed-Ears_Techno-Spine_Aurelia_Nebula_Star-Seer.jpeg
ELEMENTAL ENTITIES CRYOMANCERS ALIEN SPECIES REPTILIAN HUMANOID CRYSTALLINE LITHOID FROST-SCALED SPIKED TAIL ICE-COATED PREDATOR GLACIAL WARRIOR COLD-BLOODED BRUTE FROZEN REVENANT Glacius-the-Bitter Rime-Slayer Vorn-Ice-Claw.jpeg
Elemental Entities - Cryomancers - Supernatural - Eldritch - Alien Species - Cephaloid - Ice Creature - Tentacles - Multi-Eyed - Blue Body - The Glacial Polyp, Subject Frost-Bite, The Cryo-Crawler.jpeg
Elemental Entities Aquamancers Humanoid Aquatic Amorphous Liquid Body Blue Skin Water Dress Trident Crown Horns Wet Droplets Ocean Queen Sorceress - Queen Thalassa, Lady Marina, Hydria the Deep.jpeg
Elemental Entities Infernals Constructs Artificial Cyborgs Mechanical Beast Hound Fire Lava Magma Drool Steam Vents Pistons Industrial Skulls Multi-Eyed - Furnace Stalker, Magma-Core Hound, Cyber-Cerberus.jpeg
Elemental Entities Infernals Reptilian Lithoid Behemoths Monster Magma Lava Volcanic Rock Skin Obsidian Spikes Glowing Veins Claws Tail - Magma-Spine Rex, Obsidian Ravager, Volcanus the Breaker.jpeg
Elemental_Entities_Constructs_Golems_Alternative_Biology_Crystalline_Lithoid_Humanoid_Faceless_Shard-Head_Translucent_Teal-Robes_Guardian_Zyraen_Quartz-Sentinel_Shard-Herald.jpeg
Elemental_Entities_Cryomancers_Crystalline_Humanoid_Reptilian_Organic_Biological_Hybrids_Mercs_PMCs_Tactical_Frost-Skull_Glacius_Frostfang_Krysto.jpeg
Elemental_Entities_Infernals_Geomancers_Lithoid_Humanoid_Organic_Biological_Hybrids_Mercs_PMCs_Volcanic_Tactical_Vulkan_Ignis_Krag.jpeg
Gemini_Generated_Image_ryftdhryftdhryft.png
Generated Image November 22, 2025 - 10_34PM.jpeg
Generated Image November 29, 2025 - 11_29PM.jpeg
Humanoid Akuma Demon Undead Mutant Stitched Skin Horns Monocle Red Trench Coat Chains Manic Grin Shoulder Heads Villain - Baron Suture, Lord Bedlam, Vile-Grin the Ripper.jpeg
Humanoid Akuma Infernal Knight Umbral Sorceress Reaper Scythe Wielder Black Armor Purple Feathers Glowing Yellow Eyes Cape Villain - Lady Corvina, Nyx the Soul-Reaper, General Umbra.jpeg
Humanoid Akuma Red-Skinned Tusked Brute Mercs PMCs Organized-Force Biological Mutant Behemoth Grogmar Red-Tusk-Vane Commander-Rhulk.jpeg
Humanoid Akuma Yokai Oni Demon Female Horns Green Hair Trench Coat Executive Agent Villain - Director Jade, General Viridia, Oni-Commander Kyra.jpeg
Humanoid Alien Biological Lithoid Radiant Dimensional Tesseract-Being Organized-Force Elite-Officer Anvil-Headed Bioluminescent Formal-Attire Geometric-Patterns High-Archon-Kael Adjudicator-Vannic Overseer-Xylos.jpeg
Humanoid Alien Biological Organized-Force Elite-Officer Xenomorph-like Purple-Skinned Ornate-Raiment Aristocrat Aberration Archon-Varn High-Inquisitor-Xyl Malakor-The-Silent.jpeg
Humanoid Alien Sci-Fi Elf Cyborg Synth Mercs Scout Blue Skin Cyan Glowing Tattoos Bodysuit Energy Crossbow Archer - Agent Cyan, Unit Vyllo, Trixie Bolt.jpeg
Humanoid Android Cyborg Sentai Squad Warframes Mercs PMC Pilot Blue White Armor Thrusters Jetpack Short Blue Hair - Captain Azure, Unit Velocity, Pilot Blue Jay.jpeg
Humanoid Anthro Insects Mutants Hybrids Insectoid Moth Wings Antennae Scientist Doctor Lab Coat Blood Stains Syringe Giant Needle Tactical Gear Pale Skin Red Eyes Villain - Dr. Chrysalis, Nurse Nocturne, Professor Lepida.jpeg
Humanoid Aquatic Amphibian Reptilian Hybrid Mutant Xenomorph Cyborg Warframe Bioluminescent Tech-Enhanced Axolotl-Warrior Deep-Sea Purple Glowing Neon-Lotl Glow-Stalker Taroite-Vanguard.jpeg
Humanoid Aquatic Hybrid Cephaloid Parasite Alien Biological Organized-Force Pirates Behemoth Great-White-Brute Trench-Coat-Marauder Tentacle-Maw Captain-Gnash Baron-Fin Slither-Jaws.jpeg
Humanoid Avian Reptilian Hybrid Akuma Sorceress Blue Skin Horns Feathers Black Armor High Collar Harpy Queen - Lady Malphasia, Queen Ravenna, Vyloth the Winged.jpeg
Humanoid Cryptids Mutants Undead Blue Muscle Deer Skull Antlers Bone Axe Primal Savage Biological Weapon - Cervos the Flayed, The Blue Wendigo, Baron Marrow.jpeg
Humanoid Cryptids Spore-Hosts Undead Fungal Deer Skull Antlers Glowing Blue Mushrooms Trench Coat Suit Rusty Scythe Arm Runes - Baron Rotwood, Silas the Spore-Host, The Gentleman Wendigo.jpeg
Humanoid Cultist Warlock Necromancer Alchemist Zealot Female Spiked Leather Armor Whip Green Fire Fel Flame Goggles Vials Chem-Punk Villain - Vexana Chem-Lash, High Priestess Malign, Zola Fel-Whip.jpeg
Humanoid Cultist Zealot Void-Spawn Arachnid Sorcerer Mystic Masked Hooded Robed Black Cloak Four Eyes Glowing Purple Eyes Bone Necklace - Void-Seer Xal, Prophet Ommix, The Silent Oracle.jpeg
Humanoid Cyborg Biological Hybrid Mercs PMCs Hooded Gold-Mechanical-Arms Techno-Mystic Rogue Lyra-Steel Aurelia-Vane Seraphina-Flux.jpeg
Humanoid Cyborg Dark Elf Mercs PMC Synths Cybernetic Spine Tech-Wear Futuristic Agent - Nyx Circuit, Vesper Node, Elara Uplink.jpeg
Humanoid Cyborg Mercs PMC Assassin Elite Soldier Dark Plate Armor Cybernetic Jaw Metal Chin Guard White Hair Winking Smug - Captain Steel-Maw, Valora the Vicious, Commander Argenta.jpeg
Humanoid Dimensional Cosmic Void-Spawn Infernal Knight Celestial White Armor Horned Helmet Galaxy Greatsword Starry Cape Lightning Aura - Lord Aetherius, Void-Knight Orion, Paladin Nova.jpeg
Humanoid Elf Clone Synth Cyborg Mutant Stasis Pod Incubator Tank Test Subject Tubes Red Eyes Blue Liquid Body Suit - Subject 734, Project Elara, Unit Zero-One.jpeg
Humanoid Fae Dark Elf Crystalline Geomancer Umbral Sorceress Lithoid Amethyst Crystal Armor Staff Wielder - Amethystra, Vespera Voidshard, Krystalin Onyx-2.jpeg
Humanoid Fae Dark Elf Crystalline Geomancer Umbral Sorceress Lithoid Amethyst Crystal Armor Staff Wielder - Amethystra, Vespera Voidshard, Krystalin Onyx.jpeg
Humanoid Fae Elf Cyborg Mercenary Space Pirate Dark Skin Short White Hair Yellow Eyes Facial Tech Implant Red Jacket Orange Holographic Magic Circles Hacker - Ravara the Slicer, Technomancer Zali, Agent Spark.jpeg
Humanoid Fae Elf Rogue Mercs Pirate Adventurer Casual Outfit Blue Hair Red Scarf Tank Top Winking - Rixie, Cyan Strider, Vina the Swift.jpeg
Humanoid Fae Elf Sci-Fi Green Armor Bodysuit Tech Suit Red Hair Ponytail Pointed Ears Mercenary Assassin Villainess - Agent Viper, Commander Veridia, Huntress Jade.jpeg
Humanoid Fae Elf Sentai Squad Princess Royal Green Armor Bodysuit Crown Pilot Freckles Cheeky - Princess Veridia, Emerald Ace, Midori Spark.jpeg
Humanoid Fae Elf Supernatural Celestial Priestess Cultist Leader Feather Headdress Halo Silver Hair Short Hair Tan Skin Purple Eyes Blue Dress Scarf Ceremonial - High Priestess Sainya, Oracle Aviana, Matriarch of the Sky.jpeg
Humanoid Fae Elf Wood Elf Rogue Pirate Merchant Gypsy Sorceress Nature Green Hair Paisley Skirt Corset Boots - Sylvi of the Woods, Jade the Drifter, Thalia Verdant.jpeg
Humanoid Fae Mystical Elf Green Hair Dark Skin Bohemian Romani Style Floral Embroidery Corset Jewelry Sorceress Fortune Teller Enchanter - Esmeralda the Seer, Zahra of the Wilds, Madame Verdant.jpeg
Humanoid Gladiator Warrior Mercenary Dark Skin Short Hair White Stone Armor Cracked Plating Bandages Shackles Chains Barefoot Dual Glowing Orange Swords Magma Blades - Tera the Unbroken, Kaelith Stone-Heart, Ignis the Liberated.jpeg
Humanoid Kaiju Lithoid Golems Infernals Elemental Magma Lava Rock Skin Spikes Tail Glowing Orange Energy - Volcanis, Magmadon, Obsidius.jpeg
Humanoid Mammalian Alien Biological Canine Vulpine Skull-Masked Bioluminescent Techno-Organic Radiant Cyber-Tribal Warrior Shaman Fenris-Prime Vulkahn-Apex Koda-Shaman.jpeg
Humanoid Mammalian Insectoid Hybrid Alien Mercs PMCs Warframe Tech-Enhanced Compound-Eyes Bat-Eared Bioluminescent Vesper-Tech Echo-Stalker Murid-Vanguard.jpeg
Humanoid Mammalian Organic-Biological Cronens Aberration Skull-Masked Cervine Antlered Fleshy Alien Biological Mercs Cultist Bone-Antlered Marauder Malakor-Stag Vile-Wendigo Ossis-Cervus.jpeg
Humanoid Mammalian Rodent Vermin Royal Crimson-Fur Bioluminescent Tech-Enhanced Slaver-Lord Pirate-King Rat-King Vermillion-Rex King-Rictus Lord-Vermyn.jpeg
Humanoid Mercs PMCs Military Commander Officer Zealots Celestials White Uniform Gold Trim Elite Soldier Spiky White Hair - Captain Solara, General Aurelia, Commander Weiss.jpeg
Humanoid Mutants Reptilian Behemoths Voltaic Brute Red Shell Spiked Carapace Gold Power Gauntlets Lightning Claws - Titanus Shell-Shock, Volt-Crusher, General Testudo.jpeg
Humanoid Mystical Sorceress Witch Infernal Fire Magic Afro Flame Hair Spiked Cape Staff Claws Dark Skin - High Priestess Ember, Madame Scorch, Ignis the Vile.jpeg
Humanoid Reptilian Alien Biological Hybrid Cyborg Construct Clockwork Automaton Mech-Saur Skull-Masked Ornate Noble Saurian-Tech Chrono-Saur Rex-Machina Gear-Talos.jpeg
Humanoid Reptilian Alien Biological Organized-Force Elite-Officer Bone-Crested Formal-Attire Scaled-Aristocrat Varkas-Noble High-Commander-Srex Envoy-Krell.jpeg
Humanoid Reptilian Arachnid Hybrid Alien Mercs PMCs Cyborg Warframe Chitinous Spined Multi-Eyed Bronze-Armored Cobalt-Stinger Vex-Slayer Krell-Vanguard.jpeg
Humanoid Sentai Squad Celestial Knight Warrior Green Armor Horned Helmet Dragon Motif Feathers Villain - General Viridius, Dragon Knight Ophis, Emerald Sentinel.jpeg
Humanoid Undead Organic-Biological Skeletal Cronens Mutant Aberration Pale-Skinned Bone-Exposed Mercs Cultist Marrow-Revenant Ossificus Grave-Stalker Bone-Thief.jpeg
Humanoid Undead Revenant Cultist Zealot Elite Warrior Masked Bone Face Purple Armor Gold Trim Red Eyes Cracked Visage - Lord Ossion, Inquisitor Morven, Vrak the Unseen.jpeg
Humanoid Void-Spawn Arachnid Infernal Knight Chitinous Armor Dark Warrior Multi-Eyed Helmet Horns Spider Web Greatsword Purple - Knight-Commander Araneae, Xyloth the Widow-Maker, Void-Blade Voros.jpeg
Humanoid Warframes Cyborgs Sentai Squad Female Silver Purple Armor Head Cables Horned Helmet Glowing Energy Axe - General Axia, Unit Chrome-Cleaver, Lady Mech-Valkyrie.jpeg
Humanoid_Akuma_Reptilian_Hybrid_Umbral_Sorceress_Purple_Black_Robes_Ornate_Horns_Pointed_Tail_Malissara_Xylanthe_Vexina.jpeg
Humanoid_Akuma_Reptilian_Infernal_Merc_Zealot_Krell_Varkas_Zorak.jpeg
Humanoid_Android_Synth_Celestial_Mechanical_Hardlight_Sword_Astraea_Lumina_Kaelis_ZING.jpeg
Humanoid_Android_Synth_Merc_Phantom_Construct_Elite_Operative_Acheron_Zero_Specter.jpeg
Humanoid_Anthro_Insects_Chitinous_Hybrid_Akuma_Merc_Zealot_Krixis_Xylos_Mantik.jpeg
Humanoid_Aquatic_Reptilian_Aquamancer_Chitinous_Zalthar_Venthos_Krayden.jpeg
Humanoid_Avian_Merc_PMC_Tactical_Armor_Gold_Beak_Mask_Silver_Hair_Talon_Zephyr_Corvus.jpeg
Humanoid_Celestial_Radiant_Cyborg_Infernals_Zealot_Aurelion_Solarius_Vulkis.jpeg
Humanoid_Composite_Aberration_Cronen_Cultist_Symbiotic_Legion_Chorus_Mnemosyne.jpeg
Humanoid_Composite_Aberration_Cultist_Cyborg_Zealot_Argus_Malphas_Kaelen.jpeg
Humanoid_Construct_Phantom_Yokai_Ethereal_Umbral_Clay_Statue_Kodama_Zenon_Vesper.jpeg
Humanoid_Cronen_Eldritch_Chitinous_Cultist_Aberration_Vilejaw_Shadowweaver_Malakor.jpeg
Humanoid_Cronen_Mutant_Warframe_Cyborg_Merc_Clay_Statue_Gnash_Vulkan_Krell.jpeg
Humanoid_Cultist_Zealot_Alchemist_Mystical_Bone_Mask_Green_Cloak_Glowing_Vials_Red_Hair_Kaelen_Vorus_Malakor.jpeg
Humanoid_Cyborg_Mechanical_Hybrid_Chitinous_Merc_Vex_Karr_Crimson_Stalk_Jax_Voss.jpeg
Humanoid_Cyborg_Mechanical_Hybrid_Merc_Chitinous_Tail_Heavy_Weapon_Vaxen_Karr_Rust_Tail_Crimson_Stalker.jpeg
Humanoid_Cyborg_Merc_PMC_Gold_Tactical_Armor_Red_Cyber_Eye_Jax_Korda_Vane.jpeg
Humanoid_Cyborg_Mutant_Warframe_Umbral_Merc_Akuma_Victor_Kain_Slasher_Vex_Draken_Kross.jpeg
Humanoid_Eldritch_Aberration_Arachnid_Multi_Eyed_Umbral_Grey_Skin_Tattered_Cloak_Sinister_Grin_Oculon_Hexsight_The_Grinning_Gaze.jpeg
Humanoid_Esper_Aberration_Alien_Arachnid-Trait_Multi-Eyed_Ocular_Bald_Pale_Iridescent_Fabric_Tactical_Observer_Argus_Vigil_Oculon.jpeg
Humanoid_Esper_Akuma_Mutant_Zealot_Sentai_Squad_Nova_Moxie_Vesper.jpeg
Humanoid_Esper_Cyborg_Merc_Heavy_Artillerist_Vara_Korr_Sela_Vex_Kaelith_Thorne.jpeg
Humanoid_Fae_Celestial_Warrior_Gold_Black_Armor_Orange_Hair_Pointed_Ears_Solara_Kaelith_Vespera.jpeg
Humanoid_Fae_Infernals_Akuma_Sentai_Squad_Pyra_Ember_Vex.jpeg
Humanoid_Fae_Merc_Scavenger_Red_Scarf_Leather_Armor_White_Hair_Pointed_Ears_Facial_Markings_Zarek_Voran_Kaelen.jpeg
Humanoid_Fae_Plantoid_Staff_Wielder_Mystical_Vera_Sylvana_Lyra.jpeg
Humanoid_Hardlight_Construct_Automaton_Ethereal_Umbral_Phantom_Zenon_Vesper_Aetheris.jpeg
Humanoid_Infernals_Esper_Merc_Cloaked_Kael_Ignis_Vahn.jpeg
Humanoid_Mechs_Automaton_Umbral_Akuma_Infernal_Knight_Obsidian_Vantablack_Shadow_Vanguard.jpeg
Humanoid_Plantoid_Cronens_Cyborg_Hybrid_Clay_Statue_Barkmaw_Rootjaw_Timber_Gnasher.jpeg
Humanoid_Reptilian_Akuma_Cyborg_Mutant_Merc_Clay_Statue_Korgath_Skall_Vrok.jpeg
Humanoid_Reptilian_Akuma_Merc_Pirate_Skarath_Rhogar_Vexis.jpeg
Humanoid_Reptilian_Akuma_Merc_Pirate_Vekar_Krosk_Zaliss.jpeg
Humanoid_Reptilian_Behemoth_Merc_Warlord_Krokdar_Skale_Sobek.jpeg
Humanoid_Reptilian_Chitinous_Infernal_Knight_Akuma_Lava_Vulkanis_Ignis_Skaal.jpeg
Humanoid_Reptilian_Cronen_Symbiotic_Chitinous_Aberration_Xylo_Krovax_Vorgon.jpeg
Humanoid_Reptilian_Xenomorph_Hybrid_Chitinous_Merc_Krovax_Zarik_Slyth.jpeg
Humanoid_Reptilian_Zealot_Gold_Spiked_Pauldrons_Red_Hood_Sobek_Krokos_Vrakkas.jpeg
Humanoid_Synth_Android_Cyborg_Merc_Lithoid_Elara_7_Unit_Vesper_Karys_Obsidian.jpeg
Humanoid_Synth_Cyborg_Warframe_Voltaic_Merc_Nyra_Kaelin_Vesper.jpeg
Humanoid_Synth_Ethereal_Crystalline_Merc_Staff_Wielder_Valara_Karis_Nyx.jpeg
Humanoid_Undead_Akuma_Reptilian_Mutant_Zealot_Malphas_Korthos_BoneStalker.jpeg
Humanoid_Undead_Infernal_Knight_Zealot_Skeletal_Merc_Ossis_Kharon_Mortivore.jpeg
Humanoid_Warframe_Akuma_Infernals_Cyborg_Heavy_Weapon_Vrok_Ignis_Malakor.jpeg
Mammalian_Humanoid_Hybrid_Merc_Chitinous-Armor_Hyena-Headed_Bronze-Plated_Pale-Eyes_Gnasher_Kharak_Bonebreaker.jpeg
Mutants Cyborgs Humanoid Horror Slasher Tattered Purple Coat Goggles Blade Arm Serrated Weapon Grin Canisters Experiment - The Splicer, Ripper Jack, Subject Smile.jpeg
ORGANIC BIOLOGICAL ANTHRO INSECTS HYBRIDS CEPHALOID HUMANOID CHITINOUS SYMBIOTIC INFERNAL KNIGHTS MANDIBLES TENTACLED ARMORED SOLDIER ORNATE RED-SKIN NOBLE WARRIOR Xylos the Grafted Commander Vral Malphas Void-Stalker.jpeg
ORGANIZED FORCES CULTISTS ZEALOTS SUPERNATURAL ESPERS MYSTICAL UMBRAL HUMANOID HOODED MASKED RUNIC SHADOW INFILTRATOR VOID AGENT ASSASSIN Kaelen-the-Silent Cipher-Nine Vorne-the-Veiled.jpeg
Organic - Biological - Aberrations - Mutants - Avian - Cronens - Raven Creature - Tentacle Maws - Exposed Ribs - Purple - The Carrion Horror, Subject Nevermore, The Gaping Corvid.jpeg
Organic - Chimeras - Aberrations - Quadruped - Reptilian - Purple Skin - Tail Maw - Spiked Mane - Beast - The Amphisbaena Horror, Subject Gemini, The Violet Mauler.jpeg
Organic - Cronens - Aberrations - Mutants - Humanoid - Multi-Mouthed - Eyeless - Tentacles - Exposed Muscle - Pale Skin - Claws - The Polymaw, Subject Flay, The Screaming Husk.jpeg
Organic - Cronens - Aberrations - Mutants - Quadruped - Massive Maw - Multi-Eyed - Pale Pink Skin - Fleshy - Tail - The Gluttonous Maw, Subject Gnash, The Poly-Ocular Beast.jpeg
Organic - Cronens - Parasites - Mutants - Humanoid - Fleshy - Multi-Eyed - Back Claws - Exposed Muscle - Pink Skin - The Flesh Weaver, Subject Parasitus, The Flayed Host.jpeg
Organic - Mutants - Aberrations - Reptilian - Humanoid - Yellow Skin - Spiked Spine - Multi-Mouthed - Tail - Subject Aurelius, The Gilded Horror, Xeno-Mutant Aurum.jpeg
Organic Anthro Insects Fae Humanoid Butterfly Wings Masked Assassin Black Suit Ring Blades Chakrams Pink Energy Villainess - Lady Lepidoptera, Agent Papillon, Vespera the Winged.jpeg
Organic Anthro Insects Insectoid Mantis Humanoid Crystalline Purple Armor Glowing Veins Scythes Wings Villainess - Crystal Mantis Vira, Commander Prism, Scythera the Violet.jpeg
Organic Behemoths Kaiju Reptilian Infernals Monster Dark Blue Skin Spikes Magma Mouth Glowing Veins Tail Claws - Titanus Obsidius, Magma-Goliath, The Dark Behemoth.jpeg
Organic Biological Anthro Insects Humanoid Chitinous Alien Species Organized Forces Zealots Cultists Green Exoskeleton Antennae Insectoid Warrior Ornate Tunic Geometric Patterns Segmented Tail_Vex-Zul.jpeg
Organic Biological Anthro Insects Insectoid Chitinous Voltaic Warrior Wasp Hornet Lancer Black Carapace Glowing Orange Orbs Wings Lightning Spear - General Vespion, Stinger Krizalid, Zz'Rot the Thunder-Lancer.jpeg
Organic Biological Aquatic Mutants Aberrations Beast Hybrid Shark Monster Glowing Green Veins Purple Pustules Armored Scales Sharp Teeth Fins - Tox-Maw, Abyssal Ravager, Subject Deep-Rot.jpeg
Organic Biological Humanoid Aquatic Reptilian Hybrid Mutants Aberration Axolotl-type Bioluminescent Gills Tail Hoodie Sweatpants Purple Orange_Taroited Thug_Neon-Fin Street-Stalker_Glow-Grip Amphibian.jpeg
Organic Biological Humanoid Lithoid Golem Construct Cyborg Behemoth Mercs PMCs Slavers Grey Rock-Skin Large Gears Shoulder-Gears Glowing Blue Chest-Core Industrial Tunic Heavy Gauntlets_Krog-Core_Gear-Crusher_Lithic Enforcer.jpeg
Organic Biological Humanoid Mammalian Bat-Type Mutants Cryptid Cultists Organized Forces Patterned Cape Leather Vest Goggles Fangs Tail_Vesperius_Nocturne Overseer_Gilded Wing Operative.jpeg
Organic Biological Humanoid Mammalian Mutants Behemoths Mercs Cultists Skull-Mask Bandaged-Arm Quilted-Vest Claws Tactical-Pants_Karn-the-Hollow_Bone-Wraith Enforcer_Vax-Skull Smasher.jpeg
Organic Biological Humanoid Mutants Undead Akuma Cyborg Behemoth Mercs Pirates Skull-Face Chainsaw-Arm Spiked-Back Purple Mutation_Skal-Vore Brute_Riptide Ravager_Gore-Saw Mercenary.jpeg
Organic Biological Humanoid Plantoid Alternative Biology Flora-based Ethereal Mystical Fae Radiant Iridescent Petal-Hair Ornate Tunic Swirling Pattern Botanical Entity_Aethel-Bloom_Chloris-Vae_Petal-Step Muse.jpeg
Organic Biological Humanoid Reptilian Aquatic Alien Species Scaled Barnacled Fin-Backed Iridescent Bronze Helmet Ornate Tunic Sea-Raider Pirate Mercenary_Vek-Shore Hunter_Cobalt Deep-Stalker_Gillum the Barnacled.jpeg
Organic Biological Humanoid Reptilian Chimera Hybrid Dragon Stag Antlers Green Scales Tail Runed Armor Heavy Axe Warrior Sentinel - General Cervidrake, Sentinel Verdrox, Sylvaris the Horned.jpeg
Organic Biological Humanoid Reptilian Chitinous Hybrid Mutants Slavers Pirates Behemoth Crustacean-Type Spiked Shell Metal Pincers Loungewear Robe_Biolanex Baron_Crag-Claw Tycoon_Shell-Shock Enforcer.jpeg
Organic Biological Humanoid Reptilian Cyborg Mercs Pirates Crocodile-Type Exposed Skeletal Frame Industrial Vest Cargo Pants Bronze Boots Fin-Cap_Krok-Back Raider_Scalerust Mercenary_Vile-Gator Outlaw.jpeg
Organic Biological Humanoid Reptilian Mammalian Hybrid Chimeras Symbiotic Fungal Spore-Host Crystalline Mercs Pirates Iridescent Scaled Spiked Gauntlet Tailored Alien Fabric High-Tech Suit_Vark-Splicer Mercenary_Zel-Tek Outlaw_Shard-Fist Raider.jpeg
Organic Biological Humanoid Reptilian Mammalian Hybrid Mutants Mercs PMCs Tactical Jacket Purple Scaled Armored Tail Cargo Pants_Violet Panther-Guard_Purple-Scale PMC_Shadow-Tail Mercenary.jpeg
Organic Biological Humanoid Xenomorph Hybrid Synths Android Cyborg Bio-Mechanical Exposed Musculature Eyeless Tooth-Grin Dark Purple Bronze Metallic Armor Tunic Assassin Mercenary_Vorex-9_Bronze-Smirk Slayer_Synthetic Hollow-Face.jpeg
Organic Biological Hybrid Kaiju Behemoth Mammalian Aquatic Cyborg Aberration Xenomorph Gaseous Iridescent Bubbles Armored Jaw Bioluminescent White Fur Quadrupedal Predator_Prism-Gorged Goliath_Aether-Bubble Stalker_Luminescent Ravager.jpeg
Organic Biological Mammalian Humanoid Cryptids Werewolf Wolf Undead Necromancer Skeletal Armor Skull Pauldrons Runes Tattered Coat Blue Fur Red Eyes - Fenrir the Bone-Breaker, Vargus Death-Howl, Lord Grim-Fang.jpeg
Organic Biological Mutants Aberrations Kaiju Reptilian Aquatic Monster Teal Skin Glowing Spots Multi-Eyed Crocodilian Sharp Teeth Claws - Gloom-Maw, Subject Biolum, The Abyssal Glutton.jpeg
Organic Biological Mutants Cronens Aberrations Humanoid Red Muscle Flayed Flesh Gold Armor Tentacles Multi-Eyed Bio-Weapon - Visceron, Subject Flay, Gore-Commander.jpeg
Organic Biological Mutants Cronens Chimeras Aberrations Humanoid Aquatic Red Flesh Muscle Flayed Crab Claws Pincers Tentacles Three Eyes Chains Brute - Subject Carcinos, The Red Ravager, Gore-Claw.jpeg
Organic Biological Plantoid Fae Elemental Humanoid Flower Head Large Pink Blue Petals Bark Body Roots Vines Moss Claws - Florax the Bloom-Walker, Petal-Maw, Verdantus.jpeg
Organic Biological Reptilian Mammalian Chimeras Mutants Cyborgs Beast Quadruped Red Scales Green Spikes Cybernetic Armor Hound - Subject R-9, Cyber-Warg, Cinder-Fang.jpeg
Organic Biological Reptilian Naga Cobra Sorcerer Mystic Zealot Red Robes Gold Trim Glowing Blue Runes Staff Wielder - High Priest Viperion, Grand Vizier Cobrus, Magus Ophiuchus.jpeg
Organic Biological Undead Mutants Aberrations Mammalian Humanoid Ape Simian Stitched Fur Nails Spikes Cage Mouth Yellow Eyes Voodoo Doll - Subject Pincushion, The Stitched Simian, Nail-Biter.jpeg
Organic Biological Xenomorph Reptilian Infernals Magma Pustules Behemoth Quadrupedal Monster Humanoid Mercenary Armored Knight Techno-Medieval Slayer Blue Plate Armor Cape Utility Belt_Magmaw_Cobalt Sentinel_Scorch-Scale Stalker.jpeg
Organic Cronens Aberrations Eldritch Void-Spawn Fleshy Nightmare Multi-Mouthed Multi-Armed Dark Skin Claws Spikes Mutation Body Horror - The Wailing Host, Vorax the Consumed, Abomination Omega.jpeg
Organic Cronens Mutants Aberrations Humanoid Fleshy Body Horror Pink Skin Multi-Mouthed Multi-Eyed Bloody Teeth Nightmare Abomination - Subject Omega, The Maw-Walker, Carnis the Devourer.jpeg
Organic Mutants Behemoths Humanoid Red Skin Muscular Brute Tusks Fangs Bald Scrap Armor Spiked Pads Wasteland Warrior - Grog the Smasher, Brutus Iron-Hide, Karg the Unstoppable.jpeg
Organic Mutants Cyborgs Reptilian Aberrations Beast Lizard Salamander Multi-Eyed Iridescent Purple Skin Tech Armor Orange Glow Spine Plating Fangs - Specimen Argus, The Chromatic Stalker, Cyber-Newt Delta.jpeg
Organic Mutants Cyborgs Reptilian Naga Serpent Aberrations Red Scales Skull Mask Multi-Eyed Cables Tech Loincloth Dagger - Subject Basilisk, Gorgon-X, Crimson Coil.jpeg
Organic Mutants Reptilian Humanoid Blue Skin Spots Bomber Jacket Backpack Drool Claws Tail Scavenger Mercenary Urban - Chomp the Courier, Scaly Jack, Blue-Tooth the Brute.jpeg
Organic_Biological_Aberrations_Behemoths_Primordials_Alternative_Biology_Amorphous_Radiant_Fractal_Beings_Iridescent_Tardigradoid_Larval_Aristocrat_Opalescent_Void-Spawn_Baron_Glub_Archduke_Yulth_Sovereign_Ooze.jpeg
Organic_Biological_Anthro_Insects_Chimeras_Spore-Hosts_Fungal_Chitinous_Humanoid_Aquatic_Crustacean_Warrior_Xylos_Krellis_Mycel-X.jpeg
Organic_Biological_Anthro_Insects_Humanoid_Chitinous_Beetle_Warrior_Krixis_Zhor_The_Carapace_Shellback_Vanguard.jpeg
Organic_Biological_Anthro_Insects_Xenomorphs_Humanoid_Chitinous_Arachnid_Bone_Armor_Spined_Predator_Varkas_The_Ivory_Stalker_Zithrak_White_Fang.jpeg
Organic_Biological_Chimeras_Hybrids_Behemoths_Reptilian_Avian_Chitinous_Lithoid_Bioluminescent_Armored_Shield-Bearer_Heavy_Tank_Gromal_Basilus_Vorgath-Prime.jpeg
Organic_Biological_Chimeras_Hybrids_Cronens_Xenomorphs_Humanoid_Aquatic_Chitinous_Mercs_PMCs_Bio-Integrated_Crustacean_Syrax_Varkon_Krell.jpeg
Organic_Biological_Chimeras_Hybrids_Crystalline_Lithoid_Cryomancers_Mammalian_Reptilian_Humanoid_Mercs_PMCs_Shard-Skin_Glacius_Krystor_Zevis.jpeg
Organic_Biological_Chimeras_Hybrids_Humanoid_Reptilian_Avian_Chitinous_Mercs_PMCs_Pirates_Winged_Saurian_Draxas_Krell_Vesper.jpeg
Organic_Biological_Cronens_Aberration_Humanoid_Alternative-Biology_Red-Flesh_Trumpet-Head_Spiked_Faceless_Sonic-Anatomy_Chitinous-Armor_Bio-Messenger_Cornetis_Sanguine-Echo_Flesh-Herald-2.jpeg
Organic_Biological_Cronens_Aberration_Humanoid_Alternative-Biology_Red-Flesh_Trumpet-Head_Spiked_Faceless_Sonic-Anatomy_Chitinous-Armor_Bio-Messenger_Cornetis_Sanguine-Echo_Flesh-Herald.jpeg
Organic_Biological_Cronens_Aberrations_Humanoid_Mutants_Multi_Mouthed_Fleshy_Cultist_Trident_Gulgoth_Mulg_The_Mouthed_Xul_The_Vessel-2.jpeg
Organic_Biological_Cronens_Aberrations_Humanoid_Mutants_Multi_Mouthed_Fleshy_Cultist_Trident_Gulgoth_Mulg_The_Mouthed_Xul_The_Vessel.jpeg
Organic_Biological_Cronens_Aberrations_Humanoid_Plantoid_Alien_Chitinous_Mercs_PMCs_Sonic_Bio-Acoustic_Sonus_Clarion_Bell-Head.jpeg
Organic_Biological_Cronens_Aberrations_Humanoid_Reptilian_Hybrid_Vertical_Eyes_Midsection_Maw_Tailed_Vorg_The_Void_Gullet_Xax_The_Four_Sighted_Zul_Gut_Maw.jpeg
Organic_Biological_Cronens_Aberrations_Hybrids_Humanoid_Multi-Eyed_Chest-Mouth_Mercs_PMCs_Pirates_Slavers_Xalth_Grak_Malacor.jpeg
Organic_Biological_Cronens_Aberrations_Plantoid_Humanoid_Cyborgs_Constructs_Artificial_Cybernetic_Torso_Mouth_Groth_The_Hollow_Wood_Blight_Wired_Maw_The_Fibrous_Vessel.jpeg
Organic_Biological_Cronens_Akuma_Infernal_Knights_Humanoid_Chitinous_Hybrids_Xenomorphs_Eldritch_Winged_Sovereign_Xalkor_Malphas_Vorgath.jpeg
Organic_Biological_Cronens_Akuma_Infernal_Knights_Humanoid_Hybrids_Cyborgs_Mercs_PMCs_Aristocrat_Armored_Heavy_Voris_Malphas_Grendel.jpeg
Organic_Biological_Cronens_Akuma_Infernal_Knights_Infernals_Humanoid_Chitinous_Reptilian_Hybrids_Armored_Lava-Core_Vanguard_Ignis-Thall_Magmarok_Vulkanis.jpeg
Organic_Biological_Cronens_Mutants_Chimeras_Hybrids_Humanoid_Arachnid_Cyborgs_Mercs_PMCs_Sentai_Squad_Striker_Vex_Karn-04.jpeg
Organic_Biological_Humanoid_Aquatic_Amphibian_Indigo_Spined_Merc_Glub_The_Tide_Hunter_Vulk_Deep_Bruiser_Kroth_Indigo_Spine.jpeg
Organic_Biological_Humanoid_Aquatic_Amphibian_Mercs_PMCs_Armored_Fish_Headed_Gloop_The_Heavy_Breather_Puff_The_Depth_Charger_Bubbles_Abyssal_Grunt.jpeg
Organic_Biological_Humanoid_Aquatic_Cephaloid_Aberrations_Cultist_Xalthus_The_Abyssal_Savant_Kray_Void_Octopus_Zul_The_Tide_Prophet.jpeg
Organic_Biological_Humanoid_Aquatic_Espers_Synths_Hybrid_Alien_Purple-Skin_Scaled-Jacket_Opal-Core_Biomechanical-Fabric_Water-Silk_Dorsal-Spines_Alir_Lypee-Ronk_Opal-Sovereign.jpeg
Organic_Biological_Humanoid_Aquatic_Reptilian_Alien_Fish-Lipped_Green-Skin_Purple-Plate-Armor_Rope-Sash_Gill-Maw_Murk-Stalker_Piscis-Guile.jpeg
Organic_Biological_Humanoid_Avian_Organized_Forces_Sentai_Squad_Mercs_PMCs_Dual_Wielding_Swordsman_Plated_Armor_Kage_The_Void_Blade_Vultrex_Raven_Edge_Zinx_The_Shadow_Ronin.jpeg
Organic_Biological_Humanoid_Mammalian_Parasites_Aberrations_Fae_Yokai_Mercs_PMCs_Sentai_Squad_Deceptive_Tactical_Mascot_Zipper_Barkley_Vicious-Pup.jpeg
Organic_Biological_Humanoid_Reptilian_Akuma-Trait_Grey-Scales_Eyeless_Serrated-Maw_Plated-Spine_Layered-Cloak_Formal-Merc_Malakhor_Void-Grin_Stone-Scale.jpeg
Organic_Biological_Humanoid_Reptilian_Aquatic_Alien_Merc_Iridescent-Skin_Purple-Teal-Scales_Pointed-Ears_Bronze-Tactical-Suit_Staff-Wielder_Vespera_Nyx-Blade_Kora-Void.jpeg
Organic_Biological_Humanoid_Reptilian_Cyborgs_Mercs_PMCs_Pirates_Saurian_Tactical_Heavy_Rexis_Grendel_Varkas.jpeg
Organic_Biological_Humanoid_Reptilian_Infernal_Knights_Zealots_Chitinous_Scaled_Elite_Soldier_Aurelius_Drakon_Zalthar.jpeg
Organic_Biological_Humanoid_Reptilian_Infernal_Knights_Zealots_Chitinous_Scaled_Elite_Soldier_Aurelius_Drakon_Zalthar_2.jpeg
Organic_Biological_Humanoid_Reptilian_Scaled_Bipedal_Merc_Saurian_Krazar_VileScale_Sauris.jpeg
Organic_Biological_Insectoid_Aberration_Amorphous_Iridescent_Multipedal_Segmented_Larval_Faceless_Sphincter-Maw_Ornate-Robes_Armored-Greaves_Glimmer-Grub_Vorax_Mollusoid-Prime.jpeg
Organic_Biological_Mammalian_Humanoid_Merc_Cyborg-Trait_Lion-Headed_Mane_Muscular_Armored-Tail_Tactical-Vest_Leonine_Leoric_Regis-Fang.jpeg
Organic_Biological_Mutant_Merc_Humanoid_Reptilian_Rhino-Horned_Serrated-Maw_Muscular_Orange-Mottled-Skin_Spiked-Nape_Rhino-Vex_Gore-Saur_Hard-Hide.jpeg
Organic_Biological_Mutants_Hybrids_Aberrations_Humanoid_Mammalian_Mercs_PMCs_Pirates_Feline_Multi-Eyed_Bast_Raksha_Valcor.jpeg
Organic_Biological_Parasites_Symbiotic_Hybrid_Humanoid_Insectoid_Chitinous_Composite_Mandibles_Host-Taker_Segmented-Tail_Larval-Headdress_Ornate-Robes_Scolopendros_Marrow-Worm_Exarch-Vark.jpeg
Organic_Biological_Reptilian_Humanoid_Behemoth_Merc_Chitinous-Armor_Dorsal-Spines_Green-Scales_Heavy-Tail_Leather-Trench_Crocodilian_Scaleshot_Krokos_Iron-Hide.jpeg
Organic_Biological_Xenomorphs_Anthro_Insects_Humanoid_Chitinous_Cephaloid_Dimensional_Cosmic_Void_Spawn_Umbral_Hooded_Assassin_Xurax_The_Shadow_Mantle_Vilespawn_Void_Reaper_Krell_The_Ebon_Stalker.jpeg
Organic_Hybrid_Akuma_Infernals_Humanoid_Mammalian_Reptilian_Merc_Wolf-Dragon_Horned_Fedora_Waistcoat_Clawed_Glowing-Eyes_Vargos_Dapper-Fang_Brimstone-Dandy.jpeg
Organic_Hybrid_Chimera_Aberration_Arachnid_Reptilian_Chitinous_Multi-Limbed_Scythe-Legs_Spiked-Carapace_Hunchbacked_Predatory_Mottled-Skin_Arachnosaur_Skitter-Maw_Chitin-Stalker.jpeg
Organic_Hybrid_Humanoid_Reptilian_Avian_Warrior_Feathered-Raptor_Scale-Skin_Plated-Armor_Predatory_T-Zharr_Kestrel-Fang_Vorn-Stalker.jpeg
Organic_Mutant_Aberration_Humanoid_Reptilian_Chitinous-Spikes_Bumpy-Green-Skin_Manic-Grin_Bulging-Eyes_Spiked-Carapace_Glee-Maw_Spike-Grin_Chuckles.jpeg
Organic_Mutant_Hybrid_Humanoid_Avian_Aquatic_Plantoid_Merc_Duck-Billed_Moss-Skin_Spiked-Back_Quack-Shot_Moss-Beak_Bill-The-Beast.jpeg
Organic_Mutant_Hybrid_Humanoid_Reptilian_Aquatic_Gharial-Headed_Long-Snout_Spiked-Shoulders_Green-Scales_Thick-Tail_Tactical-Scientist_Dr-Zoran_Gharial-Void_Saurian-Physician.jpeg
Organized Forces - Mercs:PMCs - Humanoid - Commander - White Hair - Tan Skin - Freckles - Yellow Eyes - Cape - Black Leather - General Zara, Captain Solstice, Commander Vane.jpeg
Organized Forces - Mercs:PMCs - Humanoid - Samurai - Swordswoman - Tan Skin - Long Black Ponytail - Red and White Armor - Katana - Blade Mistress Kaori, Ronin Akane, Swordmaster Yumi.jpeg
Organized-Forces_Humanoid_Mammalian_Behemoth_Warlord_Crowned_Muscular_Facial-Markings_Bald_Tactical-Vest_Zygard_Imperator-Z_Throne-Crusher.jpeg
Organized-Forces_Humanoid_Mercs-PMCs_Alien_Humanoid_Tactical_Pointed-Ears_Shaved-Side-Head_Blue-Eyes_Waistcoat_Heavy-Artillery_Canon-Wielder_Vesper_Kaelith_Artemis-Void.jpeg
Reptilian Fae Imp Gremlin Creature Blue Skin Scales Large Ears Tail Sharp Teeth Mischievous Minion - Skreech the Pest, Echo the Runt, Snicker the Vile.jpeg
Reptilian Humanoid Aquatic Dragon Draconian Aquamancer Hybrid Warrior Blue Scales Fins Azurion Thalassor Hydrax.jpeg
Reptilian Humanoid Dragon Creature Orange Scales Long Pointed Snout Muscular Tail Claws Infernals Fire Monster - Vaskor the Piercer, Ignis Fang, Solaris Drake.jpeg
Sentai Squad Humanoid Akuma Demon Armored Knight Villain Masked Horned Cape Long Black Hair Braid Cyan Glow Tech Suit - General Galacton, Dark Knight Vex, Commander Tekno-Oni.jpeg
Sentai Squad Humanoid Infernal Knights Armored Villainess Beetle Horns Red Cape Flaming Spear Glaive Black Red Silver Suit High Collar - General Elytra, Crimson Sentinel, Commander Stag-Flame.jpeg
Sentai Squad Humanoid Supernatural Elemental Green Fire Magic Knight Red Bodysuit Sword Blonde Hair Energy Aura - Captain Wildfire, Solaris the Emerald, Commander Blaze.jpeg
Supernatural - Infernal Knights - Humanoid - Dark Knight - Bloodied Plate Armor - Red Cape - Masked - Black Ponytail - Glowing Red Eyes - General Scarlet, The Sanguine Sentinel, Knight-Captain Vorona.jpeg
Supernatural - Mystical - Akuma - Humanoid - Demon - Horned - Blue Skin - Green Armor - Feathered Shoulders - Sorcerer - Lord Malakor, High Warlock Zareth, Prince Vaelen.jpeg
Supernatural - Mystical - Akuma - Humanoid - Demon - Horned - Short Cyan Hair - Purple Bodysuit - High Collar - Villainess - Zylah, Vespera, Agent Nyx.jpeg
Supernatural - Mystical - Akuma - Humanoid - Demon - Horned - Short Green Hair - Trench Coat - High Collar - Villainess - Commander Vex, General Jade, Baroness Malice.jpeg
Supernatural - Mystical - Eldritch - Organic - Aberrations - Humanoid - Multi-Eyed - Chest-Maw - Split Torso - Antlers - Dark Purple Skin - The Oculus Host, Void-Stalker Xal, The Weeping Maw.jpeg
Supernatural - Mystical - Eldritch - Organic - Aberrations - Mutants - Humanoid - Purple Skin - Multi-Eyed Torso - Yellow Eyes - Muscular - The Argos Hulk, Subject Panoptes, The Violet Gazer.jpeg
Supernatural - Mystical - Fae - Humanoid - Shaman - Feather Crown - Silver Hair - Purple Eyes - White Scarf - High Priestess Avia, Shamaness Lirien, Ciela the Wind-Walker.jpeg
Supernatural - Mystical - Humanoid - Elf - Rogue - Green Wavy Hair - Tan Skin - Green Outfit - Leather Armor - Belt Pouches - Sylara the Swift, Rogue Vanya, Kiera the Scout.jpeg
Supernatural - Mystical - Humanoid - Elf - Sorceress - Mage - Gothic Attire - Pink Hair - Glasses - Crystal Staff - Dark Caster - Lace Details - Magus Elara, Scholar Vexia, Kaelie the Dark Archivist.jpeg
Supernatural - Mystical - Humanoid - Elf - Villainess - Green Wavy Hair - Tan Skin - Green Gown - High Slit - Black Corset - Lady Veridia, Countess Sylvana, Mistress Jade.jpeg
Supernatural - Mystical - Infernal Knights - Umbral - Humanoid - Dark Plate Armor - Glowing Purple Runes - Spiked Helmet - Cape - Valdor the Void-Bound, The Runed Sentinel, Knight of the Violet Abyss.jpeg
Supernatural - Undead - Constructs - Humanoid - Skull Mask - Doll Heads - Feathered Armor - Exposed Spine - The Porcelain Harvester, Marionette of the Void, Doll-Master Vex.jpeg
Supernatural Akuma Demon Humanoid Horned Green Hair Black Leather Armor Whip Cape Runes - Lady Veridiana, Malphasia the Scourge, Commandant Vesper.jpeg
Supernatural Akuma Demon Humanoid Horned Green Hair Black Leather Corset Fishnets Dominatrix Succubus - Mistress Xylia, Vex the Tormentor, Roxy the Ruthless.jpeg
Supernatural Akuma Demon Humanoid Purple Skin Pointed Ears Flamboyant Robes Peacock Feathers Cape Staff Sorcerer Trickster Noble Jewelry - Lord Pavus, High Vizier Malichor, The Gilded Deceiver.jpeg
Supernatural Akuma Demon Humanoid Red Skin Horned Infernal Knight Armored Villainess Cape Ponytail - General Vermilion, Lady Hellfire, Baroness Cinder.jpeg
Supernatural Akuma Fae Humanoid Red Hair Short Bob Yellow Eyes Fangs Pointed Ears Pinstripe Sleeveless Turtleneck Smug Grin Urban Fantasy Villainess - Scarlet Vane, Beatrix the Biter, Crimson Jester.jpeg
Supernatural_Akuma_Infernal-Knight_Organized-Forces_Merc_Humanoid_Reptilian_Cyborg_Hybrid_Skull-Helm_Horned_Green-Skin_Red-Eyes_Tactical-Suit_Spinal-Plate_Grim-Skull_Vorthos_Marrow-Stalker.jpeg
Supernatural_Mystical_Aberrations_Humanoid_Dimensional_Cosmic_Mirror_Entities_Composite_Multi_Faced_Ornate_Bronze_The_Chorus_Matriarch_Visage_Oracle_Xara_The_Many_Faced_Sovereign.jpeg
Supernatural_Mystical_Aberrations_Humanoid_Dimensional_Cosmic_Mirror_Entities_Surreal_Tooth_Head_Cane_Jewel_Tone_The_Editor_Vox_Paper_Maw_Baron_News_Bite.jpeg
Supernatural_Mystical_Celestials_Dimensional_Cosmic_Primordials_Elemental_Entities_Photonic_Lithoid_Humanoid_Zealots_Gilded_Spine_Core_Aurelius_The_Starbound_Solarix_Prime_The_Sun_King_Archon.jpeg
Supernatural_Mystical_Cryptid_Fae_Undead_Hybrid_Humanoid_Mammalian_Forest-Dweller_Skull-Mask_Antlered_Furry_Clawed_Exposed-Ribs_Leather-Satchel_Mossy-Woods_Leshy_Marrow-Thief_Wendigo-Wild.jpeg
Supernatural_Mystical_Esper_Akuma_Aberration_Mutant_Void-Spawn_Humanoid_Cyclopean_Single-Eyed_Purple-Skin_Glowing-Runes_Sigil-Etched_Skeletal-Maw_Exposed-Teeth_Tactical_Monoculus_Kharon_Rune-Gaze.jpeg
Supernatural_Mystical_Undead_Aberration_Celestials-Trait_Humanoid_Ethereal_Cyclopean_Skeletal-Maw_Bone-Spikes_Halo-Ring_Ornate-Suit_Baron-Marrow_Vizier-Void_Lord-Ocularis.jpeg
Supernatural_Mystical_Yokai_Phantoms_Cultists_Humanoid_Composite_Mask-Faced_Multi-Visage_Script-Skin_Ornate-Robes_Many-Faced_Sutra-Stalker_Chorus.jpeg
Supernatural_Undead_Akuma_Chimera_Hybrid_Humanoid_Mammalian_Skull-Mask_Antlered_Bat-Wings_Exposed-Ribcage_Golden-Armor_Clawed_Fur_Malphas_Wendigo-Prime_Bone-Herald.jpeg
Undead - Liches - Reptilian - Naga - Blue Skull Face - Steampunk Vest - Gears - Glowing Red Veins - Runed Headpiece - Chief Justice Mortis, Magistrate Coil, The Runed Arbiter.jpeg
Undead Necromantic Cyborgs Mutants Skeleton Skull Glowing Core Pipes Exhaust Tattered Coat Bandages Industrial Experiment - Subject Lazarus, Grave-Walker Prime, The Iron Revenant.jpeg
Undead Necromantic Mutants Chimeras Humanoid Reanimated Stitched Skin Wolf Helm Banners Flags Gladiator Chains Armored Beast - Standard Bearer Rot, Stitch-Wolf the Undying, Grave-Guard Gorn.jpeg
Undead Necromantic Plantoid Behemoths Swamp Monster Green Mossy Skin Sludge Giant Bone Weapon Skulls Glowing Eyes Tentacle Hair Brute - Dredge the Undying, Rot-Root the Smasher, Golgotha of the Bog.jpeg
Undead:Necromantic - Mutants - Cyborgs - Humanoid - Skull Face - Spiked Trench Coat - Blade Arm - Claw Hand - Heavy Metal Plating - Subject Razor-Skull, The Grave Butcher, Unit 7 Shredder.jpeg
Undead:Necromantic - Undead - Liches - Humanoid - Skeleton - Bone Cage Skirt - Golden Crown - Glowing Amber Core - Feathered Shoulders - Queen Ossia, The Gilded Matriarch, Lich Empress Aurelia.jpeg
Undead:Necromantic - Wraiths - Elemental Entities - Umbral - Humanoid - Pale Queen - Blonde Hair - Tattered Purple Gown - Crown - Energy Scythe - Queen Morana, Lady Sepulchra, Wraith-Empress Valeri.jpeg
Undead_Necromantic_Hybrid_Infernal-Knight_Humanoid_Reptilian_Bone-Plated_Exposed-Spine_Skull-Helm_Red-Skin_Muscular_Marrow_Ossian_Drakon.jpeg
Undead_Plantoid_Hybrid_Humanoid_Fae_Organic_Biological_Necromantic_Nature_Wraith_Revenant_Thornheart_Kalgor_Rotvale.jpeg
Yokai Mammalian Supernatural Aberration Chimera Umbral Ritual Bell-Bearer Toothy Beast Gong-Maw Suzu-Kitsune Vesper-Beast.jpeg
grok-video-7518d697-d159-4f8d-98f3-16c9b3c7dff8.mp4
humanoid_akuma_aberration_eldritch_void_spawn_runic_maw_malphas_vorax_zhalkhor.jpeg
humanoid_akuma_umbral_cultist_officer_red_trenchcoat_vladimira_beatrice_malicia.jpeg
humanoid_esper_photonic_mystical_warrior_teal_hair_magenta_armor_valeriana_nyxara_lyra_volt.jpeg
humanoid_fae_infernal_elemental_fire_mystic_ignis_pyrra_solara.jpeg
humanoid_fae_mystical_umbral_regal_sorceress_purple_hair_gold_collar_morgana_voss_selene_nightshade_elara_duskborn.jpeg
humanoid_fae_umbral_mystical_noble_intellectual_white_hair_monocle_vespera_miranda_isolde.jpeg
humanoid_mechanical_warframe_automaton_construct_purple_plasma_cannon_vector_prime_aegis_ix_sentinel_pulse.jpeg
humanoid_reptilian_fae_hybrid_merc_warrior_desert_wanderer_white_hair_kaldor_jax_sethos.jpeg
reptilian_chitinous_humanoid_hybrid_behemoth_armored_spiked_shell_krodar_shellback_gatorbane.jpeg
stevencasteel@Stevens-Mac-mini ESPER ELFY CHARACTERS % 

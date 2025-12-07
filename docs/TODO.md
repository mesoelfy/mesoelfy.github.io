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

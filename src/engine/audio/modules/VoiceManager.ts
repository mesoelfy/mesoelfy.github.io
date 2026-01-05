import { AudioContextManager } from './AudioContextManager';
import { SoundBank } from './SoundBank';
import { AudioMixer } from './AudioMixer';
import { AudioKey } from '@/engine/config/AssetKeys';
import { AUDIO_MANIFEST } from '@/engine/config/assets/AudioManifest';
import { SYS_LIMITS } from '@/engine/config/constants/SystemConstants';
import { MUSIC_PLAYLIST } from '@/engine/config/assets/MusicManifest';

class MusicDeck {
  public element: HTMLAudioElement | null = null;
  public source: MediaElementAudioSourceNode | null = null;
  public gain: GainNode | null = null;
  public stopTimer: ReturnType<typeof setTimeout> | null = null;
  private outputNode: AudioNode | null = null;
  private ctx: AudioContext | null = null;

  public init(ctx: AudioContext, output: AudioNode) {
    this.ctx = ctx;
    this.outputNode = output;

    if (!this.element && typeof window !== 'undefined' && typeof Audio !== 'undefined') {
        this.element = new Audio();
        this.element.crossOrigin = "anonymous";
        this.element.loop = false;
    }

    if (!this.element) return;

    if (!this.gain) {
        this.gain = ctx.createGain();
        this.gain.gain.value = 0; 
        this.gain.connect(output);
    }

    if (!this.source) {
        try {
            this.source = ctx.createMediaElementSource(this.element);
            this.source.connect(this.gain);
        } catch (e) {
            console.warn("[MusicDeck] Failed to create MediaElementSource:", e);
        }
    }
  }

  public load(url: string) {
    if (this.element) {
        this.element.crossOrigin = "anonymous";
        this.element.src = url;
        this.element.load();
    }
  }

  public play() {
    this.cancelStop();
    if (this.ctx && this.outputNode) {
        this.init(this.ctx, this.outputNode);
    }
    if (this.element) {
        this.element.play().catch(e => {
            console.warn("[MusicDeck] Play blocked or failed:", e);
        });
    }
  }

  public stop() {
    this.cancelStop();
    if (this.element) {
        this.element.pause();
        this.element.currentTime = 0;
    }
  }

  public cancelStop() {
    if (this.stopTimer) {
        clearTimeout(this.stopTimer);
        this.stopTimer = null;
    }
  }

  public fadeTo(value: number, duration: number, ctx: AudioContext) {
    if (!this.gain) return;
    const now = ctx.currentTime;
    try {
        this.gain.gain.cancelScheduledValues(now);
        this.gain.gain.setValueAtTime(this.gain.gain.value, now);
        this.gain.gain.linearRampToValueAtTime(value, now + duration);
    } catch (e) {
        this.gain.gain.value = value;
    }
  }
}

export class VoiceManager {
  private activeCount = 0;
  private currentAmbienceNode: AudioBufferSourceNode | null = null;
  private currentAmbienceGain: GainNode | null = null; 
  private currentAmbienceKey: string | null = null;

  // --- MUSIC SYSTEM ---
  private deckA = new MusicDeck();
  private deckB = new MusicDeck();
  private activeDeck: 'A' | 'B' | null = null;
  
  private playlist: string[] = [...MUSIC_PLAYLIST];
  private deck: number[] = []; // Indices of playlist
  private currentIndex = 0;
  private isShuffled = false;
  private isMusicInit = false;

  constructor(
    private ctxManager: AudioContextManager,
    private bank: SoundBank,
    private mixer: AudioMixer
  ) {
    // Initialize deck linearly: [0, 1, 2, ... 24]
    this.deck = this.playlist.map((_, i) => i);
  }

  // --- SFX LOGIC ---
  public playSFX(key: AudioKey, pan: number = 0) {
    if (this.activeCount >= SYS_LIMITS.MAX_POLYPHONY) return;
    const ctx = this.ctxManager.ctx;
    const buffer = this.bank.get(key);
    const recipe = AUDIO_MANIFEST[key];
    if (!ctx || !this.mixer.sfxGain || !buffer || !recipe) return;

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    if (recipe.pitchVariance > 0) {
        source.detune.value = (Math.random() * recipe.pitchVariance * 2) - recipe.pitchVariance;
    }
    const panner = ctx.createStereoPanner();
    panner.pan.value = Math.max(-1, Math.min(1, Number.isFinite(pan) ? pan : 0));
    source.connect(panner);
    panner.connect(this.mixer.sfxGain);
    source.onended = () => { this.activeCount--; };
    this.activeCount++;
    source.start();
  }

  // --- AMBIENCE LOGIC ---
  public playAmbience(key: AudioKey) {
    const ctx = this.ctxManager.ctx;
    if (!ctx || !this.mixer.ambienceGain) return;
    if (this.currentAmbienceKey === key && this.currentAmbienceNode) return;

    if (this.currentAmbienceNode && this.currentAmbienceGain) {
        const oldGain = this.currentAmbienceGain;
        const oldNode = this.currentAmbienceNode;
        try {
            oldGain.gain.cancelScheduledValues(ctx.currentTime);
            oldGain.gain.setValueAtTime(oldGain.gain.value, ctx.currentTime);
            oldGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.0);
            oldNode.stop(ctx.currentTime + 1.1);
        } catch {}
    }

    const buffer = this.bank.get(key);
    if (!buffer) return;
    const source = ctx.createBufferSource();
    source.buffer = buffer; 
    source.loop = true;
    const fadeGain = ctx.createGain();
    fadeGain.gain.setValueAtTime(0, ctx.currentTime);
    fadeGain.gain.linearRampToValueAtTime(1.0, ctx.currentTime + 2.0); 
    source.connect(fadeGain); 
    fadeGain.connect(this.mixer.ambienceGain); 
    source.start();
    this.currentAmbienceNode = source; 
    this.currentAmbienceGain = fadeGain; 
    this.currentAmbienceKey = key;
  }

  // --- MUSIC SYSTEM ---
  
  public startMusic() {
    const ctx = this.ctxManager.ctx;
    if (!ctx || !this.mixer.musicGain) return;

    if (!this.isMusicInit) {
        this.deckA.init(ctx, this.mixer.musicGain);
        this.deckB.init(ctx, this.mixer.musicGain);
        
        const attachListener = (deck: MusicDeck) => {
            if (deck.element) {
                deck.element.addEventListener('ended', () => {
                    console.log("[Music] Track Ended - Auto Advancing");
                    this.advanceTrack(true);
                });
                deck.element.addEventListener('error', (e) => {
                    const src = deck.element?.src || 'unknown';
                    console.warn(`[Music] Track Error on ${src.split('/').pop()}:`, e);
                    setTimeout(() => {
                        this.advanceTrack(true);
                    }, 1000);
                });
            }
        };
        
        attachListener(this.deckA);
        attachListener(this.deckB);
        
        this.isMusicInit = true;
        // Start at index 0 (Linear)
        this.playTrack(0);
    }
  }

  public nextTrack() {
    this.advanceTrack(false);
  }

  private advanceTrack(auto: boolean) {
    this.currentIndex++;

    // 1. Deck Exhausted? Reset & Full Shuffle
    if (this.currentIndex >= this.deck.length) {
        console.log('[Music] Deck Exhausted. Reshuffling Full Deck.');
        this.shuffleDeckRange(0, this.deck.length);
        this.currentIndex = 0;
        // Ensure we don't play the same song twice back-to-back on wrap
        if (this.deck[0] === this.deck[this.deck.length - 1]) {
             // Swap first with second
             [this.deck[0], this.deck[1]] = [this.deck[1], this.deck[0]];
        }
    } 
    // 2. Manual Shuffle Trigger? Shuffle Remaining Only
    else if (!auto && !this.isShuffled) {
        console.log('[Music] Manual Intervention. Shuffling Remaining Tracks.');
        this.isShuffled = true;
        // Shuffle everything from currentIndex to end
        this.shuffleDeckRange(this.currentIndex, this.deck.length);
    }

    this.playTrack(this.currentIndex);
  }

  /**
   * Fisher-Yates Shuffle on a slice of the deck in-place
   */
  private shuffleDeckRange(start: number, end: number) {
    for (let i = end - 1; i > start; i--) {
        const j = Math.floor(Math.random() * (i - start + 1)) + start;
        [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
    }
  }

  private playTrack(deckIndex: number) {
    const ctx = this.ctxManager.ctx;
    if (!ctx) return;

    if (this.deck.length === 0 || deckIndex >= this.deck.length) return;
    
    // Map Deck Index -> Playlist URL
    const realIndex = this.deck[deckIndex];
    const nextUrl = this.playlist[realIndex];

    const nextDeck = this.activeDeck === 'A' ? this.deckB : this.deckA;
    const currentDeck = this.activeDeck === 'A' ? this.deckA : this.deckB;

    console.log(`[Music] Playing Deck[${deckIndex}] -> Track[${realIndex}]: ${nextUrl.split('/').pop()}`);

    // Load & Play Next
    nextDeck.load(nextUrl);
    nextDeck.play();
    
    // Crossfade
    const FADE_TIME = 2.0; 
    nextDeck.fadeTo(1.0, FADE_TIME, ctx);
    
    if (this.activeDeck) {
        currentDeck.cancelStop();
        currentDeck.fadeTo(0.0, FADE_TIME, ctx);
        currentDeck.stopTimer = setTimeout(() => {
            currentDeck.stop();
        }, FADE_TIME * 1000);
    }

    this.activeDeck = this.activeDeck === 'A' ? 'B' : 'A';
  }

  public stopAll() {
    this.deckA.stop();
    this.deckB.stop();
    if (this.currentAmbienceNode) { 
        try { this.currentAmbienceNode.stop(); } catch {} 
        this.currentAmbienceNode = null; 
        this.currentAmbienceGain = null;
        this.currentAmbienceKey = null; 
    }
    this.activeCount = 0;
  }
}

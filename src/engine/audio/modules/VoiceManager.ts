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
  private outputNode: AudioNode | null = null;
  private ctx: AudioContext | null = null;

  public init(ctx: AudioContext, output: AudioNode) {
    this.ctx = ctx;
    this.outputNode = output;

    // Lazy create Audio element if missing
    if (!this.element && typeof window !== 'undefined' && typeof Audio !== 'undefined') {
        this.element = new Audio();
        this.element.crossOrigin = "anonymous";
        this.element.loop = false;
    }

    if (!this.element) return;

    // Create Graph Nodes if missing
    if (!this.gain) {
        this.gain = ctx.createGain();
        this.gain.gain.value = 0; // Start silent
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
        // Reset crossOrigin to be safe
        this.element.crossOrigin = "anonymous";
        this.element.src = url;
        this.element.load();
    }
  }

  public play() {
    // Re-verify graph integrity before playing
    if (this.ctx && this.outputNode) {
        this.init(this.ctx, this.outputNode);
    }

    if (this.element) {
        this.element.play().catch(e => console.warn("[MusicDeck] Play blocked", e));
    }
  }

  public stop() {
    if (this.element) {
        this.element.pause();
        this.element.currentTime = 0;
    }
  }

  public fadeTo(value: number, duration: number, ctx: AudioContext) {
    if (!this.gain) return;
    const now = ctx.currentTime;
    this.gain.gain.cancelScheduledValues(now);
    this.gain.gain.setValueAtTime(this.gain.gain.value, now);
    this.gain.gain.linearRampToValueAtTime(value, now + duration);
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
  private currentIndex = 0;
  private isShuffled = false;
  private isMusicInit = false;

  constructor(
    private ctxManager: AudioContextManager,
    private bank: SoundBank,
    private mixer: AudioMixer
  ) {}

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
        
        // Auto-advance listeners
        const attachListener = (deck: MusicDeck) => {
            if (deck.element) {
                deck.element.addEventListener('ended', () => this.advanceTrack(true));
            }
        };
        attachListener(this.deckA);
        attachListener(this.deckB);
        
        this.isMusicInit = true;
        this.playTrack(0);
    }
  }

  public nextTrack() {
    this.advanceTrack(false);
  }

  private advanceTrack(auto: boolean) {
    if (!auto && !this.isShuffled) {
        this.shufflePlaylist();
        this.isShuffled = true;
        this.currentIndex = 0; 
    } else {
        this.currentIndex = (this.currentIndex + 1) % this.playlist.length;
    }
    this.playTrack(this.currentIndex);
  }

  private shufflePlaylist() {
    for (let i = this.playlist.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [this.playlist[i], this.playlist[j]] = [this.playlist[j], this.playlist[i]];
    }
    console.log('[VoiceManager] Playlist Shuffled');
  }

  private playTrack(index: number) {
    const ctx = this.ctxManager.ctx;
    if (!ctx) return;

    const nextUrl = this.playlist[index];
    const nextDeck = this.activeDeck === 'A' ? this.deckB : this.deckA;
    const currentDeck = this.activeDeck === 'A' ? this.deckA : this.deckB;

    console.log(`[Music] Playing [${index}]: ${nextUrl.split('/').pop()}`);

    // Load & Play Next
    nextDeck.load(nextUrl);
    nextDeck.play();
    
    // Crossfade
    const FADE_TIME = 3.0;
    nextDeck.fadeTo(1.0, FADE_TIME, ctx);
    
    if (this.activeDeck) {
        currentDeck.fadeTo(0.0, FADE_TIME, ctx);
        setTimeout(() => currentDeck.stop(), FADE_TIME * 1000);
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

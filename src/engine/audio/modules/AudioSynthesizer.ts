import { SoundDef } from '@/engine/config/assets/AudioManifest';

export class AudioSynthesizer {
  
  public static async generate(recipe: SoundDef): Promise<AudioBuffer | null> {
    if (typeof window === 'undefined') return null;

    const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return null;

    const OfflineContextClass = (window as any).OfflineAudioContext || (window as any).webkitOfflineAudioContext;
    if (!OfflineContextClass) return null;

    const sampleRate = 44100;
    const length = Math.ceil(sampleRate * recipe.duration);
    
    if (length <= 0) return null;

    const offline = new OfflineContextClass(1, length, sampleRate);

    const mainGain = offline.createGain();
    mainGain.connect(offline.destination);
    
    const attack = recipe.attack || 0.005; 
    
    mainGain.gain.setValueAtTime(0, 0);
    mainGain.gain.linearRampToValueAtTime(recipe.volume, attack);
    
    if (recipe.duration < 10.0) {
        mainGain.gain.exponentialRampToValueAtTime(0.01, recipe.duration);
    } else {
        mainGain.gain.setValueAtTime(recipe.volume, recipe.duration);
    }

    let outputNode: AudioNode = mainGain;

    if (recipe.distortion) {
        const shaper = offline.createWaveShaper();
        shaper.curve = this.makeDistortionCurve(recipe.distortion);
        shaper.connect(outputNode);
        outputNode = shaper; 
    }

    if (recipe.tremolo) {
        const tremoloNode = offline.createGain();
        tremoloNode.connect(outputNode);
        outputNode = tremoloNode;

        const lfo = offline.createOscillator();
        lfo.type = recipe.tremolo.wave || 'sine';
        lfo.frequency.value = recipe.tremolo.rate;
        
        const lfoGain = offline.createGain();
        lfoGain.gain.value = recipe.tremolo.depth; 
        
        tremoloNode.gain.value = 1.0 - (recipe.tremolo.depth / 2);
        lfo.connect(lfoGain);
        lfoGain.connect(tremoloNode.gain);
        
        lfo.start();
    }

    if (recipe.type === 'oscillator') {
        const osc = offline.createOscillator();
        osc.type = recipe.wave || 'sine';
        osc.frequency.setValueAtTime(recipe.frequency[0], 0);
        if (recipe.frequency[1] !== recipe.frequency[0]) {
            osc.frequency.exponentialRampToValueAtTime(recipe.frequency[1], recipe.duration);
        }

        if (recipe.fm) {
           const modOsc = offline.createOscillator();
           const modGain = offline.createGain();
           modOsc.type = recipe.fm.modType;
           modOsc.frequency.value = recipe.fm.modFreq;
           modGain.gain.value = recipe.fm.modIndex;
           modOsc.connect(modGain);
           modGain.connect(osc.frequency); 
           modOsc.start();
        }

        osc.connect(outputNode);
        osc.start();
    } 
    else if (recipe.type === 'noise') {
        const bufferSize = length;
        const noiseBuffer = offline.createBuffer(1, bufferSize, sampleRate);
        const data = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        const noise = offline.createBufferSource();
        noise.buffer = noiseBuffer;

        if (recipe.filter) {
            const filter = offline.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(recipe.filter[0], 0);
            filter.frequency.exponentialRampToValueAtTime(recipe.filter[1], recipe.duration);
            noise.connect(filter);
            filter.connect(outputNode);
        } else {
            noise.connect(outputNode);
        }
        noise.start();
    }

    return await offline.startRendering();
  }

  private static makeDistortionCurve(amount: number) {
    const k = typeof amount === 'number' ? amount : 50;
    const n_samples = 44100;
    const curve = new Float32Array(n_samples);
    const deg = Math.PI / 180;
    for (let i = 0; i < n_samples; ++i) {
      const x = (i * 2) / n_samples - 1;
      curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
    }
    return curve;
  }
}

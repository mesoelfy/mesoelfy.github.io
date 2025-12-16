import { ServiceLocator } from '@/engine/services/ServiceLocator';
import { IAudioService } from '@/engine/interfaces';
import { AudioServiceImpl } from './AudioService';

/**
 * STATIC FACADE FOR AUDIO SERVICE
 * Routes calls to the registered IAudioService.
 * Auto-registers a default implementation if none exists.
 */
class AudioSystemFacade implements IAudioService {
  
  private get service(): IAudioService {
    try {
      return ServiceLocator.getAudioService();
    } catch (e) {
      // Lazy Initialization: If not found, create and register it globally
      const impl = new AudioServiceImpl();
      ServiceLocator.register('AudioService', impl);
      return impl;
    }
  }

  public async init() { return this.service.init(); }
  public startMusic() { this.service.startMusic(); }
  public stopAll() { this.service.stopAll(); }
  public updateVolumes() { this.service.updateVolumes(); }
  
  public playSound(key: string, pan?: number) { this.service.playSound(key, pan); }
  public playAmbience(key: string) { this.service.playAmbience(key); }
  public playMusic(key: string) { this.service.playMusic(key); }
  
  public setVolume(volume: number) { this.service.setVolume(volume); }
  public duckMusic(intensity: number, duration: number) { this.service.duckMusic(intensity, duration); }
  public getFrequencyData(array: Uint8Array) { this.service.getFrequencyData(array); }
  
  // Helpers
  public playClick(pan?: number) { this.service.playClick(pan); }
  public playHover(pan?: number) { this.service.playHover(pan); }
  public playBootSequence() { this.service.playBootSequence(); }
  public playDrillSound() { this.service.playDrillSound(); }
  public playRebootZap() { this.service.playRebootZap(); }
}

export const AudioSystem = new AudioSystemFacade();

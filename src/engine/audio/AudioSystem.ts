import { ServiceLocator } from '@/engine/services/ServiceLocator';
import { IAudioService } from '@/engine/interfaces';
import { AudioServiceImpl } from './AudioService';

class AudioSystemFacade implements IAudioService {
  
  private get service(): IAudioService {
    try {
      return ServiceLocator.getAudioService();
    } catch (e) {
      const impl = new AudioServiceImpl();
      ServiceLocator.register('AudioService', impl);
      return impl;
    }
  }

  public async init() { return this.service.init(); }
  public startMusic() { this.service.startMusic(); }
  public nextTrack() { this.service.nextTrack(); }
  public stopAll() { this.service.stopAll(); }
  public updateVolumes() { this.service.updateVolumes(); }
  
  public playSound(key: string, pan?: number) { this.service.playSound(key, pan); }
  public playAmbience(key: string) { this.service.playAmbience(key); }
  public duckMusic(intensity: number, duration: number) { this.service.duckMusic(intensity, duration); }
  public getFrequencyData(array: Uint8Array) { this.service.getFrequencyData(array); }
  
  public playClick(pan?: number) { this.service.playClick(pan); }
  public playHover(pan?: number) { this.service.playHover(pan); }
  public playBootSequence() { this.service.playBootSequence(); }
  public playDrillSound() { this.service.playDrillSound(); }
  public playRebootZap() { this.service.playRebootZap(); }
}

export const AudioSystem = new AudioSystemFacade();

import { IServiceLocator, IGameSystem, IAudioService, IInputService } from './interfaces';

class ServiceLocatorImpl implements IServiceLocator {
  private systems = new Map<string, IGameSystem>();
  private audioService?: IAudioService;
  private inputService?: IInputService;

  public registerSystem(id: string, system: IGameSystem): void {
    this.systems.set(id, system);
    
    // Auto-register specific services if they match the interface
    // (In a stricter app, we might do this explicitly)
    if (id === 'InputSystem') this.inputService = system as unknown as IInputService;
    // Audio service registration would happen here too
  }

  public getSystem<T extends IGameSystem>(id: string): T {
    const sys = this.systems.get(id);
    if (!sys) throw new Error(`System not registered: ${id}`);
    return sys as T;
  }

  public getAudioService(): IAudioService {
    if (!this.audioService) throw new Error("AudioService not registered");
    return this.audioService;
  }

  public getInputService(): IInputService {
    if (!this.inputService) throw new Error("InputService not registered");
    return this.inputService;
  }
  
  public reset(): void {
    this.systems.clear();
    this.audioService = undefined;
    this.inputService = undefined;
  }
}

export const ServiceLocator = new ServiceLocatorImpl();

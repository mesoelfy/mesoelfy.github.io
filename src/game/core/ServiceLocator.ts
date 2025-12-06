import { IServiceLocator, IGameSystem, IAudioService, IInputService } from './interfaces';

class ServiceLocatorImpl implements IServiceLocator {
  private systems = new Map<string, IGameSystem>();
  private audioService?: IAudioService;
  private inputService?: IInputService;

  // Generic getter allows accessing any registered system type-safely
  public getSystem<T extends IGameSystem>(id: string): T {
    const sys = this.systems.get(id);
    if (!sys) throw new Error(`System not registered: ${id}`);
    return sys as T;
  }

  public registerSystem(id: string, system: IGameSystem): void {
    this.systems.set(id, system);
    if (id === 'InputSystem') this.inputService = system as unknown as IInputService;
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

  // Helper for debug/tools
  public get registeredSystemIds(): string[] {
    return Array.from(this.systems.keys());
  }
}

export const ServiceLocator = new ServiceLocatorImpl();

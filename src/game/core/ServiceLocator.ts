import { IServiceLocator, IGameSystem, IAudioService, IInputService, IEntityRegistry, IEntitySpawner } from './interfaces';
import { ConfigService } from '../services/ConfigService';

class ServiceLocatorImpl implements IServiceLocator {
  private systems = new Map<string, IGameSystem>();
  private audioService?: IAudioService;
  private inputService?: IInputService;
  private registry?: IEntityRegistry;
  private spawner?: IEntitySpawner;

  public getSystem<T extends IGameSystem>(id: string): T {
    const sys = this.systems.get(id);
    if (!sys) throw new Error(`System not registered: ${id}`);
    return sys as T;
  }

  public registerSystem(id: string, system: IGameSystem): void {
    this.systems.set(id, system);
    if (id === 'InputSystem') this.inputService = system as unknown as IInputService;
  }

  public registerRegistry(registry: IEntityRegistry) {
      this.registry = registry;
  }

  public registerSpawner(spawner: IEntitySpawner) {
      this.spawner = spawner;
  }

  public getAudioService(): IAudioService {
    return { playSound: () => {}, playMusic: () => {}, setVolume: () => {} }; 
  }

  public getInputService(): IInputService {
    if (!this.inputService) throw new Error("InputService not registered");
    return this.inputService;
  }
  
  public getRegistry(): IEntityRegistry {
      if (!this.registry) throw new Error("Registry not registered");
      return this.registry;
  }

  public getSpawner(): IEntitySpawner {
      if (!this.spawner) throw new Error("Spawner not registered");
      return this.spawner;
  }

  public getConfigService() {
      return ConfigService;
  }
  
  public reset(): void {
    this.systems.clear();
    this.audioService = undefined;
    this.inputService = undefined;
    this.registry = undefined;
    this.spawner = undefined;
    ConfigService.reset(); // Reset configs on reboot
  }
}

export const ServiceLocator = new ServiceLocatorImpl();

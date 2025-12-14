import { IServiceLocator, IGameSystem, IAudioService, IInputService, IEntityRegistry, IEntitySpawner, IParticleSystem } from '@/engine/interfaces';
import { ConfigService } from '@/sys/services/ConfigService';

class ServiceLocatorImpl implements IServiceLocator {
  private systems = new Map<string, IGameSystem>();
  private audioService?: IAudioService;
  private inputService?: IInputService;
  private registry?: IEntityRegistry;
  private spawner?: IEntitySpawner;
  private particleSystem?: IParticleSystem;

  public getSystem<T extends IGameSystem>(id: string): T {
    const sys = this.systems.get(id);
    if (!sys) throw new Error(`System not registered: ${id}`);
    return sys as T;
  }

  public registerSystem(id: string, system: IGameSystem): void {
    this.systems.set(id, system);
    if (id === 'InputSystem') this.inputService = system as unknown as IInputService;
    if (id === 'ParticleSystem') this.particleSystem = system as unknown as IParticleSystem;
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

  public getParticleSystem(): IParticleSystem {
      if (!this.particleSystem) throw new Error("ParticleSystem not registered");
      return this.particleSystem;
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
    this.particleSystem = undefined;
    ConfigService.reset(); 
  }
}

export const ServiceLocator = new ServiceLocatorImpl();

import { 
  IServiceLocator, 
  IGameSystem, 
  IAudioService, 
  IInputService, 
  IEntityRegistry, 
  IEntitySpawner, 
  IParticleSystem 
} from '@/engine/interfaces';
import { ConfigService } from '@/sys/services/ConfigService';

class ServiceLocatorImpl implements IServiceLocator {
  private services = new Map<string, any>();

  public register<T>(id: string, instance: T): void {
    if (this.services.has(id)) {
      console.warn(`[ServiceLocator] Overwriting service: ${id}`);
    }
    this.services.set(id, instance);
  }

  public get<T>(id: string): T {
    const service = this.services.get(id);
    if (!service) {
      throw new Error(`[ServiceLocator] Service not found: ${id}`);
    }
    return service as T;
  }

  public reset(): void {
    this.services.clear();
    ConfigService.reset();
  }

  public registerSystem(id: string, system: IGameSystem): void {
    this.register(id, system);
  }

  public getSystem<T extends IGameSystem>(id: string): T {
    return this.get<T>(id);
  }

  public registerRegistry(registry: IEntityRegistry) {
    this.register('EntityRegistry', registry);
  }

  public getRegistry(): IEntityRegistry {
    return this.get<IEntityRegistry>('EntityRegistry');
  }

  public registerSpawner(spawner: IEntitySpawner) {
    this.register('EntitySpawner', spawner);
  }

  public getSpawner(): IEntitySpawner {
    return this.get<IEntitySpawner>('EntitySpawner');
  }

  public getInputService(): IInputService {
    return this.get<IInputService>('InputSystem');
  }

  public getParticleSystem(): IParticleSystem {
    return this.get<IParticleSystem>('ParticleSystem');
  }

  public getAudioService(): IAudioService {
    // Phase 2 Update: Return the registered AudioService
    return this.get<IAudioService>('AudioService');
  }

  public getConfigService() {
    return ConfigService;
  }
}

export const ServiceLocator = new ServiceLocatorImpl();

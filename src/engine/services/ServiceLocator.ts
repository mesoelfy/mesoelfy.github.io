import { 
  IServiceLocator, 
  IGameSystem, 
  IAudioService, 
  IInputService, 
  IEntityRegistry, 
  IEntitySpawner, 
  IParticleSystem,
  IGameEventService,
  IFastEventService
} from '@/engine/interfaces';
import { ConfigService } from '@/engine/services/ConfigService';

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

  public getGameEventBus(): IGameEventService { return this.get<IGameEventService>('GameEventService'); }
  public getFastEventBus(): IFastEventService { return this.get<IFastEventService>('FastEventService'); }
  
  public getAudioService(): IAudioService { return this.get<IAudioService>('AudioService'); }
  public getInputService(): IInputService { return this.get<IInputService>('InputSystem'); }
  public getParticleSystem(): IParticleSystem { return this.get<IParticleSystem>('ParticleSystem'); }
  
  public getRegistry(): IEntityRegistry { return this.get<IEntityRegistry>('EntityRegistry'); }
  public getSpawner(): IEntitySpawner { return this.get<IEntitySpawner>('EntitySpawner'); }
  public getConfigService() { return ConfigService; }

  public registerSystem(id: string, system: IGameSystem) { this.register(id, system); }
  public getSystem<T extends IGameSystem>(id: string): T { return this.get<T>(id); }
}

export const ServiceLocator = new ServiceLocatorImpl();

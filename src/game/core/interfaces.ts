import { GameEvents, GameEventPayloads } from '../events/GameEvents';
import { Entity } from './ecs/Entity';

export interface IGameSystem {
  setup(locator: IServiceLocator): void;
  update(delta: number, time: number): void;
  teardown(): void;
}

export interface IServiceLocator {
  getSystem<T extends IGameSystem>(id: string): T;
  registerSystem(id: string, system: IGameSystem): void;
  
  // Core Services
  getAudioService(): IAudioService;
  getInputService(): IInputService;
  getRegistry(): IEntityRegistry;
  getSpawner(): IEntitySpawner;
}

// Interface for the Registry (to decouple implementation)
export interface IEntityRegistry {
  createEntity(): Entity;
  destroyEntity(id: number): void;
  getEntity(id: number): Entity | undefined;
  getAll(): IterableIterator<Entity>;
  getByTag(tag: string): Entity[];
  clear(): void;
  getStats(): { active: number; pooled: number; totalAllocated: number };
}

// Interface for the Spawner (formerly Factory)
export interface IEntitySpawner {
  spawnPlayer(): Entity;
  spawnEnemy(type: string, x: number, y: number): Entity;
  spawnBullet(x: number, y: number, vx: number, vy: number, isEnemy: boolean, life: number, radius?: number): Entity;
  spawnParticle(x: number, y: number, color: string, vx: number, vy: number, life: number): void;
}

export interface IAudioService {
  playSound(key: string, volume?: number): void;
  playMusic(key: string): void;
  setVolume(volume: number): void;
}

export interface IInputService {
  getCursor(): { x: number, y: number };
  isPressed(action: string): boolean;
  updateCursor(x: number, y: number): void;
}

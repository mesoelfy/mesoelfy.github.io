import { Entity } from './ecs/Entity';
import { SpatialGrid } from './ecs/SpatialGrid';
import { WorldRect } from '@/engine/math/ViewportHelper';
import { ConfigService } from '@/engine/services/ConfigService';
import { QueryDef } from './ecs/Query';
import { Tag } from './ecs/types';
import { GameEvents, GameEventPayloads } from '@/engine/signals/GameEvents';

export interface IGameSystem {
  update(delta: number, time: number): void;
  teardown(): void;
}

export interface IServiceLocator {
  register<T>(id: string, instance: T): void;
  get<T>(id: string): T;
  
  getGameEventBus(): IGameEventService;
  getFastEventBus(): IFastEventService;
  getAudioService(): IAudioService;
  getInputService(): IInputService;
  getRegistry(): IEntityRegistry;
  getSpawner(): IEntitySpawner;
  getConfigService(): typeof ConfigService;
  getParticleSystem(): IParticleSystem;
  
  // Legacy Adapter
  getSystem<T extends IGameSystem>(id: string): T;
  registerSystem(id: string, system: IGameSystem): void;
}

export interface IGameEventService {
  subscribe<T extends GameEvents>(event: T, handler: (payload: GameEventPayloads[T]) => void): () => void;
  emit<T extends GameEvents>(event: T, payload: GameEventPayloads[T]): void;
  clear(): void;
}

export interface IFastEventService {
  emit(eventId: number, a1?: number, a2?: number, a3?: number, a4?: number): void;
  readEvents(fromCursor: number, handler: (eventId: number, a1: number, a2: number, a3: number, a4: number) => void): number;
  getCursor(): number;
}

export interface IEntityRegistry {
  createEntity(): Entity;
  destroyEntity(id: number): void;
  getEntity(id: number): Entity | undefined;
  getAll(): IterableIterator<Entity>;
  getByTag(tag: string): Iterable<Entity>; 
  query(def: QueryDef): Iterable<Entity>;
  clear(): void;
  getStats(): { active: number; pooled: number; totalAllocated: number };
  updateCache(entity: Entity): void; 
}

export interface IEntitySpawner {
  spawn(archetypeId: string, overrides?: Record<string, any>, extraTags?: Tag[]): Entity;
  spawnPlayer(): Entity;
  spawnEnemy(type: string, x: number, y: number): Entity;
  spawnBullet(x: number, y: number, vx: number, vy: number, isEnemy: boolean, life: number, damage?: number, widthMult?: number): Entity;
  spawnParticle(x: number, y: number, color: string, vx: number, vy: number, life: number, size?: number, shape?: number): void;
}

export interface IAudioService {
  init(): Promise<void>;
  startMusic(): void;
  stopAll(): void;
  updateVolumes(): void;
  playSound(key: string, pan?: number): void;
  playAmbience(key: string): void;
  duckMusic(intensity: number, duration: number): void;
  getFrequencyData(array: Uint8Array): void;
  playClick(pan?: number): void;
  playHover(pan?: number): void;
  playBootSequence(): void;
  playDrillSound(): void;
  playRebootZap(): void;
}

export interface IInputService {
  getCursor(): { x: number, y: number };
  isPressed(action: string): boolean;
  updateCursor(x: number, y: number): void;
  updateBounds(width: number, height: number): void; 
}

export interface IParticleSystem extends IGameSystem {
  spawn(x: number, y: number, colorHex: string, vx: number, vy: number, life: number, size?: number, shape?: number): void;
  getCount(): number;
  getData(): {
    x: Float32Array;
    y: Float32Array;
    life: Float32Array;
    maxLife: Float32Array;
    color: Float32Array; 
  };
}

export interface IPhysicsSystem extends IGameSystem {
  spatialGrid: SpatialGrid;
}

export interface ICombatSystem extends IGameSystem {
  resolveCollision(e1: Entity, e2: Entity): void;
}

export interface IInteractionSystem extends IGameSystem {
  repairState: 'IDLE' | 'HEALING' | 'REBOOTING';
  hoveringPanelId: string | null;
}

export interface IGameStateSystem extends IGameSystem {
  playerHealth: number;
  maxPlayerHealth: number;
  playerRebootProgress: number;
  score: number;
  xp: number;
  level: number;
  xpToNextLevel: number;
  upgradePoints: number;
  activeUpgrades: Record<string, number>;
  isGameOver: boolean;
  
  damagePlayer(amount: number): void;
  healPlayer(amount: number): void;
  addScore(amount: number): void;
  addXp(amount: number): void;
  tickReboot(amount: number): void;
  decayReboot(amount: number): void;
}

export interface IPanelSystem extends IGameSystem {
  systemIntegrity: number;
  register(id: string, element: HTMLElement): void;
  unregister(id: string): void;
  refreshAll(): void;
  refreshSingle(id: string): void;
  damagePanel(id: string, amount: number, silent?: boolean): void;
  healPanel(id: string, amount: number, sourceX?: number): void;
  decayPanel(id: string, amount: number): void;
  destroyAll(): void;
  getPanelRect(id: string): WorldRect | undefined;
  getPanelState(id: string): { health: number; isDestroyed: boolean } | undefined;
  getAllPanels(): any[]; 
}

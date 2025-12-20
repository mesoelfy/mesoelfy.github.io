import { Entity } from './ecs/Entity';
import { SpatialGrid } from './ecs/SpatialGrid';
import { WorldRect } from '@/engine/math/ViewportHelper';
import { ConfigService } from '@/engine/services/ConfigService';
import { QueryDef } from './ecs/Query';
import { Tag, Faction, ParticleShape } from './ecs/types';
import { GameEvents, GameEventPayloads } from '@/engine/signals/GameEvents';
import { AudioKey, VFXKey } from '@/engine/config/AssetKeys';
import { PanelId } from '@/engine/config/PanelConfig';

export enum SystemPhase {
  INPUT = 0,
  LOGIC = 1,
  PHYSICS = 2,
  COLLISION = 3,
  STATE = 4,
  RENDER = 5
}

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
  getHUDService(): IHUDService; 

  getSystem<T extends IGameSystem>(id: string): T;
  registerSystem(id: string, system: IGameSystem): void;
}

export interface IHUDService extends IGameSystem {
  bindScore(el: HTMLElement | null): void;
  bindVitals(el: HTMLElement | null): void;
  bindLevelText(el: Element | null): void;
  updateScore(val: number): void;
  updateHealth(percent: number, color: string): void;
  updateXP(percent: number): void;
  updateLevel(level: number): void;
}

export interface IFastEventService {
  emit(eventId: number, a1?: number, a2?: number, a3?: number, a4?: number): void;
  process(callback: (id: number, a1: number, a2: number, a3: number, a4: number) => void): void;
  clear(): void;
  getCursor(): number;
}

export interface IGameEventService {
  subscribe<T extends GameEvents>(event: T, handler: (payload: GameEventPayloads[T]) => void): () => void;
  emit<T extends GameEvents>(event: T, payload: GameEventPayloads[T]): void;
  clear(): void;
}

export interface IVitalsRead {
  playerHealth: number;
  maxPlayerHealth: number;
  playerRebootProgress: number;
  isGameOver: boolean;
}

export interface IProgressionRead {
  score: number;
  xp: number;
  level: number;
  xpToNextLevel: number;
  upgradePoints: number;
  activeUpgrades: Record<string, number>;
}

export interface IGameStateSystem extends IGameSystem, IVitalsRead, IProgressionRead {
  damagePlayer(amount: number): void;
  healPlayer(amount: number): void;
  addScore(amount: number): void;
  addXp(amount: number): void;
  tickReboot(amount: number): void;
  decayReboot(amount: number): void;
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
  spawnBullet(
      x: number, y: number, 
      vx: number, vy: number, 
      faction: Faction, 
      life: number, 
      damage?: number, 
      projectileId?: string, 
      ownerId?: number
  ): Entity;
  spawnParticle(
      x: number, y: number, 
      color: string, 
      vx: number, vy: number, 
      life: number, 
      size?: number, 
      shape?: ParticleShape
  ): void;
}

export interface IAudioService {
  init(): Promise<void>;
  startMusic(): void;
  stopAll(): void;
  updateVolumes(): void;
  playSound(key: AudioKey, pan?: number): void;
  playAmbience(key: AudioKey): void;
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
  spawn(
      x: number, y: number, 
      colorHex: string, 
      vx: number, vy: number, 
      life: number, 
      size?: number, 
      shape?: ParticleShape
  ): void;
  getCount(): number;
  getData(): { x: Float32Array; y: Float32Array; life: Float32Array; maxLife: Float32Array; color: Float32Array; };
}

export interface IPhysicsSystem extends IGameSystem {
  spatialGrid: SpatialGrid;
}

export interface ICombatSystem extends IGameSystem {
  resolveCollision(e1: Entity, e2: Entity): void;
}

export interface IInteractionSystem extends IGameSystem {
  repairState: 'IDLE' | 'HEALING' | 'REBOOTING';
  hoveringPanelId: PanelId | null;
}

export interface DamageOptions {
    silent?: boolean;
    source?: { x: number; y: number };
}

export interface IPanelSystem extends IGameSystem {
  systemIntegrity: number;
  register(id: PanelId, element: HTMLElement): void;
  unregister(id: PanelId): void;
  refreshAll(): void;
  refreshSingle(id: PanelId): void;
  damagePanel(id: PanelId, amount: number, options?: DamageOptions): void;
  healPanel(id: PanelId, amount: number, sourceX?: number): void;
  decayPanel(id: PanelId, amount: number): void;
  destroyAll(): void;
  getPanelRect(id: PanelId): WorldRect | undefined;
  getPanelState(id: PanelId): { health: number; isDestroyed: boolean } | undefined;
  getAllPanels(): any[]; 
}

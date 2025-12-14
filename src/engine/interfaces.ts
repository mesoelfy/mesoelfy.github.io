import { GameEvents, GameEventPayloads } from '@/engine/signals/GameEvents';
import { Entity } from './ecs/Entity';
import { SpatialGrid } from './SpatialGrid';
import { WorldRect } from '@/engine/math/ViewportHelper';
import { ConfigService } from '@/sys/services/ConfigService';
import { QueryDef } from './ecs/Query';
import { Tag } from './ecs/types';

export interface IGameSystem {
  setup(locator: IServiceLocator): void;
  update(delta: number, time: number): void;
  teardown(): void;
}

export interface IServiceLocator {
  getSystem<T extends IGameSystem>(id: string): T;
  registerSystem(id: string, system: IGameSystem): void;
  
  getAudioService(): IAudioService;
  getInputService(): IInputService;
  getRegistry(): IEntityRegistry;
  getSpawner(): IEntitySpawner;
  getConfigService(): typeof ConfigService;
  getParticleSystem(): IParticleSystem;
}

// --- CORE CONTRACTS ---

export interface IEntityRegistry {
  createEntity(): Entity;
  destroyEntity(id: number): void;
  getEntity(id: number): Entity | undefined;
  getAll(): IterableIterator<Entity>;
  getByTag(tag: string): Iterable<Entity>; 
  query(def: QueryDef): Iterable<Entity>;
  clear(): void;
  getStats(): { active: number; pooled: number; totalAllocated: number };
}

export interface IEntitySpawner {
  spawn(archetypeId: string, overrides?: Record<string, any>, extraTags?: Tag[]): Entity;
  spawnPlayer(): Entity;
  spawnEnemy(type: string, x: number, y: number): Entity;
  spawnBullet(x: number, y: number, vx: number, vy: number, isEnemy: boolean, life: number, damage?: number, widthMult?: number): Entity;
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
  updateBounds(width: number, height: number): void; 
}

// --- SYSTEM CONTRACTS ---

export interface IParticleSystem extends IGameSystem {
  spawn(x: number, y: number, colorHex: string, vx: number, vy: number, life: number): void;
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
  damagePanel(id: string, amount: number): void;
  // UPDATED: sourceX optional arg
  healPanel(id: string, amount: number, sourceX?: number): void;
  getPanelRect(id: string): WorldRect | undefined;
}

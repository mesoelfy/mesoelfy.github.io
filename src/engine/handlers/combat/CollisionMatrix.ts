import { CollisionLayers } from '@/engine/config/PhysicsConfig';
import { CollisionHandler } from './types';
import * as Handlers from './CombatHandlers';

class CollisionMatrixController {
  private matrix = new Map<string, CollisionHandler>();

  constructor() {
    this.register(CollisionLayers.PLAYER, CollisionLayers.ENEMY, Handlers.handlePlayerCrash);
    this.register(CollisionLayers.PLAYER, CollisionLayers.ENEMY_PROJECTILE, Handlers.handlePlayerHit);
    this.register(CollisionLayers.ENEMY, CollisionLayers.PLAYER_PROJECTILE, Handlers.handleEnemyHit);
    this.register(CollisionLayers.PLAYER_PROJECTILE, CollisionLayers.ENEMY_PROJECTILE, Handlers.handleBulletClash);
    
    // NEW: Panel Collisions
    this.register(CollisionLayers.ENEMY, CollisionLayers.PANEL, Handlers.handleEnemyPanelHit);
    // Player vs Panel? Usually player flies over panels. 
    // If we wanted player to bounce off panels, we'd add it here.
  }

  private getKey(layerA: number, layerB: number): string {
    return layerA < layerB ? `${layerA}:${layerB}` : `${layerB}:${layerA}`;
  }

  private register(layerA: number, layerB: number, handler: CollisionHandler) {
    this.matrix.set(this.getKey(layerA, layerB), handler);
  }

  public getHandler(layerA: number, layerB: number): CollisionHandler | undefined {
    return this.matrix.get(this.getKey(layerA, layerB));
  }
}

export const CollisionMatrix = new CollisionMatrixController();

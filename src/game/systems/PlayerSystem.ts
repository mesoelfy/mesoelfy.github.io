import { IGameSystem, IServiceLocator, IEntitySpawner, IGameStateSystem, IInteractionSystem } from '../core/interfaces';
import { EntityRegistry } from '../core/ecs/EntityRegistry';
import { GameEventBus } from '../events/GameEventBus';
import { GameEvents } from '../events/GameEvents';
import { Tag } from '../core/ecs/types';
import { TransformComponent } from '../components/data/TransformComponent';
import { StateComponent } from '../components/data/StateComponent';
import { TargetComponent } from '../components/data/TargetComponent';
import { ConfigService } from '../services/ConfigService';

export class PlayerSystem implements IGameSystem {
  private lastFireTime = 0;
  private gameSystem!: IGameStateSystem;
  private registry!: EntityRegistry;
  private spawner!: IEntitySpawner;
  private locator!: IServiceLocator;
  private config!: typeof ConfigService;

  setup(locator: IServiceLocator): void {
    this.locator = locator;
    this.gameSystem = locator.getSystem<IGameStateSystem>('GameStateSystem');
    this.registry = locator.getRegistry() as EntityRegistry;
    this.spawner = locator.getSpawner();
    this.config = locator.getConfigService(); // INJECTED CONFIG
    
    this.setupListeners();
  }

  update(delta: number, time: number): void {
    if (this.gameSystem.isGameOver || this.gameSystem.playerHealth <= 0) return;

    const players = this.registry.getByTag(Tag.PLAYER);
    const playerEntity = players[0]; 
    if (!playerEntity) return;

    const cursor = this.locator.getInputService().getCursor();
    const transform = playerEntity.getComponent<TransformComponent>('Transform');
    if (transform) {
        transform.x = cursor.x;
        transform.y = cursor.y;
    }

    const stateComp = playerEntity.getComponent<StateComponent>('State');
    if (stateComp) {
        try {
            const interact = this.locator.getSystem<IInteractionSystem>('InteractionSystem');
            if (interact && interact.repairState !== 'IDLE') {
                stateComp.current = 'REBOOTING';
            } else {
                stateComp.current = 'ACTIVE';
            }
        } catch {
            stateComp.current = 'ACTIVE';
        }
    }

    if (stateComp && (stateComp.current === 'ACTIVE' || stateComp.current === 'REBOOTING')) {
        const upgrades = this.gameSystem.activeUpgrades;
        const overclock = upgrades['OVERCLOCK'] || 0;
        
        // USE INJECTED CONFIG
        const currentFireRate = this.config.player.fireRate / Math.pow(1.5, overclock);

        if (time > this.lastFireTime + currentFireRate) {
            this.attemptAutoFire(time, playerEntity, upgrades);
        }
    }
  }

  teardown(): void {}

  private setupListeners() {
    GameEventBus.subscribe(GameEvents.ENEMY_DESTROYED, (payload) => {
      this.gameSystem.addScore(1);
      this.gameSystem.addXp(10);
    });

    GameEventBus.subscribe(GameEvents.UPGRADE_SELECTED, (p) => {
        if (p.option === 'PURGE') {
            this.triggerPurge();
        }
    });
  }

  private triggerPurge() {
      const cursor = this.locator.getInputService().getCursor();
      const count = 360; 
      const speed = 45;  
      const damage = 100;
      const width = 3.0; 

      GameEventBus.emit(GameEvents.SPAWN_FX, { type: 'EXPLOSION_YELLOW', x: cursor.x, y: cursor.y });
      GameEventBus.emit(GameEvents.TRAUMA_ADDED, { amount: 1.0 }); 

      for (let i = 0; i < count; i++) {
          const angle = (Math.PI * 2 * i) / count;
          const vx = Math.cos(angle) * speed;
          const vy = Math.sin(angle) * speed;
          
          this.spawner.spawnBullet(
              cursor.x, cursor.y, 
              vx, vy, 
              false, 
              2.0,   
              damage, 
              width
          );
      }
  }

  private attemptAutoFire(time: number, player: any, upgrades: Record<string, number>) {
    const cursor = this.locator.getInputService().getCursor();
    const enemies = this.registry.getByTag(Tag.ENEMY);
    let nearestDist = Infinity;
    const RANGE = 14; 
    let targetEnemy: any = null;

    for (const e of enemies) {
      if (!e.active) continue;
      const state = e.getComponent<StateComponent>('State');
      if (state && state.current === 'SPAWN') continue;

      const t = e.getComponent<TransformComponent>('Transform');
      if (!t) continue;
      const dx = t.x - cursor.x;
      const dy = t.y - cursor.y;
      const dist = dx*dx + dy*dy; 
      if (dist < (RANGE * RANGE) && dist < nearestDist) {
          nearestDist = dist;
          targetEnemy = e;
      }
    }

    if (targetEnemy) {
      const forkLevel = upgrades['FORK'] || 0;
      const projectileCount = 1 + (forkLevel * 2);
      const dmgLevel = upgrades['EXECUTE'] || 0;
      const damage = 1 + dmgLevel;
      const widthLevel = upgrades['BANDWIDTH'] || 0;
      const width = 1.0 + (widthLevel * 0.5);
      const snifferLevel = upgrades['SNIFFER'] || 0;
      const backdoorLevel = upgrades['BACKDOOR'] || 0;

      const baseSpread = 0.15;
      const spreadAngle = baseSpread * width; 
      
      const tPos = targetEnemy.getComponent<TransformComponent>('Transform')!;
      const dx = tPos.x - cursor.x;
      const dy = tPos.y - cursor.y;
      const baseAngle = Math.atan2(dy, dx);
      const startAngle = baseAngle - ((projectileCount - 1) * spreadAngle) / 2;

      // Use Config for Bullet Speed/Life
      const bSpeed = this.config.player.bulletSpeed;
      const bLife = this.config.player.bulletLife;

      // 1. FORK (Main)
      for (let i = 0; i < projectileCount; i++) {
          const angle = startAngle + (i * spreadAngle);
          const vx = Math.cos(angle) * bSpeed;
          const vy = Math.sin(angle) * bSpeed;

          this.spawner.spawnBullet(cursor.x, cursor.y, vx, vy, false, bLife, damage, width);
      }

      // 2. BACKDOOR
      if (backdoorLevel > 0) {
          const rearAngle = baseAngle + Math.PI; 
          const vx = Math.cos(rearAngle) * bSpeed;
          const vy = Math.sin(rearAngle) * bSpeed;
          this.spawner.spawnBullet(cursor.x, cursor.y, vx, vy, false, bLife, damage, width);
      }

      // 3. SNIFFER
      if (snifferLevel > 0) {
          const angleStep = (Math.PI * 2) / snifferLevel;
          for(let i=0; i<snifferLevel; i++) {
              const angle = baseAngle + (i * angleStep);
              const vx = Math.cos(angle) * bSpeed;
              const vy = Math.sin(angle) * bSpeed;
              const bullet = this.spawner.spawnBullet(cursor.x, cursor.y, vx, vy, false, bLife, damage, width);
              bullet.addComponent(new TargetComponent(null, 'ENEMY'));
          }
      }
      
      GameEventBus.emit(GameEvents.PLAYER_FIRED, { x: cursor.x, y: cursor.y });
      this.lastFireTime = time;
    }
  }
}

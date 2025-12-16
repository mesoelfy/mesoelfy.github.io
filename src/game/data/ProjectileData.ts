import { Component } from '@/core/ecs/Component';
import { ComponentType } from '@/core/ecs/ComponentType';

export type ProjectileState = 'CHARGING' | 'FLIGHT' | 'IMPACT';

export class ProjectileData extends Component {
  readonly _type = ComponentType.Projectile;

  constructor(
    public configId: string = 'DEFAULT', // Key into ProjectileConfig
    public state: ProjectileState = 'FLIGHT',
    public ownerId: number = -1
  ) {
    super();
  }

  public reset(configId: string = 'DEFAULT', state: ProjectileState = 'FLIGHT', ownerId: number = -1) {
    this.configId = configId;
    this.state = state;
    this.ownerId = ownerId;
    return this;
  }
}

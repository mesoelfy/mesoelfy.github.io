import { Component } from '@/engine/ecs/Component';
import { ComponentType } from '@/engine/ecs/ComponentType';

export type ProjectileState = 'CHARGING' | 'FLIGHT' | 'IMPACT';

export class ProjectileData extends Component {
  readonly _type = ComponentType.Projectile;

  constructor(
    public configId: string = 'DEFAULT', 
    public state: ProjectileState = 'FLIGHT',
    public ownerId: number = -1
  ) {
    super();
  }

  public reset(data: Partial<ProjectileData>) {
    this.configId = data.configId ?? 'DEFAULT';
    this.state = data.state ?? 'FLIGHT';
    this.ownerId = data.ownerId ?? -1;
    return this;
  }
}

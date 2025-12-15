import { Component } from '@/engine/ecs/Component';
import { ComponentType } from '@/engine/ecs/ComponentType';

export type OrdnanceType = 'PLASMA' | 'SHARD' | 'ORB' | 'BEAM';
export type OrdnanceState = 'CHARGING' | 'FLIGHT' | 'IMPACT';

export class OrdnanceData extends Component {
  readonly _type = ComponentType.Ordnance;

  constructor(
    public type: OrdnanceType = 'PLASMA',
    public state: OrdnanceState = 'FLIGHT',
    public ownerId: number = -1,
    public glowIntensity: number = 1.0
  ) {
    super();
  }

  public reset(type: OrdnanceType = 'PLASMA', state: OrdnanceState = 'FLIGHT', ownerId: number = -1, glowIntensity: number = 1.0) {
    this.type = type;
    this.state = state;
    this.ownerId = ownerId;
    this.glowIntensity = glowIntensity;
    return this;
  }
}

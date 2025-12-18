import { Component } from '@/engine/ecs/Component';
import { ComponentType } from '@/engine/ecs/ComponentType';

export type TargetType = 'PLAYER' | 'PANEL' | 'LOCATION' | 'ENEMY';

export class TargetData extends Component {
  readonly _type = ComponentType.Target;

  constructor(
    public id: string | null = null, 
    public type: TargetType = 'PLAYER',
    public x: number = 0, 
    public y: number = 0,
    public locked: boolean = false 
  ) {
    super();
  }

  public reset(data: Partial<TargetData>) {
    this.id = data.id ?? null;
    this.type = data.type ?? 'PLAYER';
    this.x = data.x ?? 0;
    this.y = data.y ?? 0;
    this.locked = data.locked ?? false;
    return this;
  }
}

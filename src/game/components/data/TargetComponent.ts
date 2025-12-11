import { Component } from '../../core/ecs/Component';

export type TargetType = 'PLAYER' | 'PANEL' | 'LOCATION' | 'ENEMY';

export class TargetComponent extends Component {
  readonly _type = 'Target';

  constructor(
    public id: string | null = null, 
    public type: TargetType = 'PLAYER',
    public x: number = 0, 
    public y: number = 0,
    public locked: boolean = false 
  ) {
    super();
  }

  public reset(id: string | null = null, type: TargetType = 'PLAYER', x: number = 0, y: number = 0, locked: boolean = false) {
    this.id = id;
    this.type = type;
    this.x = x;
    this.y = y;
    this.locked = locked;
    return this;
  }
}

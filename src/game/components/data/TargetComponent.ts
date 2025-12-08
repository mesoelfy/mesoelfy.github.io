import { Component } from '../../core/ecs/Component';

export type TargetType = 'PLAYER' | 'PANEL' | 'LOCATION';

export class TargetComponent extends Component {
  readonly _type = 'Target';

  constructor(
    public id: string | null = null, // Entity ID or Panel ID
    public type: TargetType = 'PLAYER',
    public x: number = 0, // Last known position (for memory)
    public y: number = 0,
    public locked: boolean = false // If true, won't switch targets easily
  ) {
    super();
  }
}

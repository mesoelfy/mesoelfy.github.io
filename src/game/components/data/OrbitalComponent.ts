import { Component } from '../../core/ecs/Component';

export class OrbitalComponent extends Component {
  readonly _type = 'Orbital';

  constructor(
    public parentId: number | null = null, // Entity ID to orbit (Player)
    public radius: number = 3.0,
    public speed: number = 2.0,
    public angle: number = 0,
    public active: boolean = true // Can pause orbiting to aim
  ) {
    super();
  }
}

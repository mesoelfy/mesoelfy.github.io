import { Component } from '@/engine/ecs/Component';
import { ComponentType } from '@/engine/ecs/ComponentType';

export class RenderEffect extends Component {
  readonly _type = ComponentType.RenderEffect;

  constructor(
    public flash: number = 0,
    public shudder: number = 0,
    public spawnProgress: number = 0.0, // Default to 0 (Invisible)
    public spawnVelocity: number = 0.0, // New: Controlled by AI
    public elasticity: number = 0.1,
    public pulseSpeed: number = 0,
    public flashR: number = 4.0,
    public flashG: number = 0.0,
    public flashB: number = 0.2
  ) {
    super();
  }

  public reset(data: Partial<RenderEffect>) {
    this.flash = 0;
    this.shudder = 0;
    // Essential: Reset spawn progress to 0 on pool reuse so enemies don't flash into existence
    this.spawnProgress = data.spawnProgress ?? 0.0; 
    this.spawnVelocity = 0.0;
    this.elasticity = data.elasticity ?? 0.1;
    this.pulseSpeed = data.pulseSpeed ?? 0;
    this.flashR = data.flashR ?? 4.0;
    this.flashG = data.flashG ?? 0.0;
    this.flashB = data.flashB ?? 0.2;
    return this;
  }
}

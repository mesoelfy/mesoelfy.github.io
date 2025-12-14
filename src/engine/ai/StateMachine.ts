import { Entity } from '@/engine/ecs/Entity';

export interface State {
  name: string;
  enter?: (entity: Entity, data?: any) => void;
  update?: (entity: Entity, delta: number, time: number, data?: any) => void;
  exit?: (entity: Entity, data?: any) => void;
}

export class StateMachine {
  private states = new Map<string, State>();
  private currentState: State | null = null;

  public addState(state: State) {
    this.states.set(state.name, state);
    return this;
  }

  public setState(name: string, entity: Entity, data?: any) {
    if (this.currentState && this.currentState.name === name) return;

    if (this.currentState && this.currentState.exit) {
      this.currentState.exit(entity, data);
    }

    this.currentState = this.states.get(name) || null;

    if (this.currentState && this.currentState.enter) {
      this.currentState.enter(entity, data);
    }
  }

  public update(entity: Entity, delta: number, time: number, data?: any) {
    if (this.currentState && this.currentState.update) {
      this.currentState.update(entity, delta, time, data);
    }
  }

  public getCurrentState() {
    return this.currentState?.name || null;
  }
}

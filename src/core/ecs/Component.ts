import { ComponentType } from './ComponentType';

export abstract class Component {
  abstract readonly _type: ComponentType;
}

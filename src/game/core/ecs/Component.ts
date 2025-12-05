export abstract class Component {
  // A unique string key for this component type (e.g., 'Transform', 'Health')
  abstract readonly _type: string;
}

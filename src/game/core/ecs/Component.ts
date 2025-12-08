export abstract class Component {
  // Use a static property for the type key to enforce consistency
  static readonly TYPE: string;
  abstract readonly _type: string;
}

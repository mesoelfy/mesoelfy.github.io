import { Entity } from './Entity';

export interface QueryDef {
  all?: string[];  // Must have ALL these components
  any?: string[];  // Must have AT LEAST ONE of these
  none?: string[]; // Must NOT have any of these
}

export class Query {
  public readonly id: string;
  public readonly def: QueryDef;

  constructor(def: QueryDef) {
    this.def = def;
    // Generate a unique signature for this query to use as a Map key
    this.id = `ALL:${(def.all || []).sort().join(',')}|ANY:${(def.any || []).sort().join(',')}|NONE:${(def.none || []).sort().join(',')}`;
  }

  public matches(entity: Entity): boolean {
    if (this.def.all) {
      for (const type of this.def.all) {
        if (!entity.hasComponent(type)) return false;
      }
    }

    if (this.def.none) {
      for (const type of this.def.none) {
        if (entity.hasComponent(type)) return false;
      }
    }

    if (this.def.any && this.def.any.length > 0) {
      let hasAny = false;
      for (const type of this.def.any) {
        if (entity.hasComponent(type)) {
          hasAny = true;
          break;
        }
      }
      if (!hasAny) return false;
    }

    return true;
  }
}

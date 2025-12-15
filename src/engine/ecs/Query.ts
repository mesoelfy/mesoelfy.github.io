import { Entity } from './Entity';
import { ComponentType } from './ComponentType';

export interface QueryDef {
  all?: ComponentType[];  // Must have ALL
  any?: ComponentType[];  // Must have AT LEAST ONE
  none?: ComponentType[]; // Must NOT have any
}

export class Query {
  public readonly id: string;
  public readonly def: QueryDef;

  constructor(def: QueryDef) {
    this.def = def;
    // Generate signature. Sort ensures order independence.
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

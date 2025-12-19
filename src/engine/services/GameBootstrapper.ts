import { EngineFactory } from './EngineFactory';

export const GameBootstrapper = () => {
  return EngineFactory.create('DESKTOP');
};

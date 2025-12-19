import { EngineFactory } from './EngineFactory';

export const MobileBootstrapper = () => {
  return EngineFactory.create('MOBILE');
};

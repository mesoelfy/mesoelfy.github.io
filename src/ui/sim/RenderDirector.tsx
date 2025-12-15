import { useEffect, useState } from 'react';
import { RenderRegistry } from '@/ui/sim/registry/RenderRegistry';
import { registerAllRenderers } from '@/ui/sim/registry/RenderCatalog';

// Flag to ensure we only register once per session
let hasRegistered = false;

export const RenderDirector = () => {
  const [renderers, setRenderers] = useState<React.ComponentType[]>([]);

  useEffect(() => {
    if (!hasRegistered) {
      registerAllRenderers();
      hasRegistered = true;
    }
    setRenderers(RenderRegistry.getAll());
  }, []);

  return (
    <>
      {renderers.map((Component, index) => (
        <Component key={index} />
      ))}
    </>
  );
};

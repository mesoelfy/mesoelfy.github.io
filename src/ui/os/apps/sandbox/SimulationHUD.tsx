import { useStore } from '@/engine/state/global/useStore';
import { HoloLayout } from './layout/HoloLayout';
import { AudioMatrix } from './AudioMatrix';
import { ArenaLab } from './ArenaLab';
import { ModelInspector } from './ModelInspector';

export const SimulationHUD = () => {
  const { sandboxView } = useStore();

  return (
    <HoloLayout>
        {sandboxView === 'audio' && <AudioMatrix />}
        
        {/* Arena is an Overlay on top of the canvas, so we render it transparently */}
        {sandboxView === 'arena' && (
            <div className="h-full flex items-start justify-end pointer-events-none">
                <ArenaLab />
            </div>
        )}

        {/* Gallery is also an overlay controlling the separate stage */}
        {sandboxView === 'gallery' && <ModelInspector />}
    </HoloLayout>
  );
};

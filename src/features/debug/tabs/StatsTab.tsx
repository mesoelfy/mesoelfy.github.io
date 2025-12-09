import { Cpu, Database, LayoutTemplate } from 'lucide-react';
import { useStore } from '@/core/store/useStore';

interface StatsTabProps {
  stats: { active: number, pooled: number, total: number, fps: number };
}

export const StatsTab = ({ stats }: StatsTabProps) => {
  const { toggleDebugMinimize } = useStore();
  
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <h3 className="text-xs text-primary-green-dim border-b border-primary-green-dim/30 pb-1 mb-2">ENTITY_REGISTRY</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-primary-green/5 p-4 border border-primary-green/20">
              <div className="flex items-center gap-2 text-primary-green-dim mb-2 text-xs"><Cpu size={14} /> ACTIVE ENTITIES</div>
              <div className="text-3xl font-bold text-primary-green">{stats.active}</div>
          </div>
          <div className="bg-primary-green/5 p-4 border border-primary-green/20">
              <div className="flex items-center gap-2 text-primary-green-dim mb-2 text-xs"><Database size={14} /> MEMORY POOL</div>
              <div className="text-3xl font-bold text-primary-green-dim">{stats.pooled} <span className="text-xs font-normal opacity-50">/ {stats.total}</span></div>
          </div>
        </div>
      </div>
      <div className="space-y-3">
        <h3 className="text-xs text-primary-green-dim border-b border-primary-green-dim/30 pb-1 mb-2">RENDER_PIPELINE</h3>
        <div className="p-4 border border-primary-green/20 bg-black">
            <div className="flex justify-between items-end">
                <span className="text-xs text-primary-green-dim">FRAME_RATE</span>
                <span className="text-xl font-bold text-primary-green">{stats.fps} FPS</span>
            </div>
            <div className="w-full h-1 bg-gray-900 mt-2">
                <div className="h-full bg-primary-green" style={{ width: `${Math.min(100, (stats.fps / 60) * 100)}%` }} />
            </div>
        </div>
      </div>
      
      <div className="mt-8 flex justify-center">
          <button onClick={toggleDebugMinimize} className="flex items-center gap-2 text-xs text-primary-green hover:text-white transition-colors border border-primary-green/50 px-4 py-2 hover:bg-primary-green/10">
              <LayoutTemplate size={14} /> SWITCH TO MINI_MODE
          </button>
      </div>
    </div>
  );
};

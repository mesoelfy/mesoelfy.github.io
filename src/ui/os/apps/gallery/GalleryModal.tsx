import { ModalContainer } from '@/ui/os/overlays/ModalContainer';
import gallery from '@/engine/config/static/gallery.json';
import { Filter, ZoomIn } from 'lucide-react';
import { useState, useMemo, useEffect } from 'react';
import { useStore } from '@/engine/state/global/useStore';
import { AudioSystem } from '@/engine/audio/AudioSystem';
import { clsx } from 'clsx';

export const GalleryModal = () => {
  const { selectedArtId, setSelectedArtId } = useStore();
  
  const initialFilter = useMemo(() => {
      if (selectedArtId) {
          const item = gallery.find(i => i.uniqueId === selectedArtId);
          return item ? item.category : 'ALL';
      }
      return 'ALL';
  }, [selectedArtId]);

  const [filter, setFilter] = useState(initialFilter);
  
  useEffect(() => {
      if (selectedArtId) {
          const item = gallery.find(i => i.uniqueId === selectedArtId);
          if (item) setFilter(item.category);
      }
  }, [selectedArtId]);

  const categories = useMemo(() => {
      const cats = new Set(gallery.map(i => i.category));
      return ['ALL', ...Array.from(cats).sort()];
  }, []);

  const displayItems = useMemo(() => {
      let items = filter === 'ALL' 
          ? [...gallery] 
          : gallery.filter(item => item.category === filter);
      
      items.sort((a, b) => parseInt(a.id) - parseInt(b.id));

      if (selectedArtId) {
          const index = items.findIndex(i => i.uniqueId === selectedArtId);
          if (index > -1) {
              const selected = items[index];
              items.splice(index, 1);
              items.unshift(selected);
          }
      }
      return items;
  }, [filter, selectedArtId]);

  const handleFilter = (cat: string) => {
      setFilter(cat);
      setSelectedArtId(null); 
      AudioSystem.playClick();
  };

  return (
    <ModalContainer title="ARCHIVE_DB // VISUAL_SPECS" type="gallery" widthClass="max-w-[95vw]">
      <div className="flex flex-col h-full bg-[#050505]">
        
        {/* TOP BAR */}
        <div className="flex flex-col gap-4 px-6 py-6 border-b border-white/10 bg-black/40 shrink-0 relative z-20">
          <div className="flex items-center gap-2 text-primary-green opacity-50 mb-2">
              <Filter size={16} />
              <span className="text-[10px] font-bold tracking-widest">FILTER_MATRIX:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.map(cat => (
                <button
                key={cat}
                onClick={() => handleFilter(cat)}
                className={clsx(
                    "px-3 py-1.5 text-[10px] font-bold font-mono tracking-wider border transition-all uppercase whitespace-nowrap rounded-sm",
                    filter === cat 
                    ? "bg-primary-green text-black border-primary-green shadow-[0_0_10px_rgba(120,246,84,0.3)]" 
                    : "text-gray-500 border-white/10 hover:text-white hover:border-white/30 hover:bg-white/5"
                )}
                >
                {cat}
                </button>
            ))}
          </div>
        </div>

        {/* CONTENT: FLEX ROW LAYOUT (Left-to-Right, Fixed Height) */}
        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-primary-green/20 relative z-10 bg-[#020202]">
          
          <div className="flex flex-wrap gap-0">
            {displayItems.map((item) => {
                const isSelected = item.uniqueId === selectedArtId;
                
                return (
                    // h-96 = 24rem = 384px height on desktop
                    // flex-grow allows it to fill partial rows if needed, but primarily expanding based on image aspect
                    <div key={item.uniqueId} className="relative group flex-grow-0 h-48 md:h-72 lg:h-96">
                        <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block relative h-full w-auto cursor-zoom-in"
                            onClick={() => AudioSystem.playClick()}
                            onMouseEnter={() => AudioSystem.playHover()}
                        >
                            <img 
                                src={item.src || item.thumb}
                                alt={item.title}
                                loading="lazy"
                                className={clsx(
                                    "h-full w-auto object-cover transition-all ease-out will-change-transform",
                                    "duration-500 group-hover:duration-75",
                                    "group-hover:blur-[2px] group-hover:invert group-hover:opacity-75"
                                )}
                            />
                            
                            {/* HOVER OVERLAY */}
                            <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-75 ease-in z-10 pointer-events-none">
                                <div className="flex flex-col items-center gap-3">
                                    <div className="p-3 border-2 border-primary-green rounded-full bg-black/80 text-primary-green shadow-[0_0_20px_#78F654]">
                                        <ZoomIn size={24} />
                                    </div>
                                    <div className="bg-black/90 px-3 py-1 border-x-2 border-primary-green">
                                        <span className="text-[10px] font-header font-black text-primary-green tracking-widest uppercase">
                                            ACCESS_FULL_RES
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Selected Marker */}
                            {isSelected && (
                                <div className="absolute top-0 right-0 p-1 z-20">
                                    <div className="w-2 h-2 bg-primary-green animate-pulse shadow-[0_0_10px_#78F654]" />
                                </div>
                            )}
                        </a>
                    </div>
                );
            })}
            
            {/* Spacer to push last row left if using flex-grow on items (optional) */}
            <div className="flex-grow-[10]" />
          </div>
          
          <div className="h-24 w-full flex items-center justify-center opacity-30 mt-8 bg-[#050505]">
              <span className="text-[10px] font-mono">
                  // DATABASE_END
              </span>
          </div>
        </div>
      </div>
    </ModalContainer>
  );
};

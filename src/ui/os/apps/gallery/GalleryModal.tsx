import { ModalContainer } from '@/ui/os/overlays/ModalContainer';
import gallery from '@/engine/config/static/gallery.json';
import { Filter, ZoomIn, Tag as TagIcon } from 'lucide-react';
import { useState, useMemo, useEffect } from 'react';
import { useStore } from '@/engine/state/global/useStore';
import { AudioSystem } from '@/engine/audio/AudioSystem';
import { clsx } from 'clsx';

// Type assertion for the JSON import since we just modified it
type GalleryItem = typeof gallery[0] & { tags: string[] };

export const GalleryModal = () => {
  const { selectedArtId, setSelectedArtId } = useStore();
  const items = gallery as GalleryItem[];
  
  // Initialize filter based on the selected item's primary category
  const initialFilter = useMemo(() => {
      if (selectedArtId) {
          const item = items.find(i => i.uniqueId === selectedArtId);
          return item ? item.category : 'ALL';
      }
      return 'ALL';
  }, [selectedArtId, items]);

  const [filter, setFilter] = useState(initialFilter);
  
  // Sync filter when opening specific art from dashboard
  useEffect(() => {
      if (selectedArtId) {
          const item = items.find(i => i.uniqueId === selectedArtId);
          if (item) setFilter(item.category);
      }
  }, [selectedArtId, items]);

  // Generate Unique Tags List
  const allTags = useMemo(() => {
      const tagSet = new Set<string>();
      items.forEach(item => {
          if (item.tags) item.tags.forEach(t => tagSet.add(t));
          else tagSet.add(item.category); // Fallback
      });
      return ['ALL', ...Array.from(tagSet).sort()];
  }, [items]);

  const displayItems = useMemo(() => {
      let filtered = filter === 'ALL' 
          ? [...items] 
          : items.filter(item => item.tags ? item.tags.includes(filter) : item.category === filter);
      
      // Sort by ID descending
      filtered.sort((a, b) => parseInt(a.id) - parseInt(b.id));

      // If an item is "Selected" (clicked from dashboard), bump it to top
      if (selectedArtId) {
          const index = filtered.findIndex(i => i.uniqueId === selectedArtId);
          if (index > -1) {
              const selected = filtered[index];
              filtered.splice(index, 1);
              filtered.unshift(selected);
          }
      }
      return filtered;
  }, [filter, selectedArtId, items]);

  const handleFilter = (tag: string) => {
      setFilter(tag);
      setSelectedArtId(null); 
      AudioSystem.playClick();
  };

  return (
    <ModalContainer title="ARCHIVE_DB // VISUAL_SPECS" type="gallery" widthClass="max-w-[95vw]">
      <div className="flex flex-col h-full bg-[#050505]">
        
        {/* TOP BAR: Filter Matrix */}
        <div className="flex flex-col gap-4 px-6 py-6 border-b border-white/10 bg-black/40 shrink-0 relative z-20">
          <div className="flex items-center gap-2 text-primary-green opacity-50 mb-2">
              <Filter size={16} />
              <span className="text-[10px] font-bold tracking-widest">FILTER_MATRIX:</span>
          </div>
          <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 pr-2">
            {allTags.map(tag => (
                <button
                key={tag}
                onClick={() => handleFilter(tag)}
                className={clsx(
                    "px-3 py-1.5 text-[10px] font-bold font-mono tracking-wider border transition-all uppercase whitespace-nowrap rounded-sm",
                    filter === tag 
                    ? "bg-primary-green text-black border-primary-green shadow-[0_0_10px_rgba(120,246,84,0.3)]" 
                    : "text-gray-500 border-white/10 hover:text-white hover:border-white/30 hover:bg-white/5"
                )}
                >
                {tag}
                </button>
            ))}
          </div>
        </div>

        {/* CONTENT */}
        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-primary-green/20 relative z-10 bg-[#020202]">
          
          <div className="flex flex-wrap gap-0">
            {displayItems.map((item) => {
                const isSelected = item.uniqueId === selectedArtId;
                
                return (
                    <div key={item.uniqueId} className="relative group flex-grow-0 h-48 md:h-72 lg:h-96 w-auto aspect-[2/3] md:aspect-auto">
                        <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block relative h-full w-full cursor-zoom-in"
                            onClick={() => AudioSystem.playClick()}
                            onMouseEnter={() => AudioSystem.playHover()}
                        >
                            <img 
                                src={item.src || item.thumb}
                                alt={item.title}
                                loading="lazy"
                                className={clsx(
                                    "h-full w-full object-cover transition-all ease-out will-change-transform",
                                    "duration-500 group-hover:duration-75",
                                    "group-hover:blur-[2px] group-hover:invert group-hover:opacity-75"
                                )}
                            />
                            
                            {/* HOVER OVERLAY */}
                            <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-75 ease-in z-10 pointer-events-none p-4">
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
                                {/* Tags Preview on Hover */}
                                <div className="absolute bottom-2 left-2 flex flex-wrap gap-1">
                                    {item.tags && item.tags.slice(0, 3).map(t => (
                                        <span key={t} className="text-[8px] bg-black/80 text-white px-1 border border-white/10">{t}</span>
                                    ))}
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

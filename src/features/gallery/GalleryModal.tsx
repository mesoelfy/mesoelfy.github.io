import { ModalContainer } from '@/ui/overlays/ModalContainer';
import gallery from '@/data/gallery.json';
import { ExternalLink, Image as ImageIcon } from 'lucide-react';
import { useState } from 'react';

export const GalleryModal = () => {
  const [filter, setFilter] = useState('ALL');
  
  // Get unique categories
  const categories = ['ALL', ...Array.from(new Set(gallery.map(item => item.category)))];

  const filteredGallery = filter === 'ALL' 
    ? gallery 
    : gallery.filter(item => item.category === filter);

  return (
    <ModalContainer title="ART_DATABASE // VISUALS" type="gallery">
      <div className="flex flex-col h-full gap-6">
        
        {/* Category Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 border-b border-primary-green-dim/30">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-4 py-1 font-mono text-sm border transition-all ${
                filter === cat 
                  ? 'bg-primary-green text-black border-primary-green' 
                  : 'text-primary-green-dim border-primary-green-dim/30 hover:text-primary-green hover:border-primary-green'
              }`}
            >
              [{cat}]
            </button>
          ))}
        </div>

        {/* The Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredGallery.map((item) => (
            <a
              key={item.id}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative aspect-video bg-black border border-primary-green-dim/30 hover:border-primary-green transition-all overflow-hidden"
            >
              {/* Placeholder Graphic (Since we have no images yet) */}
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-primary-green-dark/10 group-hover:bg-primary-green-dark/20 transition-colors">
                <ImageIcon className="w-12 h-12 text-primary-green-dim/20 group-hover:text-primary-green group-hover:scale-110 transition-all duration-500" />
                <span className="mt-2 text-xs text-primary-green-dim/40 font-mono">ENCRYPTED_IMG</span>
              </div>

              {/* Overlay Info */}
              <div className="absolute inset-x-0 bottom-0 p-3 bg-black/80 backdrop-blur-sm border-t border-primary-green-dim/30 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                <h4 className="text-primary-green font-bold text-sm">{item.title}</h4>
                <div className="flex items-center gap-1 text-[10px] text-latent-purple-light mt-1">
                  <span>OPEN_ON_X</span>
                  <ExternalLink size={10} />
                </div>
              </div>
              
              {/* Corner accent */}
              <div className="absolute top-0 right-0 w-0 h-0 border-t-[20px] border-t-primary-green/20 border-l-[20px] border-l-transparent" />
            </a>
          ))}
        </div>
      </div>
    </ModalContainer>
  );
};

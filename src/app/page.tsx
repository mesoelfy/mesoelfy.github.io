'use client';

import { useStore } from '@/core/store/useStore';
import { SceneCanvas } from '@/scene/canvas/SceneCanvas';
import { MiniCrystalCanvas } from '@/scene/props/MiniCrystalCanvas';
import { GlassPanel } from '@/ui/atoms/GlassPanel';
import { SocialRow } from '@/ui/molecules/SocialRow';
import { LiveArtGrid } from '@/ui/molecules/LiveArtGrid';
import { HoloCommLog } from '@/ui/molecules/HoloCommLog';
import { Header } from '@/ui/organisms/Header';
import { Footer } from '@/ui/organisms/Footer';
import { AboutModal } from '@/features/identity/AboutModal';
import { FeedModal } from '@/features/feed/FeedModal';
import { GalleryModal } from '@/features/gallery/GalleryModal';
import { ContactModal } from '@/features/contact/ContactModal';
import { MatrixBootSequence } from '@/features/intro/MatrixBootSequence';
import { AudioSystem } from '@/core/audio/AudioSystem'; // Import Audio
import identity from '@/data/identity.json';
import { useState } from 'react';
import { motion } from 'framer-motion';

export default function Home() {
  const { openModal } = useStore();
  const [bootState, setBootState] = useState<'standby' | 'active'>('standby');

  const handleBootComplete = () => {
    setTimeout(() => {
      setBootState('active');
    }, 1000);
  };

  const playHover = () => AudioSystem.playHover(); // Helper

  return (
    <main className="relative w-full h-screen flex flex-col overflow-hidden text-elfy-green selection:bg-elfy-green selection:text-black font-mono">
      
      <SceneCanvas className="opacity-100 blur-0" />

      <AboutModal />
      <FeedModal />
      <GalleryModal />
      <ContactModal />

      {bootState === 'standby' && (
        <MatrixBootSequence onComplete={handleBootComplete} />
      )}

      <div className={`flex-1 flex flex-col h-full transition-all duration-1000 ease-in-out ${bootState === 'active' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        
        <Header />

        <motion.div 
          className="flex-1 p-4 md:p-6 grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6 overflow-y-auto md:overflow-hidden max-w-[1600px] mx-auto w-full scrollbar-thin scrollbar-thumb-elfy-green scrollbar-track-black"
          initial="hidden"
          animate={bootState === 'active' ? "visible" : "hidden"}
          variants={{
            hidden: { opacity: 0 },
            visible: { 
              opacity: 1, 
              transition: { 
                staggerChildren: 0.3,
                delayChildren: 0.2 
              } 
            }
          }}
        >
          {/* LEFT COLUMN */}
          <div className="md:col-span-4 flex flex-col gap-4 md:gap-6 h-auto">
            <GlassPanel title="IDENTITY_CORE" className="flex-1 min-h-0">
              <div className="flex flex-col items-center h-full justify-between py-2 gap-4">
                <div className="w-40 h-40 md:w-48 md:h-48 rounded-full border-4 border-elfy-purple shadow-[0_0_30px_rgba(158,78,165,0.4)] bg-black/50 overflow-hidden relative group">
                   <div className="absolute inset-0 opacity-80 group-hover:opacity-100 transition-opacity">
                      <MiniCrystalCanvas />
                   </div>
                </div>
                <div className="text-center space-y-1">
                  <h2 className="text-4xl md:text-5xl font-header font-black text-elfy-green tracking-wide drop-shadow-md">{identity.name}</h2>
                  <div className="inline-block px-3 py-1 border border-elfy-purple-dim rounded-full text-[10px] font-bold text-elfy-purple-light uppercase tracking-widest bg-elfy-purple-deep/40">{identity.class}</div>
                </div>
                <div className="flex w-full gap-3 mt-2">
                  <button 
                    onClick={() => openModal('about')} 
                    onMouseEnter={playHover}
                    className="flex-1 py-3 bg-elfy-purple-deep/40 border border-elfy-purple text-elfy-purple-light hover:bg-elfy-purple hover:text-black hover:border-elfy-purple transition-all font-bold text-sm md:text-base font-header font-black uppercase clip-corner-btn"
                  >
                    About Me
                  </button>
                  <button 
                    onClick={() => openModal('contact')} 
                    onMouseEnter={playHover}
                    className="flex-1 py-3 bg-elfy-yellow/10 border border-elfy-yellow text-elfy-yellow hover:bg-elfy-yellow hover:text-black transition-all font-bold text-sm md:text-base font-header font-black uppercase clip-corner-btn"
                  >
                    Contact
                  </button>
                </div>
              </div>
            </GlassPanel>

            <GlassPanel title="SOCIAL_UPLINK" className="h-auto shrink-0">
               <SocialRow />
            </GlassPanel>
          </div>

          {/* RIGHT COLUMN */}
          <div className="md:col-span-8 flex flex-col gap-4 md:gap-6 h-auto">
            <GlassPanel title="LATEST_LOGS" className="h-48 md:h-64 shrink-0">
              <div className="flex flex-col items-center justify-center h-full text-elfy-green-dim font-mono text-sm border border-dashed border-elfy-green-dim/30 m-2 bg-black/20">
                <p className="animate-pulse mb-4">> ESTABLISHING UPLINK...</p>
                <button 
                  onClick={() => openModal('feed')} 
                  onMouseEnter={playHover}
                  className="px-6 py-2 border border-elfy-green text-elfy-green hover:bg-elfy-green hover:text-black transition-colors uppercase tracking-wider font-header font-black text-base md:text-lg"
                >
                  [ ACCESS TERMINAL ]
                </button>
              </div>
            </GlassPanel>

            <div className="flex flex-col md:flex-row gap-4 md:gap-6 items-start h-auto">
              <GlassPanel title="ART_DB" className="flex-1 h-auto">
                 <LiveArtGrid />
              </GlassPanel>

              <GlassPanel title="HOLO_COMM" className="w-full md:w-[45%] shrink-0 h-auto">
                 <HoloCommLog />
              </GlassPanel>
            </div>
          </div>
        </motion.div>
        
        <Footer />
      </div>
    </main>
  );
}

'use client';

import { useStore } from '@/core/store/useStore';
import { useGameStore } from '@/game/store/useGameStore';
import { SceneCanvas } from '@/scene/canvas/SceneCanvas';
import { GlassPanel } from '@/ui/atoms/GlassPanel';
import { SocialRow } from '@/ui/molecules/SocialRow';
import { LiveArtGrid } from '@/ui/molecules/LiveArtGrid';
import { HoloCommLog } from '@/ui/molecules/HoloCommLog';
import { IdentityHUD } from '@/ui/molecules/IdentityHUD';
import { Header } from '@/ui/organisms/Header';
import { Footer } from '@/ui/organisms/Footer';
import { AboutModal } from '@/features/identity/AboutModal';
import { FeedModal } from '@/features/feed/FeedModal';
import { GalleryModal } from '@/features/gallery/GalleryModal';
import { ContactModal } from '@/features/contact/ContactModal';
import { MatrixBootSequence } from '@/features/intro/MatrixBootSequence';
import { GameOverlay } from '@/game/GameOverlay';
import { AudioSystem } from '@/core/audio/AudioSystem';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CustomCursor } from '@/ui/atoms/CustomCursor';
import { ZenBomb } from '@/ui/atoms/ZenBomb';
import { DebugOverlay } from '@/features/debug/DebugOverlay';
import { SimulationHUD } from '@/features/sandbox/SimulationHUD';
import { WebGLErrorBoundary } from '@/ui/overlays/ErrorBoundary';
import { clsx } from 'clsx';

export default function Home() {
  const { openModal, setIntroDone, bootState, setBootState, isBreaching, startBreach } = useStore(); 
  const startGame = useGameStore(s => s.startGame);
  const recalcIntegrity = useGameStore(s => s.recalculateIntegrity);
  const systemIntegrity = useGameStore(s => s.systemIntegrity);
  const isZenMode = useGameStore(s => s.isZenMode);
  
  const isGameOver = systemIntegrity <= 0;
  const isSandbox = bootState === 'sandbox';

  const handleBreachStart = () => {
    AudioSystem.init();
    startBreach();
  };

  const handleBootComplete = () => {
    setTimeout(() => {
      setBootState('active');
      setIntroDone(true);
      startGame();
    }, 200);
  };

  useEffect(() => {
    if (bootState !== 'active') return;
    const interval = setInterval(recalcIntegrity, 500);
    return () => clearInterval(interval);
  }, [bootState, recalcIntegrity]);

  const isSceneVisible = bootState !== 'standby' || isBreaching;

  return (
    <div id="global-app-root" className="relative w-full h-screen overflow-hidden cursor-none bg-black">
      
      <CustomCursor />
      <DebugOverlay />

      <main className="relative w-full h-full flex flex-col overflow-hidden text-elfy-green selection:bg-elfy-green selection:text-black font-mono">
        
        <WebGLErrorBoundary>
            <SceneCanvas className={clsx("blur-0 transition-opacity duration-[2000ms]", isSceneVisible ? "opacity-100" : "opacity-0")} />
            
            <div className={clsx("absolute inset-0 z-[60] transition-opacity duration-[2000ms] pointer-events-none", isSceneVisible ? "opacity-100" : "opacity-0")}>
                <GameOverlay />
            </div>
        </WebGLErrorBoundary>

        {isSandbox && <SimulationHUD />}

        {!isSandbox && (
            <>
                <AboutModal />
                <FeedModal />
                <GalleryModal />
                <ContactModal />
                <ZenBomb />
            </>
        )}

        {bootState === 'standby' && (
          <MatrixBootSequence 
             onComplete={handleBootComplete} 
             onBreachStart={handleBreachStart} 
          />
        )}

        {!isSandbox && (
            <div className={`relative z-10 flex-1 flex flex-col h-full transition-all duration-1000 ease-in-out ${bootState === 'active' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              <Header />

              <div className="flex-1 min-h-0 relative w-full max-w-[1600px] mx-auto p-4 md:p-6">
                <AnimatePresence>
                  {!isZenMode && (
                    <motion.div 
                      className={clsx(
                          "grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6 h-full w-full scrollbar-thin scrollbar-thumb-elfy-green scrollbar-track-black",
                          isGameOver ? "overflow-visible" : "overflow-y-auto md:overflow-hidden"
                      )}
                      initial="hidden"
                      animate="visible"
                      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.5 } }}
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
                      {/* IDENTITY COLUMN */}
                      <div className="md:col-span-4 flex flex-col gap-4 md:gap-6 h-auto">
                        
                        {/* Shorter Identity Core (Flex-1 fills remaining space) */}
                        <GlassPanel title="IDENTITY_CORE" className="flex-1 min-h-0" gameId="identity">
                          <IdentityHUD />
                        </GlassPanel>

                        {/* Taller Social Uplink (Fixed Height) */}
                        <GlassPanel title="SOCIAL_UPLINK" className="h-52 shrink-0" gameId="social">
                           <SocialRow />
                        </GlassPanel>
                      </div>

                      {/* CONTENT COLUMN */}
                      <div className="md:col-span-8 flex flex-col gap-4 md:gap-6 h-auto">
                        <GlassPanel title="LATEST_LOGS" className="h-48 md:h-64 shrink-0" gameId="feed">
                          <div className="w-full h-full flex items-center justify-center p-4">
                            <div className="flex flex-col items-center justify-center gap-4 border border-dashed border-elfy-green-dim/30 bg-black/20 p-8">
                              <p className="animate-pulse text-elfy-green-dim text-xs">&gt; ESTABLISHING UPLINK...</p>
                              <button 
                                onClick={() => openModal('feed')} 
                                className="px-6 py-2 border border-elfy-green text-elfy-green hover:bg-elfy-green hover:text-black transition-colors uppercase tracking-wider font-header font-black text-base md:text-lg whitespace-nowrap"
                              >
                                [ ACCESS TERMINAL ]
                              </button>
                            </div>
                          </div>
                        </GlassPanel>

                        <div className="flex flex-col md:flex-row gap-4 md:gap-6 items-start h-auto">
                          <GlassPanel title="ART_DB" className="flex-1 h-auto" gameId="art">
                             <LiveArtGrid />
                          </GlassPanel>

                          <GlassPanel title="HOLO_COMM" className="w-full md:w-[45%] shrink-0 h-auto" gameId="video">
                             <HoloCommLog />
                          </GlassPanel>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              
              <Footer />
            </div>
        )}
      </main>
    </div>
  );
}

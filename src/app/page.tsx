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
import { SettingsModal } from '@/features/settings/SettingsModal';
import { MatrixBootSequence } from '@/features/intro/MatrixBootSequence';
import { MobileExperience } from '@/features/mobile/MobileExperience'; 
import { GameOverlay } from '@/game/GameOverlay';
import { AudioSystem } from '@/core/audio/AudioSystem';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CustomCursor } from '@/ui/atoms/CustomCursor';
import { ZenBomb } from '@/ui/atoms/ZenBomb';
import { DebugOverlay } from '@/features/debug/DebugOverlay';
import { SimulationHUD } from '@/features/sandbox/SimulationHUD';
import { WebGLErrorBoundary } from '@/ui/overlays/ErrorBoundary';
import { GlobalBackdrop } from '@/ui/overlays/GlobalBackdrop'; 
import { MetaManager } from '@/features/meta/MetaManager'; 
import { RotationLock } from '@/ui/overlays/RotationLock';
import { clsx } from 'clsx';

export default function Home() {
  const { 
    openModal, 
    setIntroDone, 
    bootState, 
    setBootState, 
    isBreaching, 
    startBreach, 
    activeModal, 
    isDebugOpen, 
    isDebugMinimized,
    setSimulationPaused 
  } = useStore(); 
  
  const startGame = useGameStore(s => s.startGame);
  const recalcIntegrity = useGameStore(s => s.recalculateIntegrity);
  const systemIntegrity = useGameStore(s => s.systemIntegrity);
  const isZenMode = useGameStore(s => s.isZenMode);
  
  const isGameOver = systemIntegrity <= 0;
  const isSandbox = bootState === 'sandbox';
  const isMobileLockdown = bootState === 'mobile_lockdown'; 

  // --- SCALING LOGIC ---
  const [dashboardScale, setDashboardScale] = useState(1);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const handleResize = () => {
        if (!contentRef.current) return;
        if (window.innerWidth >= 1024) {
            const HEADER_H = 48;
            const FOOTER_H = 32;
            const PADDING_Y = 48; 
            const availableHeight = window.innerHeight - HEADER_H - FOOTER_H;
            const naturalHeight = contentRef.current.scrollHeight + PADDING_Y;
            const ratio = Math.min(1, availableHeight / naturalHeight);
            setDashboardScale(Math.floor(ratio * 1000) / 1000);
        } else {
            setDashboardScale(1);
        }
    };

    const debouncedResize = () => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(handleResize, 100);
    };

    handleResize();
    const observer = new ResizeObserver(debouncedResize);
    if (contentRef.current) observer.observe(contentRef.current);
    window.addEventListener('resize', debouncedResize);
    
    return () => {
        window.removeEventListener('resize', debouncedResize);
        observer.disconnect();
        clearTimeout(timeoutId);
    };
  }, [bootState]); 

  // --- MASTER PAUSE LOGIC ---
  useEffect(() => {
    // Only active during the game
    if (bootState !== 'active') return;

    const checkPauseState = () => {
        const isMenuOpen = activeModal !== 'none';
        const isDebugActive = isDebugOpen && !isDebugMinimized;
        
        // Portrait check (Mobile only)
        const isPortrait = window.matchMedia("(orientation: portrait)").matches;
        const isSmallScreen = window.innerWidth < 768;
        const isRotationLocked = isPortrait && isSmallScreen;

        if (isMenuOpen || isDebugActive || isRotationLocked) {
            setSimulationPaused(true);
        } else {
            setSimulationPaused(false);
        }
    };

    // Run immediately
    checkPauseState();

    // Listen for resize (orientation changes)
    window.addEventListener('resize', checkPauseState);
    return () => window.removeEventListener('resize', checkPauseState);
  }, [bootState, activeModal, isDebugOpen, isDebugMinimized, setSimulationPaused]);

  useEffect(() => {
      AudioSystem.init();
  }, []);

  const handleBreachStart = () => {
    AudioSystem.playSound('initialize_impact');
    startBreach();
  };

  const handleBootComplete = () => {
    setTimeout(() => {
      setBootState('active');
      setIntroDone(true);
      AudioSystem.startMusic(); 
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
      
      <MetaManager />
      {!isMobileLockdown && <RotationLock />}
      <CustomCursor />
      <GlobalBackdrop />
      <DebugOverlay />

      <main className="relative w-full h-full flex flex-col overflow-hidden text-primary-green selection:bg-primary-green selection:text-black font-mono">
        
        <WebGLErrorBoundary>
            <SceneCanvas className={clsx("blur-0 transition-opacity duration-[2000ms]", isSceneVisible ? "opacity-100" : "opacity-0")} />
            
            {!isMobileLockdown && (
                <div className={clsx("absolute inset-0 z-[60] transition-opacity duration-[2000ms] pointer-events-none", isSceneVisible ? "opacity-100" : "opacity-0")}>
                    <GameOverlay />
                </div>
            )}
        </WebGLErrorBoundary>

        {isSandbox && <SimulationHUD />}

        {!isSandbox && !isMobileLockdown && (
            <>
                <AboutModal />
                <FeedModal />
                <GalleryModal />
                <ContactModal />
                <SettingsModal />
                <ZenBomb />
            </>
        )}

        {bootState === 'standby' && (
          <MatrixBootSequence 
             onComplete={handleBootComplete} 
             onBreachStart={handleBreachStart} 
          />
        )}

        {isMobileLockdown && <MobileExperience />}

        {!isSandbox && !isMobileLockdown && (
            <div className={`relative z-10 flex-1 flex flex-col h-full transition-all duration-1000 ease-in-out ${bootState === 'active' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              <Header />

              <div className={clsx(
                  "flex-1 min-h-0 relative w-full overflow-hidden", // SCROLLBAR FIX: FORCE HIDDEN
                  // We rely on the scaler to fit content. If content is too big, it scales down. 
                  // No scrolling allowed in dashboard mode.
              )}>
                
                {/* SCALING WRAPPER */}
                <div 
                    className="w-full origin-top transition-transform duration-300 ease-out"
                    style={{ 
                        transform: `scale(${dashboardScale})`,
                        marginBottom: `-${(1 - dashboardScale) * 100}%` 
                    }}
                >
                    <div ref={contentRef} className="w-full max-w-[1600px] mx-auto p-4 md:p-6">
                    <AnimatePresence>
                        {!isZenMode && (
                        <motion.div 
                            className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6 w-full pb-8"
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
                            <GlassPanel title="IDENTITY_CORE" className="h-auto min-h-[400px]" gameId="identity">
                                <IdentityHUD />
                            </GlassPanel>

                            <GlassPanel title="SOCIAL_UPLINK" className="h-52 shrink-0" gameId="social">
                                <SocialRow />
                            </GlassPanel>
                            </div>

                            {/* CONTENT COLUMN */}
                            <div className="md:col-span-8 flex flex-col gap-4 md:gap-6 h-auto">
                            <GlassPanel title="LATEST_LOGS" className="h-[30vh] min-h-[150px] shrink-0" gameId="feed">
                                <div className="w-full h-full flex items-center justify-center p-4">
                                <div className="flex flex-col items-center justify-center gap-4 bg-black/20 p-8 w-full max-w-lg marching-ants [--ant-color:rgba(27,185,48,0.3)]">
                                    <p className="animate-pulse text-primary-green-dim text-xs tracking-widest font-bold">&gt; ESTABLISHING UPLINK...</p>
                                    <button 
                                    onClick={() => { AudioSystem.playClick(); openModal('feed'); }} 
                                    onMouseEnter={() => AudioSystem.playHover()}
                                    className="group w-full py-3 border border-primary-green-dim/50 text-primary-green font-header font-black text-lg tracking-[0.2em] uppercase transition-all duration-300 hover:border-alert-yellow hover:text-alert-yellow hover:shadow-[0_0_20px_rgba(234,231,71,0.3)] hover:bg-alert-yellow/5 relative overflow-hidden"
                                    >
                                    <span className="relative z-10 group-hover:translate-x-1 transition-transform duration-300 inline-block">
                                        [ ACCESS_TERMINAL ]
                                    </span>
                                    </button>
                                </div>
                                </div>
                            </GlassPanel>

                            <div className="flex flex-col md:flex-row gap-4 md:gap-6 items-start w-full">
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
                </div>
              </div>
              
              <Footer />
            </div>
        )}
      </main>
    </div>
  );
}

'use client';

import { useStore } from '@/engine/state/global/useStore';
import { useGameStore } from '@/engine/state/game/useGameStore';
import { SceneCanvas } from '@/ui/sim/SceneCanvas';
import { GlassPanel } from '@/ui/kit/atoms/GlassPanel';
import { SocialRow } from '@/ui/kit/molecules/SocialRow';
import { LiveArtGrid } from '@/ui/kit/molecules/LiveArtGrid';
import { HoloCommLog } from '@/ui/kit/molecules/HoloCommLog';
import { IdentityHUD } from '@/ui/kit/molecules/IdentityHUD';
import { Header } from '@/ui/os/desktop/Header';
import { Footer } from '@/ui/os/desktop/Footer';
import { AboutModal } from '@/ui/os/apps/identity/AboutModal';
import { FeedModal } from '@/ui/os/apps/feed/FeedModal';
import { GalleryModal } from '@/ui/os/apps/gallery/GalleryModal';
import { ContactModal } from '@/ui/os/apps/contact/ContactModal';
import { SettingsModal } from '@/ui/os/apps/settings/SettingsModal';
import { MatrixBootSequence } from '@/ui/os/boot/MatrixBootSequence';
import { MobileExperience } from '@/ui/os/apps/mobile/MobileExperience'; 
import { GameOverlay } from '@/ui/sim/GameCanvas';
import { AudioSystem } from '@/engine/audio/AudioSystem';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CustomCursor } from '@/ui/kit/atoms/CustomCursor';
import { ZenBomb } from '@/ui/kit/atoms/ZenBomb';
import { DebugOverlay } from '@/ui/os/apps/debug/DebugOverlay';
import { SimulationHUD } from '@/ui/os/apps/sandbox/SimulationHUD';
import { WebGLErrorBoundary } from '@/ui/os/overlays/ErrorBoundary';
import { GlobalBackdrop } from '@/ui/os/overlays/GlobalBackdrop'; 
import { MetaManager } from '@/ui/os/system/MetaManager'; 
import { RotationLock } from '@/ui/os/overlays/RotationLock';
import { FeedAccessTerminal } from '@/ui/kit/molecules/FeedAccessTerminal'; 
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
    setSimulationPaused,
    sessionId 
  } = useStore(); 
  
  const startGame = useGameStore(s => s.startGame);
  const systemIntegrity = useGameStore(s => s.systemIntegrity);
  const isZenMode = useGameStore(s => s.isZenMode);
  
  const isGameOver = systemIntegrity <= 0;
  const isSandbox = bootState === 'sandbox';
  const isMobileLockdown = bootState === 'mobile_lockdown'; 

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

  useEffect(() => {
    if (bootState !== 'active') return;

    const checkPauseState = () => {
        const isMenuOpen = activeModal !== 'none';
        const isDebugActive = isDebugOpen && !isDebugMinimized;
        const isPortrait = window.matchMedia("(orientation: portrait)").matches;
        const isSmallScreen = window.innerWidth < 768;
        const isRotationLocked = isPortrait && isSmallScreen;

        if (isMenuOpen || isDebugActive || isRotationLocked) {
            setSimulationPaused(true);
        } else {
            setSimulationPaused(false);
        }
    };

    checkPauseState();
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

  const isSceneVisible = bootState !== 'standby' || isBreaching;

  return (
    <div id="global-app-root" className="relative w-full h-screen overflow-hidden cursor-none bg-black">
      
      <MetaManager />
      {!isMobileLockdown && <RotationLock />}
      <CustomCursor />
      <GlobalBackdrop />
      <DebugOverlay />

      <main className="relative w-full h-full flex flex-col overflow-hidden text-primary-green selection:bg-primary-green selection:text-black font-mono">
        
        <WebGLErrorBoundary key={sessionId}>
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

              <div className="flex-1 min-h-0 relative w-full overflow-hidden">
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
                                staggerChildren: 0.05,
                                delayChildren: 0.0
                                } 
                            }
                            }}
                        >
                            <div className="md:col-span-4 flex flex-col gap-4 md:gap-6 h-auto">
                            <GlassPanel title="IDENTITY_CORE" className="h-auto min-h-[400px]" gameId="identity">
                                <IdentityHUD />
                            </GlassPanel>

                            <GlassPanel title="SOCIAL_UPLINK" className="h-52 shrink-0" gameId="social">
                                <SocialRow />
                            </GlassPanel>
                            </div>

                            <div className="md:col-span-8 flex flex-col gap-4 md:gap-6 h-auto">
                            <GlassPanel title="LATEST_LOGS" className="h-[30vh] min-h-[150px] shrink-0" gameId="feed">
                                <FeedAccessTerminal />
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

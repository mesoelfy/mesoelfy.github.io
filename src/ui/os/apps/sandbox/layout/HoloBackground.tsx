import { motion } from 'framer-motion';

export const HoloBackground = () => {
  return (
    <div className="fixed inset-0 z-[50] pointer-events-none overflow-hidden bg-[#020408]">
        {/* Deep Pulse */}
        <motion.div 
            className="absolute inset-0 bg-[radial-gradient(circle_at_center,#0b1a26_0%,#000000_100%)] opacity-80"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
        
        {/* Perspective Grid */}
        <div className="absolute inset-0 opacity-20" style={{ perspective: '1000px', transformStyle: 'preserve-3d' }}>
            <motion.div 
                className="absolute inset-[-100%] w-[300%] h-[300%] origin-center"
                style={{ 
                    backgroundImage: `linear-gradient(to right, rgba(0, 240, 255, 0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(0, 240, 255, 0.1) 1px, transparent 1px)`,
                    backgroundSize: '80px 80px',
                    transform: 'rotateX(60deg) translateZ(-200px)'
                }}
                animate={{ y: [0, 80] }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            />
        </div>
        
        {/* Noise & Texture */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay" />
        <div className="absolute inset-0 bg-[radial-gradient(circle,transparent_40%,#000_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,240,255,0.02)_50%)] bg-[length:100%_4px]" />
    </div>
  );
};

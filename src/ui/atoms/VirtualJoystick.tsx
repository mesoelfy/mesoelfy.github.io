import { useState, useRef, useEffect } from 'react';
import { ServiceLocator } from '@/game/core/ServiceLocator';
import { InputSystem } from '@/game/systems/InputSystem';

export const VirtualJoystick = () => {
  const [active, setActive] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const stickRef = useRef<HTMLDivElement>(null);
  
  // Configuration
  const MAX_RADIUS = 40;

  const handlePointerDown = (e: React.PointerEvent) => {
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setActive(true);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!active) return;
    
    // Calculate delta from center
    // We assume the stick is centered in the 100x100 container
    // The event coords are relative to the button (the puck) if captured? 
    // Easier strategy: Use clientX/Y relative to the container center.
    
    const rect = stickRef.current?.parentElement?.getBoundingClientRect();
    if (!rect) return;
    
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const dx = e.clientX - centerX;
    const dy = e.clientY - centerY;
    
    const distance = Math.sqrt(dx*dx + dy*dy);
    const clampedDist = Math.min(distance, MAX_RADIUS);
    
    const angle = Math.atan2(dy, dx);
    const x = Math.cos(angle) * clampedDist;
    const y = Math.sin(angle) * clampedDist;
    
    setPos({ x, y });

    // Send normalized vector to InputSystem
    // Note: Y is inverted in 3D world (Up is Positive), but Screen Y is Down Positive.
    // However, InputSystem logic in `update` adds to cursor. 
    // If I pull stick DOWN (Positive Y on Screen), I want cursor to go DOWN (Negative Y in World).
    // So we invert Y here.
    const normX = x / MAX_RADIUS;
    const normY = -(y / MAX_RADIUS); 
    
    try {
        const input = ServiceLocator.getSystem<InputSystem>('InputSystem');
        input.setJoystickVector(normX, normY);
    } catch {}
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setActive(false);
    setPos({ x: 0, y: 0 });
    try {
        const input = ServiceLocator.getSystem<InputSystem>('InputSystem');
        input.setJoystickVector(0, 0);
    } catch {}
  };

  return (
    <div className="fixed bottom-8 right-8 w-32 h-32 z-[90] touch-none select-none">
      {/* Base */}
      <div 
        className="w-full h-full rounded-full border-2 border-primary-green/30 bg-black/50 backdrop-blur-sm relative flex items-center justify-center"
        ref={stickRef}
      >
        {/* Stick */}
        <div 
          className="w-12 h-12 rounded-full bg-primary-green/80 shadow-[0_0_15px_#78F654] absolute cursor-pointer transition-transform duration-75 ease-linear"
          style={{ transform: `translate(${pos.x}px, ${pos.y}px)` }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        />
      </div>
      <div className="absolute -top-6 w-full text-center text-[10px] text-primary-green/50 font-mono tracking-widest">
          [ NAV ]
      </div>
    </div>
  );
};

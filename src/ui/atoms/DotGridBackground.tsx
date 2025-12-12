import { clsx } from 'clsx';

interface Props {
  className?: string;
  color?: string; // Optional override
}

export const DotGridBackground = ({ className, color = '#15530A' }: Props) => (
  <div 
    className={clsx("absolute inset-0 pointer-events-none opacity-20 z-0", className)} 
    style={{ 
      backgroundImage: `radial-gradient(${color} 1px, transparent 1px)`, 
      backgroundSize: '8px 8px' 
    }} 
  />
);

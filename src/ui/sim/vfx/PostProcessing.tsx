import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';

export const EffectsLayer = () => {
  return (
    <EffectComposer disableNormalPass>
      {/* 
        BLOOM: Adds the "Neon" glow.
        luminanceThreshold: Only bright colors glow.
        intensity: How strong the glow is.
      */}
      <Bloom 
        luminanceThreshold={0.2} 
        mipmapBlur 
        intensity={1.5} 
        radius={0.4} 
      />
      
      {/* VIGNETTE: Darkens corners for focus */}
      <Vignette eskil={false} offset={0.1} darkness={0.5} />
    </EffectComposer>
  );
};

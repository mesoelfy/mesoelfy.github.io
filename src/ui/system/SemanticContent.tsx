import identity from '@/engine/config/static/identity.json';
import socials from '@/engine/config/static/socials.json';

/**
 * Invisible semantic layer for SEO bots.
 * Provides text context for the 3D canvas content.
 */
export const SemanticContent = () => {
  return (
    <article className="sr-only">
      <header>
        <h1>MESOELFY: 3D Interactive Portfolio & Game</h1>
        <h2>Operator: {identity.name} ({identity.class})</h2>
        <p>{identity.bio}</p>
      </header>

      <section aria-label="Technical Overview">
        <h3>About This Project</h3>
        <p>
          This site represents a "Digital Headquarters" for Elfy (Steven Casteel). 
          It is an immersive web experiment that combines a functional portfolio with 
          an arcade-style shooter game, wrapped in a sci-fi Operating System aesthetic.
        </p>
        
        <h3>Open Source Architecture</h3>
        <p>
          Built to push the limits of React-based 3D rendering. The source code is available 
          on GitHub for educational purposes.
        </p>
        
        <h4>Core Stack & Libraries:</h4>
        <ul>
          <li><strong>Framework:</strong> Next.js 14 (App Router) & TypeScript</li>
          <li><strong>3D Engine:</strong> React Three Fiber (R3F) v9 & Three.js</li>
          <li><strong>Helpers:</strong> @react-three/drei & maath</li>
          <li><strong>State Management:</strong> Zustand (with persistence)</li>
          <li><strong>Styling:</strong> Tailwind CSS & Framer Motion</li>
          <li><strong>Post-Processing:</strong> @react-three/postprocessing (Bloom, Vignette)</li>
          <li><strong>Audio:</strong> Native Web Audio API (Real-time synthesis)</li>
        </ul>
      </section>

      <footer aria-label="Social Uplinks">
        <h3>Connect</h3>
        <ul>
          {socials.map((social) => (
            <li key={social.name}>
              <a href={social.url} rel="me">{social.name}</a>
            </li>
          ))}
        </ul>
      </footer>
    </article>
  );
};

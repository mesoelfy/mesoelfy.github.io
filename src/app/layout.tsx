import type { Metadata, Viewport } from 'next';
import { Montserrat, JetBrains_Mono } from 'next/font/google';
import '@/styles/globals.css';
import socials from '@/engine/config/static/socials.json';
import identity from '@/engine/config/static/identity.json';

const montserrat = Montserrat({ 
  subsets: ['latin'],
  weight: ['400', '700', '900'], 
  variable: '--font-montserrat',
  display: 'swap',
});

const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-jetbrains',
  display: 'swap',
});

const BASE_URL = 'https://mesoelfy.github.io';
const REAL_SITE = "https://www.stevencasteel.com/";
const REPO_URL = "https://github.com/mesoelfy/mesoelfy.github.io";
const RELEASES_URL = "https://github.com/mesoelfy/mesoelfy.github.io/releases";

// TODO: REPLACE THIS ID WITH BESPOKE TRAILER FOR LAUNCH
const TRAILER_VIDEO_ID = "oLALHbB3iXU"; 

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    template: '%s // MESOELFY',
    default: 'MESOELFY // 3D PORTFOLIO & WEB GAME',
  },
  description: "An interactive 3D portfolio and shooter game running in the browser. Built by Elfy using React Three Fiber.",
  keywords: [
    "React Three Fiber", "R3F", "WebGL", "Three.js", "Next.js", 
    "Creative Developer", "Interactive Portfolio", "Web Game", "Indie Dev",
    "Shaders", "GLSL", "Zustand", "Tailwind CSS", "Meso Elfy", "Esper Elfy"
  ],
  authors: [{ name: "Elfy", url: BASE_URL }],
  creator: "Elfy",
  manifest: '/manifest.json', // PWA ACTIVATION
  openGraph: {
    title: 'MESOELFY // DIGITAL HQ',
    description: 'Enter the void. An immersive 3D portfolio and arcade shooter built with modern web tech.',
    url: BASE_URL,
    siteName: 'MESOELFY_OS',
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: '/assets/images/social-card.jpg',
        width: 1200,
        height: 630,
        alt: 'MESOELFY_OS 3D Environment',
      },
    ],
    // NOTE: TO ENABLE DISCORD/TELEGRAM VIDEO AUTOPLAY:
    // 1. Host a short (<10mb) .mp4 file (e.g., /assets/video/preview.mp4).
    // 2. Uncomment and update the lines below:
    // videos: [
    //   {
    //     url: 'https://mesoelfy.github.io/assets/video/preview.mp4',
    //     width: 1280,
    //     height: 720,
    //     type: 'video/mp4',
    //   }
    // ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MESOELFY // SYSTEM_ONLINE',
    description: 'A 3D OS portfolio and game. Built with R3F & Next.js.',
    creator: '@mesoelfy',
    images: ['/assets/images/social-card.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export const viewport: Viewport = {
  themeColor: '#000000',
  colorScheme: 'dark',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const schema = [
    // 1. IDENTITY (The Person)
    {
      '@context': 'https://schema.org',
      '@type': 'Person',
      name: identity.name, 
      alternateName: ["Meso Elfy", "Esper Elfy", "Steven Casteel"], 
      url: BASE_URL,
      image: `${BASE_URL}/assets/images/social-card.jpg`,
      sameAs: [ REAL_SITE, ...socials.map(s => s.url) ],
      jobTitle: identity.class,
      description: identity.bio,
      knowsAbout: ["Game Development", "React Three Fiber", "Web Architecture", "Creative Coding"]
    },
    // 2. SOFTWARE (The Site/App itself)
    {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'MESOELFY_OS',
      applicationCategory: 'GameApplication',
      operatingSystem: 'Windows, macOS, Linux, Web Browser',
      browserRequirements: 'Requires WebGL 2.0',
      description: 'A generative 3D operating system and arcade shooter portfolio.',
      softwareVersion: '0.1.0',
      downloadUrl: RELEASES_URL,
      codeRepository: REPO_URL,
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD'
      },
      author: {
        '@type': 'Person',
        name: 'Elfy'
      }
    },
    // 3. MEDIA (The Gameplay Trailer)
    {
      '@context': 'https://schema.org',
      '@type': 'VideoObject',
      name: 'MESOELFY_OS // Gameplay Preview',
      description: 'Footage of the MESOELFY_OS latent space environment and combat mechanics.',
      thumbnailUrl: `${BASE_URL}/assets/images/social-card.jpg`,
      uploadDate: new Date().toISOString(),
      contentUrl: `https://www.youtube.com/watch?v=${TRAILER_VIDEO_ID}`,
      embedUrl: `https://www.youtube.com/embed/${TRAILER_VIDEO_ID}`
    }
  ];

  return (
    <html lang="en" className={`${montserrat.variable} ${jetbrains.variable}`} style={{ backgroundColor: '#000000' }}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      </head>
      <body 
        className="bg-black text-primary-green selection:bg-primary-green selection:text-black font-mono"
        style={{ backgroundColor: '#000000' }} 
      >
        <div className="relative w-full h-full">
          {children}
        </div>
      </body>
    </html>
  );
}

import type { Metadata, Viewport } from 'next';
import { Montserrat, JetBrains_Mono } from 'next/font/google';
import '@/styles/globals.css';

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

export const metadata: Metadata = {
  title: 'MESOELFY // LATENT SPACE BANDIT',
  description: 'The official digital HQ of Mesoelfy. Art, Lore, and Neural Network Injections.',
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
  return (
    <html lang="en" className={`${montserrat.variable} ${jetbrains.variable}`} style={{ backgroundColor: '#000000' }}>
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

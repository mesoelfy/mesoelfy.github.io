import type { Metadata } from 'next';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: 'ELFY // LATENT SPACE BANDIT',
  description: 'Cyberpunk Portfolio & Art Gallery',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-black text-elfy-neon selection:bg-elfy-neon selection:text-black">
        {/* Main App Wrapper */}
        <div className="relative w-full h-screen overflow-hidden">
          {children}
        </div>
      </body>
    </html>
  );
}

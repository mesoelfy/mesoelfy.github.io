import type { Metadata } from 'next';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: 'MESOELFY // LATENT SPACE BANDIT',
  description: 'The official digital HQ of Mesoelfy. Art, Lore, and Neural Network Injections.',
  icons: {
    icon: '/favicon.ico',
  },
  openGraph: {
    title: 'MESOELFY_OS',
    description: 'Access the terminal. View the art. Breach the firewall.',
    url: 'https://mesoelfy.github.io',
    siteName: 'MESOELFY',
    images: [
      {
        url: 'https://mesoelfy.github.io/assets/images/social-card.jpg',
        width: 1200,
        height: 630,
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MESOELFY // LATENT SPACE BANDIT',
    description: 'Access the terminal. View the art. Breach the firewall.',
    images: ['https://mesoelfy.github.io/assets/images/social-card.jpg'],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-black text-elfy-green selection:bg-elfy-green selection:text-black">
        <div className="relative w-full h-full">
          {children}
        </div>
      </body>
    </html>
  );
}

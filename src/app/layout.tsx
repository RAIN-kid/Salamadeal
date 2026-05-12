import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navigation from '@/components/Navigation';

const inter = Inter({ 
  subsets: ["latin"],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: "SalamaDeal",
  description: "Biashara salama mtandaoni",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="sw" className={inter.variable}>
      <body className="font-sans antialiased bg-white text-black selection:bg-gray-200">
        
        {/* Mfumo mzima umebebwa na Flexbox */}
        <div className="flex min-h-screen w-full bg-white">
          
          {/* Navigation ipo hapa. Kwenye PC inakuwa Sidebar, kwenye simu inakuwa BottomNav */}
          <Navigation />
          
          {/* Hili ni eneo la kurasa zako. Lipo wazi na safi. */}
          <main className="flex-1 min-w-0 pb-24 md:pb-0 relative">
            <div className="max-w-4xl mx-auto w-full min-h-screen bg-white">
              {children}
            </div>
          </main>
          
        </div>

      </body>
    </html>
  );
}
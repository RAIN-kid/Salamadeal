import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ 
  subsets: ["latin"],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: "SalamaDeal",
  description: "Secure escrow payments for your deals.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      {/* 
        Tumeondoa hardcoded colors hapa! 
        Sasa hivi inasikiliza globals.css (var(--color-background) na var(--color-foreground))
      */}
      <body className="font-sans antialiased selection:bg-blue-200">
        
        <div className="flex min-h-screen w-full justify-center">
          {/* Hapa pia tunatumia bg-background badala ya bg-slate-50 */}
          <main className="w-full max-w-md min-h-screen relative shadow-2xl shadow-black/5 bg-background overflow-x-hidden">
            {children}
          </main>
        </div>

      </body>
    </html>
  );
}
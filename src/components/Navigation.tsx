'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  
  // State kwa ajili ya kufunga/kufungua Sidebar kwenye PC
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [mounted, setMounted] = useState(false);

  // Hii inazuia Hydration Error
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const isActive = (path: string) => pathname === path;
  
  // SHERIA: Hakuna bluu. Active = Black & bg-gray-100, Inactive = Gray
  const activeClassDesk = "text-black bg-gray-100";
  const inactiveClassDesk = "text-gray-500 hover:text-black hover:bg-gray-50";

  const navItems = [
    { name: 'Mwanzo', path: '/', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /> },
    { name: 'Miamala', path: '/dashboard', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /> },
    { name: 'Bidhaa', path: '/products', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /> },
    { name: 'Akaunti', path: '/profile', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /> },
  ];

  return (
    <>
      {/* ======================================================== */}
      {/* 1. SIDEBAR YA DESKTOP/PC (Sticky, Inasukuma Content) */}
      {/* ======================================================== */}
      <div className={`hidden md:flex flex-col sticky top-0 h-screen bg-white border-r border-gray-100 transition-all duration-300 z-40 flex-shrink-0 ${isSidebarOpen ? 'w-64' : 'w-20'}`}>
        
        {/* Logo & Toggle Button */}
        <div className={`flex items-center h-20 border-b border-gray-50 ${isSidebarOpen ? 'justify-between px-6' : 'justify-center'}`}>
          {isSidebarOpen && <span className="text-[22px] font-extrabold text-black tracking-tight">SalamaDeal</span>}
          
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
            className="p-2 text-gray-400 hover:text-black hover:bg-gray-100 rounded-xl transition-colors"
          >
            {isSidebarOpen ? (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" /></svg>
            ) : (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
            )}
          </button>
        </div>

        {/* Links */}
        <div className="flex-1 py-6 px-3 space-y-2 overflow-y-auto hide-scrollbar">
          {navItems.map((item) => (
            <Link 
              key={item.path} 
              href={item.path} 
              className={`flex items-center rounded-2xl transition-all ${isSidebarOpen ? 'px-4 py-3.5 gap-4' : 'justify-center w-12 h-12 mx-auto'} ${isActive(item.path) ? activeClassDesk : inactiveClassDesk}`}
            >
              <svg className="w-6 h-6 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={isActive(item.path) ? '2.5' : '1.5'}>
                {item.icon}
              </svg>
              {isSidebarOpen && <span className={`text-[15px] ${isActive(item.path) ? 'font-bold' : 'font-medium'}`}>{item.name}</span>}
            </Link>
          ))}
        </div>

        {/* Create Button (Inabadilika kulingana na ukubwa wa Sidebar) */}
        <div className="p-4 border-t border-gray-50">
          <button 
            onClick={() => router.push('/products/new')} 
            className={`flex items-center justify-center bg-black text-white active:scale-95 transition-all ${isSidebarOpen ? 'w-full py-3.5 px-4 rounded-[14px] gap-2.5' : 'w-12 h-12 mx-auto rounded-full'}`}
          >
            <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
            {isSidebarOpen && <span className="text-[15px] font-bold">Dili Jipya</span>}
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. BOTTOM NAV YA SIMU (Mobile Only) */}
      {/* ======================================================== */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-gray-100 pb-safe">
        <div className="flex justify-around items-end h-[64px] pb-2 px-1 relative">
          
          <Link href="/" className={`flex flex-col items-center justify-center gap-1 w-full active:scale-95 transition-transform ${isActive('/') ? 'text-black' : 'text-gray-400'}`}>
            <svg className="w-[24px] h-[24px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={isActive('/') ? '2.5' : '1.5'}>{navItems[0].icon}</svg>
            <span className="text-[10px] font-bold">Mwanzo</span>
          </Link>

          <Link href="/dashboard" className={`flex flex-col items-center justify-center gap-1 w-full active:scale-95 transition-transform ${isActive('/dashboard') ? 'text-black' : 'text-gray-400'}`}>
            <svg className="w-[24px] h-[24px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={isActive('/dashboard') ? '2.5' : '1.5'}>{navItems[1].icon}</svg>
            <span className="text-[10px] font-bold">Dili</span>
          </Link>

          {/* Plus Button - Mviringo Kamili */}
          <div className="flex flex-col items-center justify-center w-full relative -top-3">
            <button 
              onClick={() => router.push('/products/new')} 
              className="w-[52px] h-[52px] bg-black text-white rounded-full flex items-center justify-center active:scale-95 transition-transform shadow-sm"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
            </button>
          </div>

          <Link href="/products" className={`flex flex-col items-center justify-center gap-1 w-full active:scale-95 transition-transform ${isActive('/products') ? 'text-black' : 'text-gray-400'}`}>
            <svg className="w-[24px] h-[24px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={isActive('/products') ? '2.5' : '1.5'}>{navItems[2].icon}</svg>
            <span className="text-[10px] font-bold">Bidhaa</span>
          </Link>

          <Link href="/profile" className={`flex flex-col items-center justify-center gap-1 w-full active:scale-95 transition-transform ${isActive('/profile') ? 'text-black' : 'text-gray-400'}`}>
            <svg className="w-[24px] h-[24px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={isActive('/profile') ? '2.5' : '1.5'}>{navItems[3].icon}</svg>
            <span className="text-[10px] font-bold">Akaunti</span>
          </Link>

        </div>
      </div>

      {/* CSS kuficha scrollbar kwenye Sidebar */}
      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </>
  );
}
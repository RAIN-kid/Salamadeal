'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function HomePage() {
  const [dealCode, setDealCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [userName, setUserName] = useState('');
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from('profiles').select('full_name').eq('id', user.id).single();
        if (data && data.full_name) {
          setUserName(data.full_name.split(' ')[0]);
        }
      }
    };
    fetchUser();
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dealCode.trim()) return;
    
    setLoading(true);
    setErrorMsg('');
    const cleanCode = dealCode.trim().toUpperCase();

    try {
      const { data, error } = await supabase
        .from('products')
        .select('product_code')
        .eq('product_code', cleanCode)
        .single();

      if (error || !data) {
        setErrorMsg('Invalid code. Please check and try again.');
        setLoading(false);
        return;
      }

      router.push(`/deal/${data.product_code}`);
      
    } catch (err) {
      setErrorMsg('Network error. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col relative pb-10">
      
      {/* 1. TOP HEADER */}
      <div className="px-6 pt-12 pb-6">
        <div className="flex justify-between items-center">
          
          {/* Kushoto: User Profile & Greeting */}
          <div className="flex items-center gap-3">
            <button 
              onClick={() => router.push('/profile')} 
              className="w-12 h-12 bg-surface rounded-full flex items-center justify-center shadow-sm border border-surface-muted active:scale-95 transition-transform"
            >
              <span className="text-[16px] font-bold text-foreground">
                {userName ? userName.charAt(0).toUpperCase() : '👤'}
              </span>
            </button>
            <div className="flex flex-col">
              <span className="text-[13px] font-medium text-muted leading-tight">Welcome back</span>
              <span className="text-[18px] font-extrabold text-foreground leading-tight">
                Hi, {userName || 'there'}! 👋
              </span>
            </div>
          </div>

          {/* Kulia: SalamaDeal Logo Icon (Inatumia bg-accent) */}
          <div className="w-10 h-10 bg-accent rounded-[12px] flex items-center justify-center shadow-lg shadow-accent/20">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>

        </div>
      </div>

      {/* 2. MAIN INPUT AREA */}
      <div className="px-6 mt-2 relative z-10">
        <div className="bg-surface p-6 rounded-[28px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-surface-muted">
          <h2 className="text-[16px] font-bold text-foreground mb-4 flex items-center gap-2">
            Pay securely <span className="text-xl">🛡️</span>
          </h2>
          
          <form onSubmit={handleSearch} className="w-full relative">
            <div className={`relative flex items-center bg-background border-[2px] rounded-[20px] transition-all duration-300 ${errorMsg ? 'border-danger bg-danger-light' : 'border-surface-muted focus-within:border-accent focus-within:bg-surface'}`}>
              <input
                type="text"
                value={dealCode}
                onChange={(e) => {
                  setDealCode(e.target.value);
                  if (errorMsg) setErrorMsg('');
                }}
                placeholder="Enter deal code..."
                className="w-full pl-5 pr-14 py-4.5 bg-transparent text-[16px] font-extrabold text-foreground placeholder-muted focus:outline-none tracking-widest uppercase"
              />
              
              <button 
                type="submit"
                disabled={!dealCode.trim() || loading}
                className={`absolute right-2.5 w-[42px] h-[42px] rounded-[14px] flex items-center justify-center transition-all duration-300 ${dealCode.trim() ? 'bg-accent text-white shadow-md active:scale-95' : 'bg-surface-muted text-muted'}`}
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                )}
              </button>
            </div>

            {/* Error Message */}
            <div className="h-6 mt-2 pl-2 flex items-center">
              {errorMsg && (
                <p className="text-[13px] font-semibold text-danger animate-fade-in flex items-center gap-1.5">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  {errorMsg}
                </p>
              )}
            </div>
          </form>
        </div>
      </div>

      {/* 3. QUICK ACTIONS GRID */}
      <div className="px-6 mt-8">
        <h3 className="text-[13px] font-bold text-muted uppercase tracking-widest mb-3 ml-1">Quick Access</h3>
        <div className="grid grid-cols-2 gap-4">
          
          <button 
            onClick={() => router.push('/dashboard')}
            className="bg-surface p-5 rounded-[24px] border border-surface-muted shadow-sm flex flex-col items-start gap-4 active:scale-95 transition-transform group"
          >
            <div className="w-12 h-12 bg-surface-muted text-foreground rounded-[14px] flex items-center justify-center group-hover:bg-accent group-hover:text-white transition-colors">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            </div>
            <div className="text-left">
              <p className="text-[16px] font-extrabold text-foreground">My Deals</p>
              <p className="text-[13px] font-medium text-muted">Track orders</p>
            </div>
          </button>

          <button 
            onClick={() => router.push('/products')}
            className="bg-surface p-5 rounded-[24px] border border-surface-muted shadow-sm flex flex-col items-start gap-4 active:scale-95 transition-transform group"
          >
            <div className="w-12 h-12 bg-surface-muted text-foreground rounded-[14px] flex items-center justify-center group-hover:bg-accent group-hover:text-white transition-colors">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
            </div>
            <div className="text-left">
              <p className="text-[16px] font-extrabold text-foreground">My Items</p>
              <p className="text-[13px] font-medium text-muted">Manage stock</p>
            </div>
          </button>

        </div>
      </div>

      {/* 4. TRUST BANNER */}
      <div className="px-6 mt-8">
        <div className="bg-foreground rounded-[24px] p-6 text-white shadow-xl relative overflow-hidden">
          <div className="absolute -right-10 -top-10 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>
          
          <div className="relative z-10 flex items-start gap-4">
            <div className="w-10 h-10 bg-white/10 rounded-[12px] flex items-center justify-center flex-shrink-0 backdrop-blur-md">
              <svg className="w-5 h-5 text-surface" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
            </div>
            <div>
              <h4 className="text-[15px] font-bold mb-1 text-white">100% Escrow Safety</h4>
              <p className="text-[13px] text-surface-muted font-medium leading-relaxed">
                Funds are securely held until you receive your items. Zero risk.
              </p>
            </div>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .animate-fade-in { animation: fadeIn 0.2s ease-out forwards; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-3px); } to { opacity: 1; transform: translateY(0); } }
      `}} />
    </div>
  );
}
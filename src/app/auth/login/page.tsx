'use client';

import { useState, Suspense } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, useSearchParams } from 'next/navigation';

function AuthContent() {
  const [isLogin, setIsLogin] = useState(true);
  
  // States za Fomu
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const router = useRouter();
  
  // Inasoma parameter kama alitoka page nyingine
  const searchParams = useSearchParams();
  const nextUrl = searchParams.get('next') || '/';

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setMessage('Barua pepe au Nenosiri sio sahihi.');
      } else {
        router.push(nextUrl);
      }
    } else {
      // 1. Tengeneza Akaunti kwenye Supabase Auth
      const { data, error } = await supabase.auth.signUp({ email, password });
      
      if (error) {
        setMessage(error.message);
      } else if (data.user) {
        // 2. Hifadhi Jina na Simu kwenye meza ya 'profiles'
        const { error: profileError } = await supabase.from('profiles').upsert({
          id: data.user.id,
          full_name: fullName,
          phone_number: phoneNumber,
          email: email
        });

        if (profileError) {
          console.error("Profile Error:", profileError);
        }
        
        setMessage('Usajili umekamilika! Unaweza kuingia (Login) sasa.');
        setIsLogin(true); // Mpeleke kwenye Login fomu baada ya kusajili
        setPassword(''); // Futa password kwa usalama
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-6 pb-10">
      <div className="w-full max-w-sm space-y-8">
        
        <div className="text-center pt-8">
          {/* Logo ya SalamaDeal */}
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="bg-foreground text-background p-1.5 rounded-lg">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-foreground">SalamaDeal</h1>
          </div>
          <p className="mt-2 text-[14px] text-gray-500">
            {isLogin ? 'Ingia kwenye akaunti yako' : 'Tengeneza akaunti kuanza biashara'}
          </p>
        </div>

        {/* ========================================= */}
        {/* SEGMENTED CONTROL (Apple Style Toggle) */}
        {/* ========================================= */}
        <div className="flex bg-surface p-1 rounded-xl mb-6">
          <button
            type="button"
            onClick={() => { setIsLogin(true); setMessage(''); }}
            className={`flex-1 py-2.5 text-[14px] font-semibold rounded-lg transition-all duration-200 ${isLogin ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Ingia
          </button>
          <button
            type="button"
            onClick={() => { setIsLogin(false); setMessage(''); }}
            className={`flex-1 py-2.5 text-[14px] font-semibold rounded-lg transition-all duration-200 ${!isLogin ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Jisajili
          </button>
        </div>
        
        <form className="space-y-4" onSubmit={handleAuth}>
          
          {/* Fomu Inaonekana Akiwa anajisajili Tu (Signup Fields) */}
          {!isLogin && (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
              <div>
                <label className="block text-[13px] font-medium text-gray-700 mb-1.5 ml-1">Jina Kamili au la Biashara</label>
                <input
                  type="text"
                  required={!isLogin}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-3.5 bg-surface border-none rounded-xl text-[15px] text-foreground placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-foreground/20 transition-all"
                  placeholder="Mfano: Juma Stores"
                />
              </div>
              <div>
                <label className="block text-[13px] font-medium text-gray-700 mb-1.5 ml-1">Namba ya Simu (Kupigiwa/Mawasiliano)</label>
                <input
                  type="tel"
                  required={!isLogin}
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full px-4 py-3.5 bg-surface border-none rounded-xl text-[15px] text-foreground placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-foreground/20 transition-all"
                  placeholder="07XX XXX XXX"
                />
              </div>
            </div>
          )}

          {/* Hizi Zinaonekana Muda Wote (Email & Password) */}
          <div>
            <label className="block text-[13px] font-medium text-gray-700 mb-1.5 ml-1">Barua pepe</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3.5 bg-surface border-none rounded-xl text-[15px] text-foreground placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-foreground/20 transition-all"
              placeholder="jina@mfano.com"
            />
          </div>
          
          <div>
            <label className="block text-[13px] font-medium text-gray-700 mb-1.5 ml-1">Nenosiri</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3.5 bg-surface border-none rounded-xl text-[15px] text-foreground placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-foreground/20 transition-all"
              placeholder="Weka nenosiri lako"
            />
          </div>

          {/* Ujumbe (Errors au Success) */}
          {message && (
            <div className={`text-[13px] text-center p-3 rounded-xl border ${message.includes('umekamilika') ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
              {message}
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 px-4 rounded-xl text-[15px] font-semibold text-white bg-foreground hover:bg-gray-800 focus:outline-none focus:ring-4 focus:ring-gray-200 transition-all disabled:opacity-70 flex justify-center items-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  Tunasindika...
                </>
              ) : isLogin ? 'Ingia' : 'Kamilisha Usajili'}
            </button>
          </div>
        </form>
        
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-background">Inapakia...</div>}>
      <AuthContent />
    </Suspense>
  );
}
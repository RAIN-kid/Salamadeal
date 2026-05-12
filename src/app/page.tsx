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
      // FIX MKUBWA: Hapa tunatafuta 'product_code' badala ya 'deal_code'
      const { data, error } = await supabase
        .from('products')
        .select('id, product_code')
        .eq('product_code', cleanCode)
        .single();

      if (error || !data) {
        // Ujumbe umesafishwa kulingana na uhalisia
        setErrorMsg('Code ya bidhaa haipo. Tafadhali hakiki.');
        setLoading(false);
        return;
      }

      // Kama code ipo, anapelekwa kwenye page ya kulipia hiyo bidhaa
      const finalCode = data.product_code || data.id;
      router.push(`/deal/${finalCode}`);
      
    } catch (err) {
      setErrorMsg('Kuna tatizo la mtandao, jaribu tena.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col pt-16 md:pt-32 px-6 relative">
      
      <div className="max-w-md mx-auto w-full">
        
        {/* LOGO (Inaonekana kwenye simu tu, imefichwa PC) */}
        <div className="flex justify-start md:hidden mb-8">
          <div className="w-16 h-16 bg-black rounded-[18px] flex items-center justify-center shadow-sm">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
        </div>

        {/* SALAMU (Pangilia kushoto) */}
        <div className="text-left mb-10">
          <h1 className="text-[28px] font-extrabold text-black tracking-tight mb-2">
            Hi, {userName || 'Karibu'}! 👋
          </h1>
          <p className="text-[15px] font-medium text-gray-500">
            Weka code hapa chini ili kulipia bidhaa yako kwa usalama.
          </p>
        </div>

        {/* INPUT FORM */}
        <form onSubmit={handleSearch} className="w-full relative">
          
          <div className={`relative flex items-center bg-white border-[2px] rounded-[20px] transition-all duration-300 ${errorMsg ? 'border-red-400 bg-red-50/30' : 'border-gray-200 focus-within:border-black focus-within:shadow-md'}`}>
            <input
              type="text"
              value={dealCode}
              onChange={(e) => {
                setDealCode(e.target.value);
                if (errorMsg) setErrorMsg('');
              }}
              placeholder="Mfano: SD-1234"
              className="w-full pl-5 pr-14 py-4.5 bg-transparent text-[16px] font-extrabold text-black placeholder-gray-300 focus:outline-none tracking-widest uppercase"
            />
            
            <button 
              type="submit"
              disabled={!dealCode.trim() || loading}
              className={`absolute right-2.5 w-[42px] h-[42px] rounded-[14px] flex items-center justify-center transition-all duration-300 ${dealCode.trim() ? 'bg-black text-white active:scale-95' : 'bg-gray-100 text-gray-400'}`}
            >
              {loading ? (
                 <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" /></svg>
              )}
            </button>
          </div>

          {errorMsg && (
            <p className="text-[13px] font-bold text-red-500 text-left ml-1 mt-3 animate-fade-in">
              {errorMsg}
            </p>
          )}

        </form>
        
        {/* LINK YA KUSAJILI BIDHAA (Imesafishwa) */}
        <div className="mt-12 text-left">
          <button 
            onClick={() => router.push('/products/new')} 
            className="text-[14px] font-bold text-blue-600 hover:text-black transition-colors"
          >
            Wewe ni muuzaji? Sajili bidhaa hapa
          </button>
        </div>

      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .animate-fade-in { animation: fadeIn 0.3s ease-in-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-5px); } to { opacity: 1; transform: translateY(0); } }
      `}} />
    </div>
  );
}
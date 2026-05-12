'use client';

import { useEffect, useState, use } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function DealDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const unwrappedParams = use(params);
  const dealId = unwrappedParams.id;

  const [deal, setDeal] = useState<any>(null);
  const [role, setRole] = useState<'buyer' | 'seller' | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState<string>('00:00:00');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isProductExpanded, setIsProductExpanded] = useState(false);
  
  // State kwa ajili ya Fullscreen Lightbox ya Picha
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  useEffect(() => {
    if (dealId) {
      fetchDealDetails();
    }
  }, [dealId]);

  const fetchDealDetails = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth/login');
        return;
      }

      // Tumeongeza 'delivery_days_limit' kwenye list ya products inayovutwa
      const { data: dealData, error } = await supabase
        .from('deals')
        .select(`
          *,
          products ( id, title, images, price, description, delivery_days_limit ),
          seller:profiles!seller_id ( full_name, phone_number ),
          buyer:profiles!buyer_id ( full_name, phone_number )
        `)
        .eq('id', dealId)
        .single();

      if (error || !dealData) throw error;

      if (dealData.seller_id === user.id) {
        setRole('seller');
        dealData.other_party_name = dealData.buyer?.full_name || 'Hajajaza jina';
        dealData.other_party_phone = dealData.buyer?.phone_number || dealData.buyer_phone;
      } else {
        setRole('buyer');
        dealData.other_party_name = dealData.seller?.full_name || 'Muuzaji';
        dealData.other_party_phone = dealData.seller?.phone_number || '';
      }

      setDeal(dealData);
    } catch (err) {
      console.error('Kosa kuvuta dili:', err);
      alert('Dili halijapatikana.');
      router.push('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!deal || (deal.status !== 'paid' && deal.status !== 'shipped')) return;

    const timer = setInterval(() => {
      const createdAt = new Date(deal.created_at).getTime();
      const expiryTime = createdAt + (72 * 60 * 60 * 1000); 
      const now = new Date().getTime();
      const difference = expiryTime - now;

      if (difference <= 0) {
        clearInterval(timer);
        setTimeLeft('00:00:00');
      } else {
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24 * 10)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);
        setTimeLeft(
          `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
        );
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [deal]);

  const updateDealStatus = async (newStatus: 'shipped' | 'completed' | 'disputed') => {
    const confirmMessage = newStatus === 'completed' ? "Thibitisha kuwa umepokea mzigo?" 
      : newStatus === 'shipped' ? "Thibitisha kuwa mzigo upo njiani?" 
      : "Una uhakika unataka kufungua mgogoro?";
      
    if (!window.confirm(confirmMessage)) return;

    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('deals')
        .update({ status: newStatus })
        .eq('id', dealId);

      if (error) throw error;
      setDeal({ ...deal, status: newStatus });
    } catch (err: any) {
      alert("Kuna tatizo: " + err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  // Logic za kubadili picha Fullscreen
  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (deal?.products?.images && lightboxIndex !== null) {
      setLightboxIndex((lightboxIndex + 1) % deal.products.images.length);
    }
  };

  const handlePrevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (deal?.products?.images && lightboxIndex !== null) {
      setLightboxIndex((lightboxIndex - 1 + deal.products.images.length) % deal.products.images.length);
    }
  };

  if (loading) return <div className="min-h-screen bg-white flex items-center justify-center"><div className="w-8 h-8 border-4 border-gray-100 border-t-black rounded-full animate-spin"></div></div>;
  if (!deal) return null;

  const steps = ['pending_payment', 'paid', 'shipped', 'completed'];
  const currentStepIndex = steps.indexOf(deal.status === 'disputed' ? 'paid' : deal.status);

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex flex-col pb-12 relative">
      
      {/* 1. HEADER */}
      <div className="bg-white/95 backdrop-blur-md pt-12 pb-3 px-5 flex items-center border-b border-gray-100 sticky top-0 z-10">
        <button onClick={() => router.back()} className="mr-3 p-1.5 -ml-1.5 rounded-full active:bg-gray-50 hover:bg-gray-50 transition-colors">
          <svg className="w-6 h-6 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
        </button>
        <h1 className="text-[18px] font-bold text-black tracking-tight">Dili #{deal.id.split('-')[0]}</h1>
      </div>

      <div className="max-w-xl mx-auto w-full px-5 mt-5">
        
        {/* 2. KADI YA PROGRESS NA TIMER */}
        <div className="bg-white rounded-[20px] p-6 border border-gray-100 mb-4">
          <div className="flex items-center justify-between relative mb-8">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-100 rounded-full z-0"></div>
            <div 
              className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-black rounded-full z-0 transition-all duration-500" 
              style={{ width: `${(Math.max(currentStepIndex, 0) / (steps.length - 1)) * 100}%` }}
            ></div>
            
            {['Inasubiri', 'Lipiwa', 'Njiani', 'Fika'].map((label, index) => (
              <div key={index} className="relative z-10 flex flex-col items-center bg-white px-2">
                <div className={`w-3.5 h-3.5 rounded-full transition-colors duration-300 ${index <= currentStepIndex ? 'bg-black' : 'bg-gray-200'}`}></div>
                <span className={`text-[12px] font-medium absolute -bottom-6 ${index <= currentStepIndex ? 'text-black font-semibold' : 'text-gray-400'}`}>{label}</span>
              </div>
            ))}
          </div>

          <div className="text-center mt-10">
            <p className="text-[14px] font-medium text-gray-500 mb-1">
              {deal.status === 'completed' ? 'Muamala umekamilika' 
                : deal.status === 'disputed' ? 'Dili limesimamishwa' 
                : deal.status === 'pending_payment' ? 'Inasubiri malipo'
                : 'Muda wa ulinzi uliobaki'}
            </p>
            <h2 className={`text-5xl font-black tracking-tight ${deal.status === 'completed' ? 'text-green-600' : deal.status === 'disputed' ? 'text-red-500' : deal.status === 'pending_payment' ? 'text-gray-300' : 'text-black'}`}>
              {deal.status === 'completed' ? 'Tayari' 
                : deal.status === 'disputed' ? 'Mgogoro' 
                : deal.status === 'pending_payment' ? '--:--:--'
                : timeLeft}
            </h2>
          </div>
        </div>

        {/* 3. BUTTON ZA MAAMUZI (Actions) */}
        <div className="mb-8">
          
          {role === 'seller' && deal.status === 'paid' && (
            <button 
              onClick={() => updateDealStatus('shipped')}
              disabled={isUpdating}
              className="w-full bg-black text-white py-4 rounded-[16px] text-[16px] font-bold active:scale-[0.98] transition-transform disabled:opacity-50"
            >
              {isUpdating ? 'Inasasisha...' : 'Mzigo upo njiani'}
            </button>
          )}

          {role === 'seller' && deal.status === 'shipped' && (
            <div className="bg-[#F9FAFB] border border-gray-100 py-4 rounded-[16px] text-center">
              <p className="text-[14px] font-medium text-gray-500">Mteja anapaswa kuthibitisha mzigo.</p>
            </div>
          )}

          {role === 'buyer' && (deal.status === 'paid' || deal.status === 'shipped') && (
            <div className="flex flex-col gap-3">
              <button 
                onClick={() => updateDealStatus('completed')}
                disabled={isUpdating}
                className="w-full bg-[#E5F7ED] text-[#00A859] py-4 rounded-[16px] text-[16px] font-bold active:scale-[0.98] transition-transform disabled:opacity-50"
              >
                {isUpdating ? 'Inasasisha...' : 'Nimepokea mzigo'}
              </button>
              <button 
                onClick={() => updateDealStatus('disputed')}
                disabled={isUpdating}
                className="w-full bg-white border border-red-100 text-red-500 py-4 rounded-[16px] text-[15px] font-semibold active:bg-red-50 transition-colors"
              >
                Kuna shida? Fungua mgogoro
              </button>
            </div>
          )}

          {deal.status === 'completed' && (
            <div className="w-full py-4 text-[15px] font-semibold text-green-600 bg-green-50 rounded-[16px] text-center border border-green-100">
              Dili hili limekamilika salama.
            </div>
          )}

          {deal.status === 'disputed' && (
            <div className="w-full py-4 text-[15px] font-semibold text-red-500 bg-red-50 rounded-[16px] text-center border border-red-100">
              Mgogoro umefunguliwa na unashughulikiwa.
            </div>
          )}
        </div>

        {/* 4. TAARIFA ZA MUAMALA */}
        <h3 className="text-[14px] font-bold text-gray-800 ml-1 mb-2">Taarifa za muamala</h3>
        <div className="bg-white rounded-[20px] border border-gray-100 overflow-hidden mb-6">
          
          <div className="flex justify-between items-center px-5 py-4 border-b border-gray-50">
            <div className="flex flex-col">
              <span className="text-[16px] font-bold text-black">{deal.other_party_name}</span>
              <span className="text-[14px] font-medium text-gray-500 mt-0.5">{deal.other_party_phone}</span>
            </div>
            <a href={`tel:${deal.other_party_phone}`} className="w-11 h-11 bg-[#F9FAFB] text-black border border-gray-100 rounded-[14px] flex items-center justify-center active:bg-gray-100 transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
            </a>
          </div>

          <div className="flex justify-between items-center px-5 py-4 border-b border-gray-50">
            <span className="text-[15px] font-medium text-gray-500">Kiasi kilicholipiwa</span>
            <span className="text-[16px] font-bold text-black">TZS {deal.total_amount.toLocaleString()}</span>
          </div>

          <div className="flex justify-between items-center px-5 py-4">
            <span className="text-[15px] font-medium text-gray-500">Mzigo ulipo</span>
            <span className="text-[15px] font-bold text-black text-right max-w-[50%] truncate">
              {deal.delivery_region} - {deal.delivery_point}
            </span>
          </div>
        </div>

        {/* 5. TAARIFA ZA BIDHAA (Accordion na Thumbnails mpya) */}
        <h3 className="text-[14px] font-bold text-gray-800 ml-1 mb-2">Taarifa za bidhaa</h3>
        <div className="bg-white rounded-[20px] border border-gray-100 overflow-hidden mb-6 transition-all duration-300">
          <div 
            onClick={() => setIsProductExpanded(!isProductExpanded)} 
            className="flex items-center justify-between px-5 py-4 cursor-pointer active:bg-gray-50 transition-colors select-none"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-12 h-12 bg-gray-50 rounded-[12px] border border-gray-100 overflow-hidden flex-shrink-0">
                {deal.products.images && deal.products.images[0] && (
                  <img src={deal.products.images[0]} alt="" className="w-full h-full object-cover" />
                )}
              </div>
              <span className="text-[15px] font-bold text-black truncate pr-4">{deal.products.title}</span>
            </div>
            <div className="flex items-center justify-center w-8 h-8 bg-gray-50 rounded-full flex-shrink-0">
              <svg className={`w-4 h-4 text-gray-500 transition-transform duration-300 ${isProductExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
            </div>
          </div>

          {isProductExpanded && (
            <div className="px-5 py-5 bg-[#F9FAFB] border-t border-gray-100 animate-in fade-in slide-in-from-top-2 duration-300">
              
              {/* Thumbnails za Picha - Ukiclick zinafunguka Fullscreen */}
              {deal.products.images && deal.products.images.length > 0 && (
                <div className="grid grid-cols-4 gap-2 mb-4">
                  {deal.products.images.map((img: string, idx: number) => (
                    <button 
                      key={idx} 
                      onClick={(e) => { e.stopPropagation(); setLightboxIndex(idx); }}
                      className="aspect-square w-full rounded-[12px] bg-white border border-gray-200 overflow-hidden active:opacity-70 transition-opacity"
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
              
              <h4 className="text-[16px] font-bold text-black mb-1">{deal.products.title}</h4>
              <p className="text-[15px] font-bold text-black mb-3">TZS {deal.products.price.toLocaleString()}</p>
              
              {/* Taarifa ya muda wa mzigo kufika */}
              <div className="flex items-center gap-2 mb-3">
                <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <span className="text-[14px] font-medium text-gray-600">Mzigo utafika ndani ya siku {deal.products.delivery_days_limit || '1'}</span>
              </div>

              {deal.products.description && (
                <div className="bg-white p-4 rounded-[16px] border border-gray-100 mt-2">
                  <p className="text-[14px] text-gray-600 leading-relaxed">{deal.products.description}</p>
                </div>
              )}
            </div>
          )}
        </div>

      </div>

      {/* ========================================= */}
      {/* 🟢 FULLSCREEN IMAGE LIGHTBOX 🟢 */}
      {/* ========================================= */}
      {lightboxIndex !== null && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center backdrop-blur-sm" onClick={() => setLightboxIndex(null)}>
          
          <button className="absolute top-6 right-6 text-white bg-white/10 p-2 rounded-full hover:bg-white/20 transition-colors">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>

          <img 
            src={deal.products.images[lightboxIndex]} 
            alt="Fullscreen" 
            className="w-full max-h-[85vh] object-contain select-none"
            onClick={(e) => e.stopPropagation()}
          />

          {deal.products.images.length > 1 && (
            <div className="absolute bottom-10 left-0 right-0 flex justify-center gap-6 px-4">
              <button onClick={handlePrevImage} className="w-14 h-14 bg-white/10 text-white rounded-full flex items-center justify-center hover:bg-white/20 active:scale-95 transition-all">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
              </button>
              <button onClick={handleNextImage} className="w-14 h-14 bg-white/10 text-white rounded-full flex items-center justify-center hover:bg-white/20 active:scale-95 transition-all">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
              </button>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
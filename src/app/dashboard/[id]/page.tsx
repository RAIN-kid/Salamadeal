'use client';

import { useEffect, useState, use } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function DealDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  // Next.js 15/16 unwrapping
  const resolvedParams = use(params);
  const dealId = resolvedParams?.id;

  const [deal, setDeal] = useState<any>(null);
  const [role, setRole] = useState<'vendor' | 'customer' | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState<string>('00:00:00');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isProductExpanded, setIsProductExpanded] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  useEffect(() => {
    if (dealId) {
      fetchDealDetails();
    }
  }, [dealId]);

  const fetchDealDetails = async () => {
    setLoading(true);
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        router.push('/auth/login');
        return;
      }

      // 🔍 Query iliyoboreshwa: Tumehakikisha phone_number inatumika
      const { data: dealData, error: fetchError } = await supabase
        .from('deals')
        .select(`
          *,
          products (*),
          seller:profiles!seller_id ( full_name, phone_number ),
          buyer:profiles!buyer_id ( full_name, phone_number )
        `)
        .eq('id', dealId)
        .single();

      if (fetchError) {
        // Hapa ndipo utaona kosa halisi kwenye console!
        console.error('DATABASE ERROR:', fetchError.message);
        throw new Error(fetchError.message);
      }

      if (!dealData) throw new Error('Dili halijapatikana');

      let other_party_info = { label: '', name: '', phone: '' };

      // Logic ya kutambua role
      if (dealData.seller_id === user.id) {
        setRole('vendor');
        other_party_info = {
          label: 'Customer info',
          name: dealData.buyer?.full_name || 'Verified Customer',
          phone: dealData.buyer?.phone_number || dealData.buyer_phone || 'No phone'
        };
      } else {
        setRole('customer');
        other_party_info = {
          label: 'Vendor info',
          name: dealData.seller?.full_name || 'Verified Vendor',
          phone: dealData.seller?.phone_number || 'No phone'
        };
      }

      setDeal({ ...dealData, other_party: other_party_info });

    } catch (err: any) {
      // Sasa hivi haitakupa {} tena, itakuambia tatizo!
      console.error('Kosa Halisi:', err.message);
      alert('Imeshindwa kufungua dili: ' + err.message);
      // router.push('/dashboard'); // Tunai-comment kwanza ili usipate bounce loop
    } finally {
      setLoading(false);
    }
  };

  // Timer Logic
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
        const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((difference / 1000 / 60) % 60);
        const seconds = Math.floor((difference / 1000) % 60);
        setTimeLeft(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [deal]);

  const updateDealStatus = async (newStatus: 'shipped' | 'completed' | 'disputed') => {
    const confirmMessage = newStatus === 'completed' ? "Thibitisha umepokea mzigo?" : "Thibitisha mabadiliko?";
    if (!window.confirm(confirmMessage)) return;

    setIsUpdating(true);
    try {
      const { error } = await supabase.from('deals').update({ status: newStatus }).eq('id', dealId);
      if (error) throw error;
      setDeal({ ...deal, status: newStatus });
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <div className="w-10 h-10 border-4 border-surface-muted border-t-accent rounded-full animate-spin"></div>
        <p className="text-[14px] font-bold text-muted animate-pulse">Loading deal details...</p>
      </div>
    );
  }

  if (!deal) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-[18px] font-black text-foreground mb-2">Deal not found</h2>
        <button onClick={() => router.push('/dashboard')} className="mt-4 px-6 py-2 bg-foreground text-background rounded-full">Go Back</button>
      </div>
    );
  }

  const steps = ['paid', 'shipped', 'completed'];
  const currentStepIndex = deal.status === 'pending_payment' ? -1 : steps.indexOf(deal.status === 'disputed' ? 'paid' : deal.status);

  return (
    <div className="min-h-screen bg-background flex flex-col pb-24 animate-fade-in">
      
      {/* HEADER */}
      <div className="bg-background/95 backdrop-blur-md pt-12 pb-4 px-6 flex items-center justify-between sticky top-0 z-30 border-b border-surface-muted">
        <button onClick={() => router.push('/dashboard')} className="w-11 h-11 bg-surface rounded-full flex items-center justify-center border border-surface-muted shadow-sm">
          <svg className="w-5 h-5 text-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
        </button>
        <h1 className="text-[17px] font-extrabold text-foreground tracking-tight">Deal summary</h1>
        <div className="w-11"></div>
      </div>

      <div className="flex-1 px-6 mt-6 max-w-md mx-auto w-full space-y-5">
        
        {/* TIMER/STATUS CARD */}
        <div className="bg-surface rounded-[28px] p-6 border border-surface-muted shadow-sm">
           <div className="flex items-center justify-between relative mb-8 px-2">
            <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-1 bg-background border border-surface-muted rounded-full"></div>
            <div className="absolute left-6 top-1/2 -translate-y-1/2 h-1 bg-accent rounded-full transition-all duration-700" style={{ width: `${Math.max(0, (currentStepIndex / (steps.length - 1)) * 100)}%`, maxWidth: 'calc(100% - 48px)' }}></div>
            {['Paid', 'Shipped', 'Final'].map((label, index) => (
              <div key={index} className="relative z-10 flex flex-col items-center gap-2 bg-surface px-1">
                <div className={`w-4 h-4 rounded-full border-4 ${index <= currentStepIndex ? 'bg-accent border-accent/20' : 'bg-background border-surface-muted'}`}></div>
                <span className={`text-[11px] font-bold ${index <= currentStepIndex ? 'text-foreground' : 'text-muted'}`}>{label}</span>
              </div>
            ))}
          </div>
          <div className="text-center mt-12">
            <p className="text-[12px] font-bold text-muted uppercase tracking-widest mb-1">Time Left</p>
            <h2 className={`text-[42px] font-black tracking-tighter leading-none ${deal.status === 'completed' ? 'text-green-600' : 'text-accent'}`}>
              {deal.status === 'completed' ? 'Done' : timeLeft}
            </h2>
          </div>
        </div>

        {/* OTHER PARTY */}
        <div className="bg-surface rounded-[24px] border border-surface-muted p-5 shadow-sm flex items-center justify-between">
           <div className="flex flex-col">
              <span className="text-[12px] font-bold text-muted uppercase tracking-widest mb-1">{deal.other_party?.label}</span>
              <span className="text-[16px] font-extrabold text-foreground">{deal.other_party?.name}</span>
              <span className="text-[14px] font-medium text-muted">{deal.other_party?.phone}</span>
           </div>
           {deal.other_party?.phone !== 'No phone' && (
             <a href={`tel:${deal.other_party?.phone}`} className="w-12 h-12 bg-accent/10 text-accent rounded-full flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
             </a>
           )}
        </div>

        {/* ACTIONS */}
        <div className="py-2">
          {role === 'vendor' && deal.status === 'paid' && (
            <button onClick={() => updateDealStatus('shipped')} disabled={isUpdating} className="w-full bg-accent text-white py-4.5 rounded-[22px] text-[16px] font-extrabold shadow-lg shadow-accent/20">
              Mark as shipped 🚀
            </button>
          )}
          {role === 'customer' && (deal.status === 'paid' || deal.status === 'shipped') && (
            <div className="flex flex-col gap-3">
              <button onClick={() => updateDealStatus('completed')} disabled={isUpdating} className="w-full bg-accent text-white py-4.5 rounded-[22px] text-[16px] font-extrabold">
                Confirm Received ✓
              </button>
              <button onClick={() => updateDealStatus('disputed')} disabled={isUpdating} className="w-full bg-background border border-danger text-danger py-4 rounded-[22px] text-[15px] font-bold">
                Open Dispute
              </button>
            </div>
          )}
        </div>

        {/* ITEM DETAILS */}
        <div className="bg-surface rounded-[24px] border border-surface-muted overflow-hidden">
          <div onClick={() => setIsProductExpanded(!isProductExpanded)} className="flex items-center justify-between px-5 py-4 cursor-pointer">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-background rounded-[12px] border border-surface-muted overflow-hidden">
                {deal.products?.images?.[0] && <img src={deal.products.images[0]} className="w-full h-full object-cover" />}
              </div>
              <div className="flex flex-col">
                <span className="text-[15px] font-bold text-foreground">{deal.products?.title}</span>
                <span className="text-[12px] font-mono text-muted">{deal.products?.product_code}</span>
              </div>
            </div>
            <svg className={`w-4 h-4 text-muted transition-transform ${isProductExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
          </div>
          {isProductExpanded && (
            <div className="px-5 pb-5 pt-2 bg-background/50 border-t border-surface-muted">
              <p className="text-[14px] text-muted mb-4">{deal.products?.description}</p>
              <div className="grid grid-cols-4 gap-2">
                {deal.products?.images?.map((img: string, i: number) => (
                  <img key={i} src={img} className="aspect-square rounded-[8px] object-cover border border-surface-muted" />
                ))}
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
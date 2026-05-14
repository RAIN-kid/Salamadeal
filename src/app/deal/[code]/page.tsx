'use client';

import { useEffect, useState, use } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function CheckoutPage({ params }: { params: Promise<{ code: string }> }) {
  const router = useRouter();
  const unwrappedParams = use(params);
  const dealCode = unwrappedParams.code;

  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Wizard Steps (1: Preview -> 2: Delivery -> 3: Checkout/Pay)
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  
  // Taarifa za Fomu
  const [region, setRegion] = useState('');
  const [station, setStation] = useState('');
  const [profilePhone, setProfilePhone] = useState(''); // Read-only kwa Step 2
  const [paymentPhone, setPaymentPhone] = useState(''); // Inayotumika kulipa Step 3
  
  useEffect(() => {
    if (dealCode) checkUserAndFetchDeal();
  }, [dealCode]);

  const checkUserAndFetchDeal = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push(`/auth/login?next=/deal/${dealCode}`);
        return;
      }

      const { data, error } = await supabase
        .from('products')
        .select('*, profiles!seller_id(full_name)')
        .eq('product_code', dealCode)
        .single();

      if (error || !data) {
        alert("Deal not found.");
        router.push('/');
        return;
      }

      setProduct(data);

      // Kuvuta namba ya simu ya mnunuzi
      const { data: profile } = await supabase.from('profiles').select('phone').eq('id', user.id).single();
      if (profile && profile.phone) {
        setProfilePhone(profile.phone);
        setPaymentPhone(profile.phone); // Tuna-prefill kwa ajili ya Step 3
      }

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const itemPrice = product?.price || 0;
  const escrowFee = itemPrice * 0.03; 
  const buyerPaysFee = product?.fee_payer === 'buyer';
  const totalToPay = buyerPaysFee ? itemPrice + escrowFee : itemPrice;

  // Hatua ya 2 kwenda 3
  const handleProceedToCheckout = () => {
    if (!region.trim() || !station.trim()) {
      alert("Please provide your delivery region and station.");
      return;
    }
    setStep(3);
  };

  // Hatua ya mwisho (Kulipa)
  const handlePayNow = () => {
    if (!paymentPhone.trim() || paymentPhone.length < 9) {
      alert("Please enter a valid mobile money number.");
      return;
    }
    alert(`Tayari! Tunatuma ombi la kukata TZS ${totalToPay.toLocaleString()} kwenye namba: ${paymentPhone} kupitia BEEM API! 🚀`);
  };

  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (product && lightboxIndex !== null) setLightboxIndex((lightboxIndex + 1) % product.images.length);
  };

  const handlePrevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (product && lightboxIndex !== null) setLightboxIndex((lightboxIndex - 1 + product.images.length) % product.images.length);
  };

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center"><div className="w-8 h-8 border-4 border-surface-muted border-t-accent rounded-full animate-spin"></div></div>;
  if (!product) return null;

  const productCode = product.product_code || 'No Code';

  return (
    <div className="min-h-screen bg-background flex flex-col relative pb-24 animate-fade-in">
      
      {/* 1. STICKY TOP HEADER & GEN Z PROGRESS BAR */}
      <div className="bg-background/95 backdrop-blur-md pt-12 pb-2 sticky top-0 z-30 border-b border-surface-muted shadow-sm">
        <div className="px-6 flex items-center justify-between mb-3">
          <button 
            onClick={() => step === 1 ? router.push('/') : setStep((prev) => (prev - 1) as any)} 
            className="w-11 h-11 bg-surface rounded-full flex items-center justify-center border border-surface-muted shadow-sm active:scale-95 transition-transform"
          >
            <svg className="w-5 h-5 text-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
          </button>
          
          <h1 className="text-[17px] font-extrabold text-foreground tracking-tight">
            {step === 1 && 'Preview Item'}
            {step === 2 && 'Delivery Info'}
            {step === 3 && 'Secure Checkout'}
          </h1>
          <div className="w-11"></div> 
        </div>
        
        {/* Progress Bar ya Kibabe (Glowing Capsules) */}
        <div className="px-8 flex gap-2">
          <div className={`h-1.5 rounded-full transition-all duration-300 ease-out flex-1 ${step >= 1 ? 'bg-accent shadow-[0_0_8px_rgba(37,99,235,0.4)]' : 'bg-surface-muted'}`}></div>
          <div className={`h-1.5 rounded-full transition-all duration-300 ease-out flex-1 ${step >= 2 ? 'bg-accent shadow-[0_0_8px_rgba(37,99,235,0.4)]' : 'bg-surface-muted'}`}></div>
          <div className={`h-1.5 rounded-full transition-all duration-300 ease-out flex-1 ${step >= 3 ? 'bg-accent shadow-[0_0_8px_rgba(37,99,235,0.4)]' : 'bg-surface-muted'}`}></div>
        </div>
      </div>

      <div className="flex-1 px-6 mt-6 max-w-md mx-auto w-full">
        
        {/* ============================================== */}
        {/* STEP 1: PREVIEW */}
        {/* ============================================== */}
        {step === 1 && (
          <div className="animate-slide-up space-y-6 pb-10">
            <div>
              <div className="flex justify-between items-start mb-2">
                <h1 className="text-[22px] font-extrabold text-foreground leading-tight pr-4">{product.title}</h1>
                <span className="bg-surface border border-surface-muted px-3 py-1.5 rounded-[12px] text-[13px] font-bold text-foreground font-mono tracking-wider shadow-sm">
                  {productCode}
                </span>
              </div>
              <div className="mt-4">
                 <span className="text-[13px] font-bold text-muted uppercase tracking-widest mb-1 block">Selling Price</span>
                 <div className="flex items-end gap-1.5">
                    <span className="text-[20px] font-bold text-accent mb-1.5">TZS</span>
                    <p className="text-[42px] font-black text-foreground tracking-tight leading-none">
                      {product.price?.toLocaleString()}
                    </p>
                 </div>
              </div>
            </div>

            <div className="bg-surface p-5 rounded-[24px] shadow-sm border border-surface-muted">
              <h3 className="text-[14px] font-bold text-foreground mb-2">Description</h3>
              <p className="text-[15px] text-muted leading-relaxed font-medium">{product.description}</p>
            </div>

            {product.images && product.images.length > 0 && (
              <div>
                <h3 className="text-[14px] font-bold text-muted uppercase tracking-widest mb-3 ml-1">Photos</h3>
                <div className="grid grid-cols-4 gap-3">
                  {product.images.map((img: string, idx: number) => (
                    <button key={idx} onClick={() => setLightboxIndex(idx)} className="aspect-square w-full rounded-[16px] bg-surface border border-surface-muted overflow-hidden active:scale-95 transition-transform shadow-sm">
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-surface rounded-[24px] shadow-sm border border-surface-muted overflow-hidden">
              <div className="flex justify-between items-center p-5 border-b border-surface-muted">
                <span className="text-[14px] font-medium text-muted">Estimated Delivery</span>
                <span className="text-[14px] font-bold text-foreground">{product.delivery_days_limit || '1'} Days</span>
              </div>
              <div className="flex justify-between items-center p-5">
                <span className="text-[14px] font-medium text-muted">Protection Fee</span>
                <span className="text-[14px] font-bold text-accent">3% Applied</span>
              </div>
            </div>

            <button 
              onClick={() => setStep(2)}
              className="w-full py-4.5 rounded-[22px] text-[16px] font-extrabold text-white bg-accent shadow-lg shadow-accent/20 active:scale-[0.98] transition-all flex justify-center items-center gap-2"
            >
              Continue to Delivery
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
            </button>
          </div>
        )}

        {/* ============================================== */}
        {/* STEP 2: DELIVERY INFO */}
        {/* ============================================== */}
        {step === 2 && (
          <div className="animate-slide-up space-y-6">
            <div className="mb-4">
              <h2 className="text-[22px] font-extrabold text-foreground mb-2">Where to? 📍</h2>
              <p className="text-[14.5px] text-muted font-medium">Please provide your drop-off details.</p>
            </div>

            <div className="space-y-5">
              
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-[13px] font-bold text-foreground mb-2 ml-1">Region (Mkoa)</label>
                  <input type="text" value={region} onChange={(e) => setRegion(e.target.value)} className="w-full px-5 py-4 bg-surface border border-surface-muted rounded-[20px] text-[16px] font-bold text-foreground focus:outline-none focus:border-accent transition-all" placeholder="Dar es Salaam" />
                </div>
                <div className="flex-1">
                  <label className="block text-[13px] font-bold text-foreground mb-2 ml-1">Point (Kituo)</label>
                  <input type="text" value={station} onChange={(e) => setStation(e.target.value)} className="w-full px-5 py-4 bg-surface border border-surface-muted rounded-[20px] text-[16px] font-bold text-foreground focus:outline-none focus:border-accent transition-all" placeholder="Makumbusho" />
                </div>
              </div>

              {/* Read-Only Verified Contact Display (Mbwembwe) */}
              {profilePhone && (
                <div className="mt-4 opacity-80 pointer-events-none">
                  <label className="block text-[13px] font-bold text-muted mb-2 ml-1">Verified Contact</label>
                  <div className="flex justify-between items-center bg-surface border border-surface-muted rounded-[20px] p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center text-green-500">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                      </div>
                      <span className="text-[15px] font-bold text-muted tracking-wide">{profilePhone}</span>
                    </div>
                  </div>
                </div>
              )}

            </div>

            <div className="pt-4">
              <button 
                onClick={handleProceedToCheckout}
                className="w-full py-4.5 rounded-[22px] text-[16px] font-extrabold text-white bg-foreground shadow-lg active:scale-[0.98] transition-transform"
              >
                Proceed to Checkout
              </button>
            </div>
          </div>
        )}

        {/* ============================================== */}
        {/* STEP 3: SUMMARY & PAYMENT NUMBER (PESA TU) */}
        {/* ============================================== */}
        {step === 3 && (
          <div className="animate-slide-up space-y-6 pb-8">
            <h2 className="text-[22px] font-extrabold text-foreground mb-2">Final Summary 💳</h2>

            {/* Receipt Summary (Ya pesa tu) */}
            <div className="bg-surface rounded-[28px] border border-surface-muted p-6 shadow-sm space-y-4">
              <div className="flex justify-between">
                <span className="text-muted font-medium">Item</span>
                <span className="text-foreground font-bold truncate max-w-[150px]">{product.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted font-medium">Protection Fee</span>
                <span className="text-foreground font-bold">TZS {escrowFee.toLocaleString()}</span>
              </div>
              <div className="pt-4 border-t border-dashed border-surface-muted flex justify-between items-end">
                <span className="text-muted font-black uppercase tracking-widest text-[12px]">Total to Pay</span>
                <span className="text-[26px] font-black text-accent">TZS {totalToPay.toLocaleString()}</span>
              </div>
            </div>

            {/* BIG PAYMENT PHONE INPUT */}
            <div className="pt-4">
              <label className="block text-[13px] font-bold text-foreground mb-2 ml-1">Mobile Money Number</label>
              <input 
                type="tel" 
                value={paymentPhone} 
                onChange={(e) => setPaymentPhone(e.target.value)} 
                className="w-full px-5 py-5 bg-surface border-2 border-surface-muted rounded-[22px] text-[22px] font-black text-foreground text-center tracking-[3px] focus:outline-none focus:ring-4 focus:ring-accent/10 focus:border-accent transition-all" 
                placeholder="07XX XXX XXX" 
              />
              <p className="text-[12px] font-medium text-muted mt-3 text-center">You will receive a push notification to enter your PIN.</p>
            </div>

            {/* THE PAY BUTTON */}
            <div className="pt-2">
              <button 
                onClick={handlePayNow}
                className="w-full py-5 rounded-[22px] text-[18px] font-black text-white bg-accent shadow-xl shadow-accent/30 active:scale-[0.95] transition-all flex justify-center items-center gap-3"
              >
                Pay Now
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              </button>
            </div>
          </div>
        )}

      </div>
      
      {/* ========================================= */}
      {/* 🟢 FULLSCREEN IMAGE LIGHTBOX 🟢 */}
      {/* ========================================= */}
      {lightboxIndex !== null && (
        <div className="fixed inset-0 z-[100] bg-foreground/95 flex items-center justify-center backdrop-blur-md animate-fade-in" onClick={() => setLightboxIndex(null)}>
          <button className="absolute top-12 right-6 text-surface bg-surface-muted/20 p-2.5 rounded-full hover:bg-surface-muted/30 transition-colors">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
          <img src={product.images[lightboxIndex]} alt="Fullscreen" className="w-full max-h-[85vh] object-contain select-none shadow-2xl" onClick={(e) => e.stopPropagation()} />
          {product.images.length > 1 && (
            <div className="absolute bottom-12 left-0 right-0 flex justify-center gap-8 px-4">
              <button onClick={handlePrevImage} className="w-14 h-14 bg-surface-muted/20 text-surface rounded-full flex items-center justify-center hover:bg-surface-muted/30 active:scale-90 transition-all backdrop-blur-sm"><svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg></button>
              <button onClick={handleNextImage} className="w-14 h-14 bg-surface-muted/20 text-surface rounded-full flex items-center justify-center hover:bg-surface-muted/30 active:scale-90 transition-all backdrop-blur-sm"><svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg></button>
            </div>
          )}
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        .animate-fade-in { animation: fadeIn 0.2s ease-out forwards; }
        .animate-slide-up { animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
      `}} />
    </div>
  );
}
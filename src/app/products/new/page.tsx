'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function CreateDealPage() {
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [deliveryDays, setDeliveryDays] = useState(1);
  const [feePayer, setFeePayer] = useState<'buyer' | 'seller'>('buyer');
  const [images, setImages] = useState<File[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  
  // State kwa ajili ya Success Modal
  const [createdProductId, setCreatedProductId] = useState<string | null>(null);
  
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/auth/login?next=/products/new');
      } else {
        setIsCheckingAuth(false);
      }
    };
    checkAuth();
  }, [router]);

  const incrementDays = () => deliveryDays < 3 && setDeliveryDays(prev => prev + 1);
  const decrementDays = () => deliveryDays > 1 && setDeliveryDays(prev => prev - 1);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      if (images.length + selectedFiles.length > 5) {
        alert('Maximum of 5 photos allowed.');
        return;
      }
      setImages((prev) => [...prev, ...selectedFiles]);
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (images.length === 0) return alert('Please add at least one photo.');
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return; 

      const { data: profile } = await supabase.from('profiles').select('id').eq('id', user.id).single();
      if (!profile) {
        await supabase.from('profiles').insert({ id: user.id, email: user?.email });
      }

      const uploadedImageUrls = [];
      for (const file of images) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`; 

        const { error: uploadError } = await supabase.storage
          .from('deals-images')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from('deals-images')
          .getPublicUrl(filePath);
          
        uploadedImageUrls.push(publicUrlData.publicUrl);
      }

      const productCode = 'SD-' + Math.floor(1000 + Math.random() * 9000);

      // Tunasukuma taarifa na KUVUTA ID YA ITEM MPYA ili tuipeleke kwenye modal
      const { data: insertedProduct, error: dbError } = await supabase.from('products').insert({
        seller_id: user.id,
        title,
        price: parseFloat(price),
        description,
        delivery_days_limit: deliveryDays,
        fee_payer: feePayer, 
        images: uploadedImageUrls,
        product_code: productCode
      }).select('id').single();

      if (dbError) throw dbError;

      // Badala ya Alert, tunawasha Success Modal! 🎉
      setCreatedProductId(insertedProduct.id);

    } catch (error: any) {
      console.error(error);
      alert('An error occurred: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Logic ya ku-reset form kama anataka kuongeza bidhaa nyingine
  const handleAddAnother = () => {
    setTitle('');
    setPrice('');
    setDescription('');
    setDeliveryDays(1);
    setFeePayer('buyer');
    setImages([]);
    setCreatedProductId(null);
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-surface-muted border-t-accent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground pb-20 relative animate-fade-in">
      
      {/* 1. TOP HEADER (Standard Inner Page Header) */}
      <div className="bg-background/90 backdrop-blur-md pt-12 pb-4 px-6 flex items-center justify-between sticky top-0 z-20 border-b border-surface">
        <button 
          onClick={() => router.back()} 
          className="w-11 h-11 bg-surface rounded-full flex items-center justify-center border border-surface-muted shadow-sm active:scale-95 transition-transform"
        >
          <svg className="w-5 h-5 text-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
        </button>
        <h1 className="text-[18px] font-extrabold text-foreground tracking-tight">Sell an Item</h1>
        <div className="w-11"></div> 
      </div>

      <div className="max-w-md mx-auto px-6 mt-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* BIG FINTECH PRICE INPUT */}
          <div className="bg-surface p-6 rounded-[28px] border border-surface-muted shadow-sm text-center">
             <label className="block text-[12px] font-bold text-muted uppercase tracking-widest mb-2">Item Price (TZS)</label>
             <div className="flex justify-center items-center gap-1">
               <span className="text-[24px] font-bold text-muted">TZS</span>
               <input 
                 type="number" 
                 required 
                 min="1000" 
                 value={price} 
                 onChange={(e) => setPrice(e.target.value)} 
                 className="w-[60%] bg-transparent border-none text-[42px] font-black text-foreground text-center focus:outline-none placeholder-surface-muted leading-none" 
                 placeholder="0" 
               />
             </div>
          </div>

          {/* ITEM TITLE */}
          <div>
            <label className="block text-[13px] font-bold text-foreground mb-2 ml-1">Item Title</label>
            <input 
              type="text" 
              required 
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
              className="w-full px-5 py-4 bg-surface border border-surface-muted rounded-[20px] text-[16px] font-bold text-foreground placeholder-muted focus:outline-none focus:border-accent focus:bg-background transition-colors" 
              placeholder="e.g. iPhone 15 Pro Max" 
            />
          </div>

          {/* ITEM DESCRIPTION */}
          <div>
            <label className="block text-[13px] font-bold text-foreground mb-2 ml-1">Condition & Details</label>
            <textarea 
              required 
              value={description} 
              onChange={(e) => setDescription(e.target.value)} 
              rows={3} 
              className="w-full px-5 py-4 bg-surface border border-surface-muted rounded-[20px] text-[15px] font-medium text-foreground placeholder-muted focus:outline-none focus:border-accent focus:bg-background transition-colors resize-none leading-relaxed" 
              placeholder="Describe the item condition, rules, or what's included..." 
            />
          </div>

          {/* DELIVERY DAYS & FEE PAYER (Side by side) */}
          <div className="flex gap-4">
            <div className="w-[120px] flex-shrink-0">
              <label className="block text-[13px] font-bold text-foreground mb-2 ml-1">Delivery</label>
              <div className="flex items-center justify-between px-2 py-3 bg-surface border border-surface-muted rounded-[20px]">
                <button type="button" onClick={decrementDays} className="w-8 h-8 flex items-center justify-center rounded-xl bg-background text-foreground shadow-sm text-lg font-bold hover:bg-surface-muted disabled:opacity-50 transition-all" disabled={deliveryDays <= 1}>-</button>
                <span className="text-[15px] font-extrabold">{deliveryDays}d</span>
                <button type="button" onClick={incrementDays} className="w-8 h-8 flex items-center justify-center rounded-xl bg-background text-foreground shadow-sm text-lg font-bold hover:bg-surface-muted disabled:opacity-50 transition-all" disabled={deliveryDays >= 3}>+</button>
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <label className="block text-[13px] font-bold text-foreground mb-2 ml-1">Who pays 3% fee?</label>
              <div className="flex bg-surface p-1.5 border border-surface-muted rounded-[20px]">
                <button
                  type="button"
                  onClick={() => setFeePayer('buyer')}
                  className={`flex-1 py-3 text-[14px] font-bold rounded-[14px] transition-all duration-200 ${feePayer === 'buyer' ? 'bg-background text-foreground shadow-sm' : 'text-muted hover:text-foreground'}`}
                >
                  Buyer
                </button>
                <button
                  type="button"
                  onClick={() => setFeePayer('seller')}
                  className={`flex-1 py-3 text-[14px] font-bold rounded-[14px] transition-all duration-200 ${feePayer === 'seller' ? 'bg-background text-foreground shadow-sm' : 'text-muted hover:text-foreground'}`}
                >
                  Me
                </button>
              </div>
            </div>
          </div>

          {/* PHOTOS */}
          <div>
            <label className="block text-[13px] font-bold text-foreground mb-2 ml-1">Photos (Up to 5)</label>
            <div className="flex flex-wrap gap-3 mt-1">
              {images.map((img, index) => (
                <div key={index} className="relative h-[80px] w-[80px] rounded-[20px] overflow-hidden border border-surface-muted bg-surface shadow-sm">
                  <img src={URL.createObjectURL(img)} alt="Preview" className="h-full w-full object-cover" />
                  <button type="button" onClick={() => removeImage(index)} className="absolute top-1 right-1 bg-black/50 backdrop-blur-md text-white rounded-full w-6 h-6 flex items-center justify-center text-sm active:scale-90 transition-transform pb-0.5">x</button>
                </div>
              ))}
              {images.length < 5 && (
                <label className="h-[80px] w-[80px] flex flex-col items-center justify-center rounded-[20px] bg-surface border-2 border-dashed border-surface-muted cursor-pointer hover:bg-surface-muted/50 transition-colors active:scale-95">
                  <span className="text-2xl text-muted font-medium mb-1">+</span>
                  <input type="file" accept="image/*" multiple onChange={handleImageChange} className="hidden" />
                </label>
              )}
            </div>
          </div>

          {/* SUBMIT BUTTON */}
          <div className="pt-6">
            <button 
              type="submit" 
              disabled={loading} 
              className="w-full py-4.5 rounded-[20px] text-[16px] font-extrabold text-white bg-accent shadow-lg shadow-accent/30 hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 flex justify-center items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Generating Deal...
                </>
              ) : (
                'Create Deal Link'
              )}
            </button>
          </div>
        </form>
      </div>

      {/* ========================================= */}
      {/* 🟢 SUCCESS MODAL (Popup ya Ushindi) 🟢 */}
      {/* ========================================= */}
      {createdProductId && (
        <>
          {/* Background Blur */}
          <div className="fixed inset-0 bg-foreground/20 z-40 backdrop-blur-md animate-fade-in"></div>
          
          {/* Modal Container */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 pointer-events-none">
            <div className="w-full max-w-sm bg-background rounded-[32px] p-8 shadow-2xl pointer-events-auto animate-slide-up border border-surface-muted flex flex-col items-center text-center">
              
              {/* Emoji/Icon */}
              <div className="w-20 h-20 bg-surface rounded-full flex items-center justify-center text-4xl mb-5 shadow-sm border border-surface-muted">
                🛍️
              </div>
              
              <h2 className="text-[22px] font-extrabold text-foreground mb-2">Item Added!</h2>
              <p className="text-[14px] text-muted font-medium mb-8">
                Your deal is ready. Grab the link and send it to your buyer to secure the bag.
              </p>

              <div className="w-full flex flex-col gap-3">
                {/* BUTTON 1: View Item (Kuchukua Link) */}
                <button 
                  onClick={() => router.push(`/products/${createdProductId}`)}
                  className="w-full py-4 rounded-[18px] bg-accent text-white font-extrabold text-[15px] shadow-lg shadow-accent/20 active:scale-95 transition-transform"
                >
                  View Item & Get Link
                </button>
                
                {/* BUTTON 2: Add Another */}
                <button 
                  onClick={handleAddAnother}
                  className="w-full py-4 rounded-[18px] bg-surface text-foreground font-bold text-[15px] border border-surface-muted active:bg-surface-muted active:scale-95 transition-all"
                >
                  Add Another Item
                </button>
              </div>

            </div>
          </div>
        </>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        .animate-fade-in { animation: fadeIn 0.3s ease-out forwards; }
        .animate-slide-up { animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: scale(0.95) translateY(20px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        
        /* Hide arrows from number input */
        input[type=number]::-webkit-inner-spin-button, 
        input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
        input[type=number] { -moz-appearance: textfield; }
      `}} />
    </div>
  );
}
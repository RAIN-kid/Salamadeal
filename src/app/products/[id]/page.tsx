'use client';

import { useEffect, useState, use } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const unwrappedParams = use(params);
  const productId = unwrappedParams.id;

  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copiedType, setCopiedType] = useState<string | null>(null);
  
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  useEffect(() => {
    if (productId) fetchProductDetail();
  }, [productId]);

  const fetchProductDetail = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single();

      if (error) throw error;
      setProduct(data);
    } catch (err) {
      router.push('/products');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  };

  const deleteProduct = async () => {
    if(!window.confirm("Are you sure you want to delete this item permanently?")) return;
    try {
      await supabase.from('products').delete().eq('id', productId);
      router.push('/products');
    } catch (err) {
      alert("Failed to delete item.");
    }
  };

  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (product && lightboxIndex !== null) {
      setLightboxIndex((lightboxIndex + 1) % product.images.length);
    }
  };

  const handlePrevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (product && lightboxIndex !== null) {
      setLightboxIndex((lightboxIndex - 1 + product.images.length) % product.images.length);
    }
  };

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center"><div className="w-8 h-8 border-4 border-surface-muted border-t-accent rounded-full animate-spin"></div></div>;
  if (!product) return null;

  const productCode = product.product_code || 'No Code';
  const dealLink = typeof window !== 'undefined' ? `${window.location.origin}/deal/${productCode}` : '';
  
  return (
    <div className="min-h-screen flex flex-col relative pb-12 bg-background animate-fade-in">
      
      {/* 1. TOP HEADER (Standard Design System) */}
      <div className="bg-background/90 backdrop-blur-md pt-12 pb-4 px-6 flex items-center justify-between sticky top-0 z-20">
        <button 
          onClick={() => router.push('/products')} 
          className="w-11 h-11 bg-surface rounded-full flex items-center justify-center border border-surface-muted shadow-sm active:scale-95 transition-transform"
        >
          <svg className="w-5 h-5 text-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
        </button>
        <h1 className="text-[18px] font-extrabold text-foreground tracking-tight">Item Details</h1>
        <div className="w-11"></div> 
      </div>

      <div className="flex-1 px-6 mt-6 space-y-6">
        
        {/* 2. TITLE & FINTECH PRICING */}
        <div>
          <div className="flex justify-between items-start mb-2">
            <h1 className="text-[22px] font-extrabold text-foreground leading-tight pr-4">{product.title}</h1>
            <span className="bg-surface border border-surface-muted px-3 py-1.5 rounded-[12px] text-[13px] font-bold text-foreground font-mono tracking-wider whitespace-nowrap shadow-sm">
              {productCode}
            </span>
          </div>
          
          <div className="mt-4">
             <span className="text-[13px] font-bold text-muted uppercase tracking-widest mb-1 block">Selling Price</span>
             <div className="flex items-end gap-1.5">
                <span className="text-[20px] font-bold text-muted mb-1.5">TZS</span>
                <p className="text-[42px] font-black text-foreground tracking-tight leading-none">
                  {product.price?.toLocaleString()}
                </p>
             </div>
          </div>
        </div>

        {/* 3. DESCRIPTION CARD */}
        {product.description && (
          <div className="bg-surface p-5 rounded-[24px] shadow-sm border border-surface-muted">
            <h3 className="text-[14px] font-bold text-foreground mb-2">About this item</h3>
            <p className="text-[15px] text-muted leading-relaxed font-medium">
              {product.description}
            </p>
          </div>
        )}

        {/* 4. IMAGES GRID */}
        {product.images && product.images.length > 0 && (
          <div>
            <h3 className="text-[14px] font-bold text-muted uppercase tracking-widest mb-3 ml-1">Photos</h3>
            <div className="grid grid-cols-4 gap-3">
              {product.images.map((img: string, idx: number) => (
                <button 
                  key={idx} 
                  onClick={() => setLightboxIndex(idx)}
                  className="aspect-square w-full rounded-[16px] bg-surface border border-surface-muted overflow-hidden active:scale-95 transition-transform shadow-sm"
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 5. DELIVERY & TERMS CARD */}
        <div>
          <h3 className="text-[14px] font-bold text-muted uppercase tracking-widest mb-3 ml-1">Terms</h3>
          <div className="bg-surface rounded-[24px] shadow-sm border border-surface-muted overflow-hidden">
            <div className="flex justify-between items-center p-5 border-b border-surface-muted">
              <span className="text-[15px] font-medium text-muted">Delivery timeframe</span>
              <span className="text-[15px] font-bold text-foreground">{product.delivery_days_limit || '1'} Days</span>
            </div>
            <div className="flex justify-between items-center p-5">
              <span className="text-[15px] font-medium text-muted">Escrow fee (3%)</span>
              <span className="text-[15px] font-bold text-foreground bg-background px-3 py-1 rounded-full border border-surface-muted">
                {product.fee_payer === 'buyer' ? 'Buyer pays' : 'I will pay'}
              </span>
            </div>
          </div>
        </div>

        {/* 6. SHARE ACTIONS */}
        <div>
          <h3 className="text-[14px] font-bold text-muted uppercase tracking-widest mb-3 ml-1">Share Deal</h3>
          <div className="flex flex-col gap-3">
            
            <button 
              onClick={() => handleCopy(dealLink, 'link')}
              className="w-full bg-surface border border-surface-muted text-foreground py-4 px-5 rounded-[20px] active:scale-[0.98] transition-transform flex justify-between items-center shadow-sm"
            >
              <div className="flex flex-col items-start min-w-0 pr-4">
                <span className="text-[15px] font-extrabold mb-0.5">Client Link</span>
                <span className="text-[13px] text-muted truncate w-full text-left font-medium">{dealLink}</span>
              </div>
              <span className={`text-[13px] font-extrabold px-3 py-1.5 rounded-full ${copiedType === 'link' ? 'bg-[#dcfce7] text-[#16a34a]' : 'bg-background text-accent border border-surface-muted'}`}>
                {copiedType === 'link' ? 'Copied!' : 'Copy'}
              </span>
            </button>

            <button 
              onClick={() => handleCopy(productCode, 'code')}
              className="w-full bg-surface border border-surface-muted text-foreground py-4 px-5 rounded-[20px] active:scale-[0.98] transition-transform flex justify-between items-center shadow-sm"
            >
              <div className="flex flex-col items-start min-w-0 pr-4">
                <span className="text-[15px] font-extrabold mb-0.5">Item Code</span>
                <span className="text-[14px] text-muted font-mono font-bold tracking-wider">{productCode}</span>
              </div>
              <span className={`text-[13px] font-extrabold px-3 py-1.5 rounded-full ${copiedType === 'code' ? 'bg-[#dcfce7] text-[#16a34a]' : 'bg-background text-accent border border-surface-muted'}`}>
                {copiedType === 'code' ? 'Copied!' : 'Copy'}
              </span>
            </button>

          </div>
        </div>

        {/* 7. DANGER ZONE */}
        <div className="pt-6 pb-8">
          <button 
            onClick={deleteProduct}
            className="w-full py-4.5 rounded-[20px] text-[15px] font-extrabold bg-danger-light text-danger active:scale-[0.98] transition-transform border border-red-100"
          >
            Delete Item
          </button>
        </div>

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
              <button onClick={handlePrevImage} className="w-14 h-14 bg-surface-muted/20 text-surface rounded-full flex items-center justify-center hover:bg-surface-muted/30 active:scale-90 transition-all backdrop-blur-sm">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
              </button>
              <button onClick={handleNextImage} className="w-14 h-14 bg-surface-muted/20 text-surface rounded-full flex items-center justify-center hover:bg-surface-muted/30 active:scale-90 transition-all backdrop-blur-sm">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
              </button>
            </div>
          )}
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        .animate-fade-in { animation: fadeIn 0.2s ease-out forwards; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(3px); } to { opacity: 1; transform: translateY(0); } }
      `}} />
    </div>
  );
}
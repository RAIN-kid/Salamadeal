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
  
  // State kwa ajili ya kuangalia picha Fullscreen
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
    if(!window.confirm("Una uhakika unataka kufuta bidhaa hii kabisa?")) return;
    try {
      await supabase.from('products').delete().eq('id', productId);
      router.push('/products');
    } catch (err) {
      alert("Imeshindwa kufuta bidhaa.");
    }
  };

  // Logic za kubadili picha Fullscreen
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

  if (loading) return <div className="min-h-screen bg-white flex items-center justify-center"><div className="w-8 h-8 border-4 border-gray-100 border-t-black rounded-full animate-spin"></div></div>;
  if (!product) return null;

  const productCode = product.product_code || 'Hakuna Code';
  const dealLink = typeof window !== 'undefined' ? `${window.location.origin}/deal/${productCode}` : '';
  
  return (
    <div className="min-h-screen bg-white pb-32 relative">
      
      {/* 1. HEADER (Safi, Inarudi kwenye List ya Bidhaa, Hakuna SalamaDeal) */}
      <div className="w-full bg-white/95 backdrop-blur-md px-5 py-4 flex items-center justify-between border-b border-gray-100 sticky top-0 z-20">
        <button onClick={() => router.push('/products')} className="p-2 -ml-2 bg-transparent rounded-full text-black hover:bg-gray-50 transition-colors">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
        </button>
        <span className="text-[17px] font-bold text-black">Taarifa za bidhaa</span>
        <div className="w-8"></div> {/* Spacer ku-balance title ikae katikati */}
      </div>

      <div className="max-w-xl mx-auto w-full px-5 mt-6 space-y-8">
        
        {/* 2. JINA NA BEI */}
        <div>
          <div className="flex justify-between items-start mb-1">
            <h1 className="text-[20px] font-bold text-black leading-tight pr-4">{product.title}</h1>
            <span className="bg-gray-100 px-3 py-1 rounded-full text-[13px] font-bold text-black whitespace-nowrap">
              {productCode}
            </span>
          </div>
          <p className="text-[30px] font-black text-black tracking-tight mt-1">
            <span className="text-[15px] font-bold mr-1.5 text-gray-400">TZS</span>
            {product.price?.toLocaleString()}
          </p>
        </div>

        {/* 3. MAELEZO (Flat design, no shadows) */}
        {product.description && (
          <div className="bg-[#F9FAFB] p-5 rounded-[16px]">
            <p className="text-[15px] text-gray-600 leading-relaxed">
              {product.description}
            </p>
          </div>
        )}

        {/* 4. PICHA ZANGU (Thumbnails Ndogo) */}
        {product.images && product.images.length > 0 && (
          <div>
            <h3 className="text-[14px] font-bold text-black mb-3">Picha</h3>
            <div className="grid grid-cols-4 gap-2">
              {product.images.map((img: string, idx: number) => (
                <button 
                  key={idx} 
                  onClick={() => setLightboxIndex(idx)}
                  className="aspect-square w-full rounded-[12px] bg-[#F9FAFB] border border-gray-100 overflow-hidden active:opacity-70 transition-opacity"
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 5. MCHANGANUO WA DATA (Minimal lines) */}
        <div>
          <h3 className="text-[14px] font-bold text-black mb-3">Malipo na usafiri</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-4 border-b border-gray-50">
              <span className="text-[15px] text-gray-500">Muda wa usafiri</span>
              <span className="text-[15px] font-bold text-black">Siku {product.delivery_days_limit || '1'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[15px] text-gray-500">Mlipia ada (3%)</span>
              <span className="text-[15px] font-bold text-black">
                {product.fee_payer === 'buyer' ? 'Mteja' : 'Muuzaji'}
              </span>
            </div>
          </div>
        </div>

        {/* 6. GAWANYA KWA MTEJA (Copy Actions - Flat Design) */}
        <div>
          <h3 className="text-[14px] font-bold text-black mb-3">Sambaza</h3>
          <div className="flex flex-col gap-2">
            
            <button 
              onClick={() => handleCopy(dealLink, 'link')}
              className="w-full bg-[#F9FAFB] text-black p-4 rounded-[16px] active:bg-gray-100 transition-colors flex justify-between items-center"
            >
              <div className="flex flex-col items-start min-w-0 pr-4">
                <span className="text-[15px] font-bold mb-0.5">Link ya mteja</span>
                <span className="text-[13px] text-gray-400 truncate w-full text-left">{dealLink}</span>
              </div>
              <span className={`text-[13px] font-bold ${copiedType === 'link' ? 'text-green-600' : 'text-blue-600'}`}>
                {copiedType === 'link' ? 'Copied' : 'Copy'}
              </span>
            </button>

            <button 
              onClick={() => handleCopy(productCode, 'code')}
              className="w-full bg-[#F9FAFB] text-black p-4 rounded-[16px] active:bg-gray-100 transition-colors flex justify-between items-center"
            >
              <div className="flex flex-col items-start min-w-0 pr-4">
                <span className="text-[15px] font-bold mb-0.5">Code ya bidhaa</span>
                <span className="text-[14px] text-gray-500 font-mono tracking-wider">{productCode}</span>
              </div>
              <span className={`text-[13px] font-bold ${copiedType === 'code' ? 'text-green-600' : 'text-blue-600'}`}>
                {copiedType === 'code' ? 'Copied' : 'Copy'}
              </span>
            </button>

          </div>
        </div>

        {/* 7. DANGER ZONE (Futa - Safi bila border) */}
        <div className="pt-4">
          <button 
            onClick={deleteProduct}
            className="w-full py-4.5 rounded-[16px] text-[15px] font-bold bg-[#FFF0F0] text-red-500 active:bg-[#FFE5E5] transition-colors"
          >
            Futa bidhaa
          </button>
        </div>

      </div>

      {/* ========================================= */}
      {/* 🟢 FULLSCREEN IMAGE LIGHTBOX 🟢 */}
      {/* ========================================= */}
      {lightboxIndex !== null && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center backdrop-blur-sm" onClick={() => setLightboxIndex(null)}>
          <button className="absolute top-6 right-6 text-white bg-white/10 p-2 rounded-full hover:bg-white/20 transition-colors">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
          <img src={product.images[lightboxIndex]} alt="Fullscreen" className="w-full max-h-[85vh] object-contain select-none" onClick={(e) => e.stopPropagation()} />
          
          {product.images.length > 1 && (
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
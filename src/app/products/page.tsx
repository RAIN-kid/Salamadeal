'use client';

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function MyProductsList() {
  const router = useRouter();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedType, setCopiedType] = useState<string | null>(null);
  
  const [activeProduct, setActiveProduct] = useState<any>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchMyProducts();
  }, []);

  const fetchMyProducts = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth/login');
        return;
      }

      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('seller_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (err: any) {
      console.error('Kosa:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTouchStart = (product: any) => {
    timerRef.current = setTimeout(() => {
      setActiveProduct(product);
      if (typeof window !== 'undefined' && window.navigator.vibrate) window.navigator.vibrate(50);
    }, 500);
  };

  const handleTouchEnd = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  };

  const handleClick = (id: string) => {
    if (!activeProduct) router.push(`/products/${id}`); 
  };

  // Logic mpya ya Copy inayo-handle "Copied" state
  const copyData = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  };

  const deleteProduct = async (id: string) => {
    if (!window.confirm("Futa bidhaa hii kabisa?")) return;
    try {
      await supabase.from('products').delete().eq('id', id);
      setProducts(products.filter(p => p.id !== id));
      setActiveProduct(null);
    } catch (err) {
      alert("Imeshindwa kufuta.");
    }
  };

  return (
    <div className="min-h-screen bg-white pb-24 relative">
      <div className="max-w-xl mx-auto w-full">
        
        {/* HEADER */}
        <div className="bg-white/95 backdrop-blur-md pt-12 pb-4 px-5 flex items-center justify-between border-b border-gray-100 sticky top-0 z-10">
          <div className="flex items-center">
            <h1 className="text-[22px] font-extrabold text-black tracking-tight">Bidhaa zangu</h1>
          </div>
          <button 
            onClick={() => router.push('/products/new')}
            className="w-10 h-10 bg-black text-white rounded-full flex items-center justify-center active:scale-95 transition-transform"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>
          </button>
        </div>

        {/* LIST YA BIDHAA */}
        <div className="mt-2">
          {loading ? (
            <div className="flex justify-center py-10"><div className="w-6 h-6 border-2 border-gray-200 border-t-black rounded-full animate-spin"></div></div>
          ) : products.length === 0 ? (
            <div className="text-center py-24 px-10">
              <p className="text-[15px] font-medium text-gray-500 mb-6">Huna bidhaa yoyote bado.</p>
              <button 
                onClick={() => router.push('/products/new')}
                className="bg-black text-white px-8 py-3.5 rounded-[14px] font-bold text-[14px]"
              >
                Sajili bidhaa
              </button>
            </div>
          ) : (
            <div className="flex flex-col">
              {products.map((product) => (
                <div 
                  key={product.id}
                  onTouchStart={() => handleTouchStart(product)}
                  onTouchEnd={handleTouchEnd}
                  onMouseDown={() => handleTouchStart(product)}
                  onMouseUp={handleTouchEnd}
                  onClick={() => handleClick(product.id)}
                  className="flex items-center gap-4 py-4 px-5 border-b border-gray-50 active:bg-gray-50 hover:bg-gray-50 transition-colors select-none cursor-pointer"
                >
                  <div className="w-14 h-14 rounded-[14px] bg-gray-50 overflow-hidden flex-shrink-0 border border-gray-100 pointer-events-none">
                    {product.images && product.images[0] && (
                      <img src={product.images[0]} alt="" className="w-full h-full object-cover" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 pointer-events-none">
                    <h3 className="text-[16px] font-semibold text-black tracking-tight truncate mb-0.5">
                      {product.title}
                    </h3>
                    <p className="text-[15px] font-bold text-black">
                      {product.price?.toLocaleString()} <span className="text-[12px] font-medium text-gray-400 ml-1">TZS</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* SHORTCUT BOTTOM SHEET (Minimal Design) */}
      {activeProduct && (
        <>
          <div className="fixed inset-0 bg-black/20 z-40 backdrop-blur-sm transition-opacity" onClick={() => setActiveProduct(null)}></div>
          <div className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none flex justify-center">
            
            <div className="w-full max-w-md bg-white rounded-t-[24px] p-6 pb-10 pointer-events-auto animate-slide-up border-t border-gray-100">
              <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-6"></div>
              
              <div className="flex items-center gap-4 mb-6">
                 <div className="w-12 h-12 rounded-[14px] bg-gray-50 overflow-hidden border border-gray-100">
                    {activeProduct.images && activeProduct.images[0] && (
                      <img src={activeProduct.images[0]} alt="" className="w-full h-full object-cover" />
                    )}
                 </div>
                 <div className="flex-1 min-w-0">
                    <h3 className="text-[16px] font-bold text-black truncate">{activeProduct.title}</h3>
                    <p className="text-[13px] font-medium text-gray-500">Njia ya mkato</p>
                 </div>
              </div>
              
              <div className="flex flex-col gap-2.5">
                {/* ACTION 1: Link */}
                <button 
                  onClick={() => copyData(`${window.location.origin}/deal/${activeProduct.product_code}`, 'link')} 
                  className="w-full bg-white border border-gray-200 text-black py-4 px-5 rounded-[16px] active:bg-gray-50 hover:bg-gray-50 transition-colors flex justify-between items-center"
                >
                  <div className="flex flex-col items-start min-w-0 pr-4">
                    <span className="text-[15px] font-semibold mb-0.5">Link ya mteja</span>
                    <span className="text-[13px] text-gray-400 truncate w-full text-left font-medium">
                      {`${window.location.origin}/deal/${activeProduct.product_code}`}
                    </span>
                  </div>
                  <span className={`text-[13px] font-bold ${copiedType === 'link' ? 'text-green-600' : 'text-blue-600'}`}>
                    {copiedType === 'link' ? 'Copied' : 'Copy'}
                  </span>
                </button>
                
                {/* ACTION 2: Code */}
                <button 
                  onClick={() => copyData(activeProduct.product_code, 'code')} 
                  className="w-full bg-white border border-gray-200 text-black py-4 px-5 rounded-[16px] active:bg-gray-50 hover:bg-gray-50 transition-colors flex justify-between items-center"
                >
                  <div className="flex flex-col items-start min-w-0 pr-4">
                    <span className="text-[15px] font-semibold mb-0.5">Code ya bidhaa</span>
                    <span className="text-[14px] text-gray-500 font-mono">{activeProduct.product_code}</span>
                  </div>
                  <span className={`text-[13px] font-bold ${copiedType === 'code' ? 'text-green-600' : 'text-blue-600'}`}>
                    {copiedType === 'code' ? 'Copied' : 'Copy'}
                  </span>
                </button>

                {/* ACTION 3: Futa */}
                <button 
                  onClick={() => deleteProduct(activeProduct.id)} 
                  className="w-full bg-red-50 text-red-500 py-4 px-5 rounded-[16px] text-[15px] font-semibold active:bg-red-100 transition-colors mt-2"
                >
                  Futa bidhaa
                </button>
              </div>

            </div>
          </div>
        </>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        .animate-slide-up { animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
        @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
      `}} />
    </div>
  );
}
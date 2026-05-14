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

  const copyData = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  };

  const deleteProduct = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this item?")) return;
    try {
      await supabase.from('products').delete().eq('id', id);
      setProducts(products.filter(p => p.id !== id));
      setActiveProduct(null);
    } catch (err) {
      alert("Failed to delete.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col relative pb-24 bg-background">
      
      {/* 1. TOP HEADER */}
      <div className="bg-background/90 backdrop-blur-md pt-12 pb-4 px-6 flex items-center justify-between sticky top-0 z-20 border-b border-surface-muted">
        <button 
          onClick={() => router.back()} 
          className="w-11 h-11 bg-surface rounded-full flex items-center justify-center border border-surface-muted shadow-sm active:scale-95 transition-transform"
        >
          <svg className="w-5 h-5 text-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
        </button>
        <h1 className="text-[18px] font-extrabold text-foreground tracking-tight">My Items</h1>
        <div className="w-11"></div> 
      </div>

      {/* 2. MAIN CONTENT */}
      <div className="flex-1 mt-4">
        {loading ? (
          <div className="flex justify-center py-20"><div className="w-6 h-6 border-2 border-surface-muted border-t-accent rounded-full animate-spin"></div></div>
        ) : products.length === 0 ? (
          
          <div className="flex flex-col items-center justify-center py-24 px-8 text-center animate-fade-in">
            <div className="w-24 h-24 bg-surface rounded-full flex items-center justify-center shadow-sm border border-surface-muted mb-6">
              <span className="text-4xl">👻</span>
            </div>
            <h2 className="text-[20px] font-extrabold text-foreground mb-2">It's quiet here...</h2>
            <p className="text-[14.5px] font-medium text-muted leading-relaxed">
              Your shop is looking a bit empty. Tap the <strong className="text-foreground">+</strong> button below to add your first item and make some moves! 💸
            </p>
          </div>

        ) : (
          
          <div className="flex flex-col gap-3 px-6 animate-fade-in">
            {/* LIST YA ITEMS */}
            {products.map((product) => (
              <div 
                key={product.id}
                onTouchStart={() => handleTouchStart(product)}
                onTouchEnd={handleTouchEnd}
                onMouseDown={() => handleTouchStart(product)}
                onMouseUp={handleTouchEnd}
                onClick={() => handleClick(product.id)}
                className="bg-surface p-3.5 rounded-[24px] border border-surface-muted shadow-[0_4px_20px_rgb(0,0,0,0.03)] flex items-center gap-4 active:scale-[0.98] transition-transform select-none cursor-pointer"
              >
                <div className="w-16 h-16 rounded-[16px] bg-background overflow-hidden flex-shrink-0 border border-surface-muted pointer-events-none">
                  {product.images && product.images[0] ? (
                    <img src={product.images[0]} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted text-xl">📦</div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0 pointer-events-none">
                  <h3 className="text-[16px] font-extrabold text-foreground tracking-tight truncate mb-1">
                    {product.title}
                  </h3>
                  <div className="flex justify-between items-center">
                    <p className="text-[15px] font-bold text-foreground">
                      TZS {product.price?.toLocaleString()}
                    </p>
                    {/* Hapa nimebadilisha Active na kuweka Product Code */}
                    <span className="text-[12px] font-mono font-bold text-muted bg-background px-2.5 py-1 rounded-[8px] border border-surface-muted">
                      {product.product_code}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

        )}
      </div>

      {/* 3. FAB (Floating Action Button) */}
      <div className="fixed bottom-8 right-6 z-30">
        <button 
          onClick={() => router.push('/products/new')}
          className="w-[60px] h-[60px] bg-accent text-white rounded-[20px] flex items-center justify-center shadow-lg shadow-accent/30 active:scale-90 transition-transform"
        >
          <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
        </button>
      </div>

      {/* 4. CENTERED MODAL (Badala ya Bottom Sheet) */}
      {activeProduct && (
        <div 
          className="fixed inset-0 bg-foreground/20 z-40 backdrop-blur-sm transition-opacity animate-fade-in flex items-center justify-center p-6" 
          onClick={() => setActiveProduct(null)}
        >
          <div 
            className="w-full max-w-[320px] bg-background rounded-[32px] p-6 shadow-2xl border border-surface-muted flex flex-col gap-5 animate-scale-up"
            onClick={(e) => e.stopPropagation()} // Kuzuia modal isijifunge ukiclick ndani
          >
            {/* Header ya Modal */}
            <div className="flex items-center gap-4">
               <div className="w-14 h-14 rounded-[14px] bg-surface overflow-hidden border border-surface-muted flex-shrink-0">
                  {activeProduct.images && activeProduct.images[0] ? (
                    <img src={activeProduct.images[0]} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted">📦</div>
                  )}
               </div>
               <div className="flex-1 min-w-0">
                  <h3 className="text-[16px] font-extrabold text-foreground truncate">{activeProduct.title}</h3>
                  <p className="text-[13px] font-mono font-bold text-muted mt-0.5">{activeProduct.product_code}</p>
               </div>
            </div>
            
            {/* Mstari wa kutenganisha */}
            <div className="h-px w-full bg-surface-muted"></div>
            
            {/* Vitufe (Actions) vilivyoshonwa kisasa */}
            <div className="flex flex-col gap-2.5">
              <button 
                onClick={() => copyData(`${window.location.origin}/deal/${activeProduct.product_code}`, 'link')} 
                className="w-full bg-surface border border-surface-muted text-foreground py-3.5 px-4 rounded-[16px] active:scale-[0.97] transition-transform flex justify-between items-center shadow-sm"
              >
                <span className="text-[14px] font-extrabold">Copy Client Link</span>
                <span className={`text-[12px] font-extrabold px-2.5 py-1 rounded-full ${copiedType === 'link' ? 'bg-[#dcfce7] text-[#16a34a]' : 'bg-background text-accent'}`}>
                  {copiedType === 'link' ? 'Copied!' : 'Copy'}
                </span>
              </button>
              
              <button 
                onClick={() => copyData(activeProduct.product_code, 'code')} 
                className="w-full bg-surface border border-surface-muted text-foreground py-3.5 px-4 rounded-[16px] active:scale-[0.97] transition-transform flex justify-between items-center shadow-sm"
              >
                <span className="text-[14px] font-extrabold">Copy Item Code</span>
                <span className={`text-[12px] font-extrabold px-2.5 py-1 rounded-full ${copiedType === 'code' ? 'bg-[#dcfce7] text-[#16a34a]' : 'bg-background text-accent'}`}>
                  {copiedType === 'code' ? 'Copied!' : 'Copy'}
                </span>
              </button>

              <button 
                onClick={() => deleteProduct(activeProduct.id)} 
                className="w-full bg-danger-light text-danger py-3.5 px-4 rounded-[16px] text-[14px] font-extrabold active:scale-[0.97] transition-transform border border-red-100 mt-1"
              >
                Delete Item
              </button>
            </div>

          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        .animate-fade-in { animation: fadeIn 0.2s ease-out forwards; }
        .animate-scale-up { animation: scaleUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scaleUp { from { opacity: 0; transform: scale(0.95) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
      `}} />
    </div>
  );
}
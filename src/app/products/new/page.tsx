'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function CreateDealPage() {
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [deliveryDays, setDeliveryDays] = useState(1);
  const [feePayer, setFeePayer] = useState<'buyer' | 'seller'>('buyer'); // State mpya ya Ada
  const [images, setImages] = useState<File[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/auth/login?next=/create-deal');
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
        alert('Unaweza kuweka picha zisizozidi 5 tu.');
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
    if (images.length === 0) return alert('Tafadhali weka angalau picha moja.');
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

      // Tunasukuma taarifa ikiwemo 'fee_payer'
      const { error: dbError } = await supabase.from('products').insert({
        seller_id: user.id,
        title,
        price: parseFloat(price),
        description,
        delivery_days_limit: deliveryDays,
        fee_payer: feePayer, 
        images: uploadedImageUrls,
        product_code: productCode
      });

      if (dbError) throw dbError;

      alert(`Dili limetengenezwa kikamilifu! Code yako ni: ${productCode}`);
      // router.push('/dashboard'); 

    } catch (error: any) {
      console.error(error);
      alert('Kuna tatizo limetokea: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-gray-500 text-[15px]">
        Inahakiki akaunti...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      <div className="pt-12 pb-6 px-6 max-w-lg mx-auto">
        <h1 className="text-2xl font-bold">Tengeneza Dili</h1>
        <p className="text-[15px] text-gray-500 mt-1">
          Weka taarifa za bidhaa upate link ya malipo.
        </p>
      </div>

      <div className="max-w-lg mx-auto px-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-[13px] font-medium text-gray-700 mb-1.5 ml-1">Jina la Bidhaa</label>
            <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-4 py-3.5 bg-surface border-none rounded-xl text-[15px] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-foreground/20 transition-all" placeholder="Mfano: iPhone 15 Pro Max" />
          </div>

          <div>
            <label className="block text-[13px] font-medium text-gray-700 mb-1.5 ml-1">Maelezo / Hali ya Bidhaa (Makubaliano)</label>
            <textarea required value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="w-full px-4 py-3.5 bg-surface border-none rounded-xl text-[15px] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-foreground/20 transition-all resize-none" placeholder="Mfano: Simu haina tatizo lolote..." />
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-[13px] font-medium text-gray-700 mb-1.5 ml-1">Bei (TZS)</label>
              <input type="number" required min="1000" value={price} onChange={(e) => setPrice(e.target.value)} className="w-full px-4 py-3.5 bg-surface border-none rounded-xl text-[15px] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-foreground/20 transition-all" placeholder="2500000" />
            </div>
            
            <div className="w-[120px]">
              <label className="block text-[13px] font-medium text-gray-700 mb-1.5 ml-1 text-center">Siku (Max 3)</label>
              <div className="flex items-center justify-between px-2 py-2.5 bg-surface rounded-xl">
                <button type="button" onClick={decrementDays} className="w-8 h-8 flex items-center justify-center rounded-lg bg-white text-black shadow-sm text-lg font-medium hover:bg-gray-50 disabled:opacity-50 transition-all" disabled={deliveryDays <= 1}>-</button>
                <span className="text-[15px] font-semibold">{deliveryDays}</span>
                <button type="button" onClick={incrementDays} className="w-8 h-8 flex items-center justify-center rounded-lg bg-white text-black shadow-sm text-lg font-medium hover:bg-gray-50 disabled:opacity-50 transition-all" disabled={deliveryDays >= 3}>+</button>
              </div>
            </div>
          </div>

          {/* ============================================== */}
          {/* SEHEMU MPYA: NANI ANALIPA ADA YA SALAMADEAL? */}
          {/* ============================================== */}
          <div>
            <div className="flex justify-between items-end mb-1.5 ml-1">
              <label className="block text-[13px] font-medium text-gray-700">Nani analipa ada ya ulinzi? (3%)</label>
            </div>
            <div className="flex bg-surface p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setFeePayer('buyer')}
                className={`flex-1 py-2.5 text-[14px] font-semibold rounded-lg transition-all duration-200 ${feePayer === 'buyer' ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Mteja
              </button>
              <button
                type="button"
                onClick={() => setFeePayer('seller')}
                className={`flex-1 py-2.5 text-[14px] font-semibold rounded-lg transition-all duration-200 ${feePayer === 'seller' ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Mimi (Muuzaji)
              </button>
            </div>
            <p className="text-[12px] text-gray-400 ml-1 mt-2">
              {feePayer === 'buyer' 
                ? 'Mteja ataongezewa 3% juu ya bei uliyoweka wakati wa kulipia.' 
                : '3% itakatwa kwenye bei yako baada ya mauzo kukamilika.'}
            </p>
          </div>
          {/* ============================================== */}

          <div>
            <label className="block text-[13px] font-medium text-gray-700 mb-1.5 ml-1">Picha za Bidhaa (Mwisho 5)</label>
            <div className="flex flex-wrap gap-3 mt-2">
              {images.map((img, index) => (
                <div key={index} className="relative h-20 w-20 rounded-xl overflow-hidden border border-gray-200 bg-surface">
                  <img src={URL.createObjectURL(img)} alt="Preview" className="h-full w-full object-cover" />
                  <button type="button" onClick={() => removeImage(index)} className="absolute top-1 right-1 bg-black/60 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs pb-0.5">x</button>
                </div>
              ))}
              {images.length < 5 && (
                <label className="h-20 w-20 flex flex-col items-center justify-center rounded-xl bg-surface border border-dashed border-gray-300 cursor-pointer hover:bg-gray-50 transition-colors">
                  <span className="text-2xl text-gray-400 font-light">+</span>
                  <input type="file" accept="image/*" multiple onChange={handleImageChange} className="hidden" />
                </label>
              )}
            </div>
          </div>

          <div className="pt-4">
            <button type="submit" disabled={loading} className="w-full py-4 px-4 rounded-xl text-[15px] font-semibold text-white bg-foreground hover:bg-gray-800 focus:outline-none focus:ring-4 focus:ring-gray-200 transition-all disabled:opacity-50 flex justify-center items-center gap-2">
              {loading ? 'Inatengeneza...' : 'Tengeneza Link'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
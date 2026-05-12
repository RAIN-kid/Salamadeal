'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function DashboardPage() {
  const [deals, setDeals] = useState<any[]>([]);
  const [activeFilter, setActiveFilter] = useState<'all' | 'pending' | 'paid' | 'shipped' | 'confirmed' | 'dispute'>('all');
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchUnifiedDeals();
  }, []);

  const fetchUnifiedDeals = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth/login');
        return;
      }

      // 1. VUTA MAUZO (Wewe ni Seller -> Profile inatoka kwa buyer_id)
      const { data: salesData } = await supabase
        .from('deals')
        .select(`*, products ( title, images ), profiles!buyer_id ( full_name )`)
        .eq('seller_id', user.id);
        
      const salesWithNames = (salesData || []).map(sale => ({
        ...sale,
        role: 'seller',
        display_name: sale.profiles?.full_name || 'Mteja'
      }));

      // 2. VUTA MANUNUZI (Wewe ni Buyer -> Profile inatoka kwa seller_id)
      const { data: purchasesData } = await supabase
        .from('deals')
        .select(`*, products ( title, images ), profiles!seller_id ( full_name )`)
        .eq('buyer_id', user.id);

      const purchasesWithNames = (purchasesData || []).map(purchase => ({
        ...purchase,
        role: 'buyer',
        display_name: purchase.profiles?.full_name || 'Muuzaji'
      }));

      // 3. UNGANISHA YOTE
      const combinedDeals = [...salesWithNames, ...purchasesWithNames]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setDeals(combinedDeals);
    } catch (err) {
      console.error('Error fetching deals:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredDeals = deals.filter(deal => {
    const status = deal.status; 
    if (activeFilter === 'all') return true;
    if (activeFilter === 'pending') return status === 'pending_payment';
    if (activeFilter === 'paid') return status === 'paid';
    if (activeFilter === 'shipped') return status === 'shipped';
    if (activeFilter === 'confirmed') return status === 'completed';
    if (activeFilter === 'dispute') return status === 'disputed'; 
    return true;
  });

  const groupDealsByDate = (dealsList: any[]) => {
    const groups: { [key: string]: any[] } = {};
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    dealsList.forEach(deal => {
      const dealDate = new Date(deal.created_at);
      let dateKey = '';
      if (dealDate.toDateString() === today.toDateString()) {
        dateKey = 'Leo';
      } else if (dealDate.toDateString() === yesterday.toDateString()) {
        dateKey = 'Jana';
      } else {
        dateKey = dealDate.toLocaleDateString('sw-TZ', { day: 'numeric', month: 'short' });
      }
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(deal);
    });
    return groups;
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending_payment': return <span className="text-orange-500">Pending</span>;
      case 'paid': return <span className="text-blue-500">Paid</span>;
      case 'shipped': return <span className="text-purple-600">Shipped</span>;
      case 'completed': return <span className="text-green-600">Confirmed</span>;
      case 'disputed': return <span className="text-red-500">Dispute</span>;
      default: return <span className="text-gray-500 capitalize">{status.replace('_', ' ')}</span>;
    }
  };

  const groupedDeals = groupDealsByDate(filteredDeals);

  return (
    <div className="min-h-screen bg-white pb-24">
      <div className="max-w-3xl mx-auto w-full">
        
        <div className="pt-12 pb-2 sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-gray-100">
          <h1 className="text-[26px] font-extrabold text-black px-5 mb-4 tracking-tight">Dili Zangu</h1>
          
          <div className="flex overflow-x-auto hide-scrollbar px-5 gap-2 pb-3">
            {[
              { id: 'all', label: 'All' },
              { id: 'pending', label: 'Pending' },
              { id: 'paid', label: 'Paid' },
              { id: 'shipped', label: 'Shipped' },
              { id: 'confirmed', label: 'Confirmed' },
              { id: 'dispute', label: 'Dispute' }
            ].map((filter) => (
              <button
                key={filter.id}
                onClick={() => setActiveFilter(filter.id as any)}
                className={`whitespace-nowrap px-4 py-2 rounded-full text-[14px] font-semibold transition-all duration-200 border ${
                  activeFilter === filter.id 
                  ? 'bg-black text-white border-black' 
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50' 
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-1">
          {loading ? (
            <div className="flex justify-center py-10"><div className="w-6 h-6 border-2 border-gray-200 border-t-black rounded-full animate-spin"></div></div>
          ) : Object.keys(groupedDeals).length === 0 ? (
            <div className="text-center py-20">
              <p className="text-gray-400 text-[15px] font-medium">Hakuna rekodi hapa.</p>
            </div>
          ) : (
            Object.keys(groupedDeals).map((dateKey) => (
              <div key={dateKey} className="mb-1">
                
                <h2 className="text-[13.5px] font-bold text-gray-500 mb-1 mt-4 px-5">
                  {dateKey}
                </h2>
                
                <div className="flex flex-col">
                  {/* HAPA TUMEONGEZA 'index' ILI KUPATA NAMBA YA MFUATANO */}
                  {groupedDeals[dateKey].map((deal, index) => {
                    
                    const isSelfDeal = deal.seller_id === deal.buyer_id;
                    let displayName = deal.display_name;
                    
                    if (isSelfDeal) {
                      displayName = deal.role === 'seller' ? 'Wewe (Kama Mteja)' : 'Wewe (Kama Muuzaji)';
                    }

                    return (
                      // TUMEWEKA 'index' HAPA ILI IWE 1000% UNIQUE
                      <Link 
                        key={`${deal.id}-${deal.role}-${index}`} 
                        href={`/dashboard/${deal.id}`}
                        className="block py-3.5 px-5 border-b border-gray-100 last:border-0 active:bg-gray-50 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center gap-3.5">
                          <div className="w-14 h-14 rounded-xl bg-gray-50 overflow-hidden flex-shrink-0 border border-gray-100">
                            {deal.products?.images && deal.products.images[0] && (
                               <img src={deal.products.images[0]} alt="" className="w-full h-full object-cover" />
                            )}
                          </div>
                          
                          <div className="flex flex-col flex-1 min-w-0">
                            <h3 className="text-[16px] font-bold text-black tracking-tight truncate mb-1">
                              {deal.products?.title || 'Bidhaa'}
                            </h3>
                            <div className="flex justify-between items-center mb-0.5">
                              <p className="text-[14.5px] font-bold text-black">
                                TZS {deal.total_amount.toLocaleString()}
                              </p>
                              <div className="text-[12.5px] font-bold">
                                {getStatusText(deal.status)}
                              </div>
                            </div>
                            <div className="flex justify-between items-center text-[13px] font-medium text-gray-400">
                              <span className="truncate pr-2">{displayName}</span>
                              <span className="whitespace-nowrap">{formatTime(deal.created_at)}</span>
                            </div>
                          </div>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </div>
            ))
          )}
        </div>

      </div>
      <style dangerouslySetInnerHTML={{__html: `.hide-scrollbar::-webkit-scrollbar { display: none; } .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }`}} />
    </div>
  );
}
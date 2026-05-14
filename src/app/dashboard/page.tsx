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

      // VUTA MAUZO (Wewe ni Vendor)
      const { data: salesData } = await supabase
        .from('deals')
        .select(`*, products ( title, product_code ), profiles!buyer_id ( full_name )`)
        .eq('seller_id', user.id);
        
      const salesWithNames = (salesData || []).map(sale => ({
        ...sale,
        role: 'vendor',
        display_name: sale.profiles?.full_name || 'Customer',
        is_self_buy: sale.seller_id === sale.buyer_id
      }));

      // VUTA MANUNUZI (Wewe ni Customer)
      const { data: purchasesData } = await supabase
        .from('deals')
        .select(`*, products ( title, product_code ), profiles!seller_id ( full_name )`)
        .eq('buyer_id', user.id);

      const purchasesWithNames = (purchasesData || []).map(purchase => ({
        ...purchase,
        role: 'customer',
        display_name: purchase.profiles?.full_name || 'Vendor',
        is_self_buy: purchase.seller_id === purchase.buyer_id
      }));

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
        dateKey = 'Today';
      } else if (dealDate.toDateString() === yesterday.toDateString()) {
        dateKey = 'Yesterday';
      } else {
        dateKey = dealDate.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
      }
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(deal);
    });
    return groups;
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const getNextStep = (status: string, role: string) => {
    if (status === 'pending_payment') return role === 'customer' ? 'Make payment' : 'Await payment';
    if (status === 'paid') return role === 'vendor' ? 'Ship item' : 'Await delivery';
    if (status === 'shipped') return role === 'customer' ? 'Confirm receipt' : 'Await confirmation';
    if (status === 'completed') return 'Deal closed';
    if (status === 'disputed') return 'Resolve dispute';
    return 'Processing';
  };

  const getStatusPill = (status: string) => {
    switch (status) {
      case 'pending_payment': return <span className="text-[12px] font-bold text-amber-700 bg-amber-100 px-3 py-1.5 rounded-[8px]">Pending</span>;
      case 'paid': return <span className="text-[12px] font-bold text-blue-700 bg-blue-100 px-3 py-1.5 rounded-[8px]">Paid</span>;
      case 'shipped': return <span className="text-[12px] font-bold text-purple-700 bg-purple-100 px-3 py-1.5 rounded-[8px]">Shipped</span>;
      case 'completed': return <span className="text-[12px] font-bold text-green-700 bg-green-100 px-3 py-1.5 rounded-[8px]">Confirmed</span>;
      case 'disputed': return <span className="text-[12px] font-bold text-red-700 bg-danger-light px-3 py-1.5 rounded-[8px]">Dispute</span>;
      default: return <span className="text-[12px] font-bold text-muted bg-surface-muted px-3 py-1.5 rounded-[8px] capitalize">{status.replace('_', ' ')}</span>;
    }
  };

  const groupedDeals = groupDealsByDate(filteredDeals);

  return (
    <div className="min-h-screen bg-background flex flex-col relative pb-24 animate-fade-in">
      
      <div className="bg-background/90 backdrop-blur-md pt-12 pb-4 px-6 sticky top-0 z-20 border-b border-surface-muted">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => router.push('/')} className="w-11 h-11 bg-surface rounded-full flex items-center justify-center border border-surface-muted shadow-sm active:scale-95 transition-transform">
            <svg className="w-5 h-5 text-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
          </button>
          <h1 className="text-[18px] font-extrabold text-foreground tracking-tight">Activity</h1>
          <div className="w-11"></div> 
        </div>

        <div className="flex overflow-x-auto hide-scrollbar gap-2 pb-2 -mx-2 px-2">
          {[
            { id: 'all', label: 'All' },
            { id: 'pending', label: 'Pending' },
            { id: 'paid', label: 'Paid' },
            { id: 'shipped', label: 'Shipped' },
            { id: 'confirmed', label: 'Confirmed' }
          ].map((filter) => (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id as any)}
              className={`whitespace-nowrap px-5 py-2.5 rounded-full text-[14px] font-bold transition-all duration-200 border ${activeFilter === filter.id ? 'bg-foreground text-background border-foreground shadow-md' : 'bg-surface text-muted border-surface-muted active:scale-95'}`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 mt-2">
        {loading ? (
          <div className="flex justify-center py-20"><div className="w-6 h-6 border-2 border-surface-muted border-t-accent rounded-full animate-spin"></div></div>
        ) : Object.keys(groupedDeals).length === 0 ? (
          
          <div className="flex flex-col items-center justify-center py-20 px-6 text-center animate-fade-in">
            <div className="w-24 h-24 bg-surface rounded-full flex items-center justify-center shadow-sm border border-surface-muted mb-6">
              <span className="text-4xl">🧾</span>
            </div>
            <h2 className="text-[20px] font-extrabold text-foreground mb-2">No deals yet</h2>
            <p className="text-[14.5px] font-medium text-muted leading-relaxed mb-8 px-2">
              To start a deal, paste an item code on the home page to pay, or create a new item and share the link with your buyer.
            </p>
            <div className="flex w-full gap-3">
              <button onClick={() => router.push('/')} className="flex-1 py-3.5 bg-surface border border-surface-muted rounded-[16px] font-bold text-[14px] text-foreground active:scale-95 transition-transform">
                Enter code
              </button>
              <button onClick={() => router.push('/products/new')} className="flex-1 py-3.5 bg-accent text-white rounded-[16px] font-bold text-[14px] shadow-sm shadow-accent/20 active:scale-95 transition-transform">
                Create item
              </button>
            </div>
          </div>

        ) : (
          
          <div className="px-6 flex flex-col gap-6 animate-fade-in pt-4">
            {Object.keys(groupedDeals).map((dateKey) => (
              <div key={dateKey}>
                <h2 className="text-[14px] font-extrabold text-muted mb-3 ml-1">{dateKey}</h2>
                <div className="flex flex-col gap-4">
                  {groupedDeals[dateKey].map((deal) => {
                    return (
                      <Link key={deal.id} href={`/dashboard/${deal.id}`} className="bg-surface rounded-[24px] p-5 border border-surface-muted flex flex-col gap-5 shadow-sm hover:shadow-md transition-all active:scale-[0.98] block">
                        
                        <div className="flex justify-between items-center">
                          <div className="text-[13.5px] font-medium text-muted flex items-center gap-1.5">
                            <span>Next step</span>
                            <svg className="w-3.5 h-3.5 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                            <span className="text-foreground font-bold">{getNextStep(deal.status, deal.role)}</span>
                          </div>
                          {getStatusPill(deal.status)}
                        </div>

                        <div>
                          <h3 className="text-[18px] font-extrabold text-foreground mb-1.5 truncate">
                            {deal.products?.title || 'Unknown Item'}
                          </h3>
                          <div className="flex justify-between items-center">
                            <span className="text-[20px] font-black text-foreground">
                              TZS {deal.total_amount.toLocaleString()}
                            </span>
                            <div className="flex items-center gap-1.5 text-muted text-[13.5px] font-medium">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                              <span>{formatTime(deal.created_at)}</span>
                            </div>
                          </div>
                        </div>

                        {/* User Details Box (Vendor/Customer Logic) */}
                        <div className="bg-background rounded-[16px] p-3.5 flex items-center justify-between border border-surface-muted">
                          <div className="flex items-center gap-2.5">
                            <div className="text-muted">
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                            </div>
                            <div className="flex items-center gap-1.5 text-[14px]">
                              {/* Kama role ni 'customer', basi profile unayoiona ni ya 'Vendor' */}
                              <span className="text-muted font-medium">{deal.role === 'customer' ? 'Vendor' : 'Customer'}</span>
                              <span className="text-foreground font-bold truncate max-w-[100px]">
                                {deal.is_self_buy ? 'You (Self)' : deal.display_name}
                              </span>
                            </div>
                          </div>
                          <span className="text-[13px] font-mono font-bold text-muted bg-surface px-2 py-1 rounded-md border border-surface-muted">
                            {deal.products?.product_code || 'SD-XX'}
                          </span>
                        </div>
                        
                      </Link>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
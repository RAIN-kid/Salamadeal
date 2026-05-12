'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [userEmail, setUserEmail] = useState('');
  const [profileData, setProfileData] = useState({ full_name: '', phone_number: '' });
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth/login');
        return;
      }
      setUserEmail(user.email || '');

      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, phone_number')
        .eq('id', user.id)
        .single();
        
      if (error && error.code !== 'PGRST116') throw error; 
      
      if (data) {
        setProfileData({ 
          full_name: data.full_name || '', 
          phone_number: data.phone_number || '' 
        });
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if(!profileData.full_name || !profileData.phone_number) {
      return alert("Tafadhali jaza jina lako na namba ya simu.");
    }
    
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('profiles')
        .upsert({ 
          id: user.id, 
          full_name: profileData.full_name, 
          phone_number: profileData.phone_number 
        });
        
      if (error) throw error;
      setIsEditing(false);
    } catch (err) {
      alert("Kuna tatizo, imeshindwa kuhifadhi taarifa.");
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    if (!window.confirm("Una uhakika unataka kutoka?")) return;
    await supabase.auth.signOut();
    router.push('/');
  };

  if (loading) return <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center"><div className="w-8 h-8 border-4 border-gray-200 border-t-black rounded-full animate-spin"></div></div>;

  return (
    <div className="min-h-screen bg-[#F9FAFB] pb-32">
      <div className="max-w-xl mx-auto w-full">
        
        {/* 1. HEADER */}
        <div className="bg-[#F9FAFB]/90 backdrop-blur-md pt-12 pb-4 px-5 sticky top-0 z-10 flex justify-between items-center border-b border-transparent transition-all">
          <h1 className="text-[26px] font-extrabold text-black tracking-tight leading-none">Akaunti</h1>
          
          {!isEditing ? (
            <button 
              onClick={() => setIsEditing(true)} 
              className="text-[15px] font-bold text-blue-600 bg-blue-50 px-4 py-2 rounded-full active:bg-blue-100 transition-colors"
            >
              Hariri
            </button>
          ) : (
            <button 
              onClick={handleSave} 
              disabled={saving} 
              className="text-[15px] font-bold text-white bg-blue-600 px-5 py-2 rounded-full active:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {saving ? 'Inahifadhi...' : 'Hifadhi'}
            </button>
          )}
        </div>

        <div className="px-5 mt-6">
          
          {/* 2. PROFILE PICTURE */}
          <div className="flex justify-center mb-8">
             <div className="w-24 h-24 bg-white rounded-[24px] flex items-center justify-center text-black text-3xl font-extrabold border border-gray-100 select-none">
               {profileData.full_name ? profileData.full_name.charAt(0).toUpperCase() : '👤'}
             </div>
          </div>

          {/* 3. TAARIFA BINAFSI */}
          <h3 className="text-[14px] font-bold text-gray-800 ml-1 mb-2">Taarifa binafsi</h3>
          <div className="bg-white rounded-[20px] border border-gray-100 overflow-hidden mb-8 transition-all">
            
            <div className="flex justify-between items-center px-5 py-4 border-b border-gray-50">
              <span className="text-[15px] font-medium text-gray-500">Barua pepe</span>
              <span className="text-[15px] font-bold text-black truncate max-w-[60%]">{userEmail}</span>
            </div>

            <div className="flex justify-between items-center px-5 py-4 border-b border-gray-50">
              <span className="text-[15px] font-medium text-gray-500 w-1/3">Jina kamili</span>
              {isEditing ? (
                <input 
                  type="text" 
                  value={profileData.full_name} 
                  onChange={(e) => setProfileData({...profileData, full_name: e.target.value})}
                  placeholder="Andika jina lako..."
                  className="w-2/3 text-right text-[15px] text-black font-bold bg-transparent focus:outline-none placeholder-gray-300"
                  autoFocus
                />
              ) : (
                <span className="text-[15px] font-bold text-black truncate max-w-[60%]">
                  {profileData.full_name || 'Hujaweka jina'}
                </span>
              )}
            </div>

            <div className="flex justify-between items-center px-5 py-4">
              <span className="text-[15px] font-medium text-gray-500 w-1/3">Namba ya simu</span>
              {isEditing ? (
                <input 
                  type="tel" 
                  value={profileData.phone_number} 
                  onChange={(e) => setProfileData({...profileData, phone_number: e.target.value})}
                  placeholder="Mfano: 0712..."
                  className="w-2/3 text-right text-[15px] text-black font-bold bg-transparent focus:outline-none placeholder-gray-300"
                />
              ) : (
                <span className="text-[15px] font-bold text-black truncate max-w-[60%]">
                  {profileData.phone_number || 'Hujaweka namba'}
                </span>
              )}
            </div>

          </div>

          {/* 4. MIPANGILIO */}
          <h3 className="text-[14px] font-bold text-gray-800 ml-1 mb-2">Mipangilio</h3>
          <div className="bg-white rounded-[20px] border border-gray-100 overflow-hidden mb-8">
            <button className="w-full flex items-center justify-between px-5 py-4 border-b border-gray-50 active:bg-gray-50 transition-colors">
              <span className="text-[15px] font-medium text-black">Msaada na maswali</span>
              <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
            </button>
            <button className="w-full flex items-center justify-between px-5 py-4 active:bg-gray-50 transition-colors">
              <span className="text-[15px] font-medium text-black">Sheria na vigezo</span>
              <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>

          {/* 5. TOKA NJE (Logout) */}
          <button 
            onClick={handleLogout}
            className="w-full bg-[#FFF0F0] text-red-500 py-4 rounded-[20px] text-[15px] font-bold active:bg-[#FFE5E5] transition-colors"
          >
            Toka Nje
          </button>

        </div>
      </div>
    </div>
  );
}
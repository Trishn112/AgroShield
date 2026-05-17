import * as React from 'react';
import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { User, Mail, Shield, Calendar, Save, LogOut, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { UserProfile, UserRole } from '@/types';
import { useLanguage } from '@/lib/languageStore';

export default function Profile() {
  const { t } = useLanguage();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('farmer');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      if (!auth.currentUser) {
        navigate('/auth');
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
        if (userDoc.exists()) {
          const data = userDoc.data() as UserProfile;
          setProfile(data);
          setName(data.displayName || '');
          setRole(data.role);
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
        toast.error("Failed to load profile.");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [navigate]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser || !profile) return;

    setSaving(true);
    try {
      // Update Firebase Auth
      await updateProfile(auth.currentUser, { displayName: name });

      // Update Firestore
      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        displayName: name,
        role: role,
      });

      setProfile({ ...profile, displayName: name, role: role });
      toast.success("Profile updated successfully!");
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast.error(error.message || "Update failed.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black pt-24 pb-20 px-4 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-1/4 -right-1/4 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none"></div>
      
      <div className="max-w-4xl mx-auto relative z-10">
        <Button 
          variant="ghost" 
          onClick={() => navigate(-1)} 
          className="mb-8 text-zinc-400 hover:text-white group"
        >
          <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
          {t('profile.back')}
        </Button>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Avatar and Info */}
          <div className="md:col-span-1 space-y-6">
            <Card className="bg-zinc-900/50 backdrop-blur-xl border-white/10 rounded-[32px] overflow-hidden p-8 text-center">
              <div className="w-24 h-24 bg-emerald-500 rounded-3xl flex items-center justify-center text-white text-4xl font-bold mx-auto mb-6 shadow-[0_0_30px_rgba(16,185,129,0.3)]">
                {name?.[0] || profile?.email?.[0].toUpperCase()}
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">{name || t('profile.unnamed')}</h2>
              <p className="text-zinc-500 text-sm mb-6 capitalize">{t(`common.${role}`)} {t('profile.account')}</p>
              
              <div className="flex flex-col gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => auth.signOut()}
                  className="w-full border-white/5 bg-white/5 hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/20 rounded-xl"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  {t('profile.signOut')}
                </Button>
              </div>
            </Card>

            <Card className="bg-zinc-900/50 border-white/10 rounded-[32px] p-6 space-y-4">
              <div className="flex items-center gap-3 text-zinc-400">
                <Mail className="w-4 h-4" />
                <div className="text-sm">
                  <div className="text-[10px] uppercase font-black tracking-widest text-zinc-600">{t('common.email')}</div>
                  <div className="text-white truncate">{profile?.email}</div>
                </div>
              </div>
              <div className="flex items-center gap-3 text-zinc-400">
                <Shield className="w-4 h-4" />
                <div className="text-sm">
                  <div className="text-[10px] uppercase font-black tracking-widest text-zinc-600">{t('profile.accountID')}</div>
                  <div className="text-white truncate font-mono text-xs">{profile?.uid}</div>
                </div>
              </div>
              <div className="flex items-center gap-3 text-zinc-400">
                <Calendar className="w-4 h-4" />
                <div className="text-sm">
                  <div className="text-[10px] uppercase font-black tracking-widest text-zinc-600">{t('profile.joined')} Kisan Sathi</div>
                  <div className="text-white">
                    {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : "N/A"}
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Edit Form */}
          <Card className="md:col-span-2 bg-zinc-900/50 backdrop-blur-xl border-white/10 rounded-[32px] overflow-hidden">
            <CardHeader className="p-8">
              <CardTitle className="text-2xl font-bold text-white">{t('profile.title')}</CardTitle>
              <CardDescription className="text-zinc-500">{t('profile.desc')}</CardDescription>
            </CardHeader>
            <CardContent className="p-8 pt-0">
              <form onSubmit={handleUpdate} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-zinc-500 ml-1">{t('profile.displayName')}</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <Input 
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={t('profile.yourName')}
                      className="bg-black/50 border-white/10 pl-12 h-14 rounded-2xl focus:border-emerald-500 transition-all text-white"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-zinc-500 ml-1">{t('profile.platformRole')}</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {(['farmer', 'consumer', 'analyst', 'admin'] as UserRole[]).map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setRole(r)}
                        className={`py-4 rounded-2xl border text-xs font-bold uppercase tracking-widest transition-all ${
                          role === r 
                          ? 'bg-emerald-500 border-emerald-400 text-white shadow-lg shadow-emerald-500/20' 
                          : 'bg-black/50 border-white/10 text-zinc-500 hover:border-white/20 hover:text-white'
                        }`}
                      >
                        {t(`common.${r}`)}
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-zinc-600 mt-2 italic px-1">
                    * {t('profile.roleHint')}
                  </p>
                </div>

                <div className="pt-6 border-t border-white/5">
                  <Button 
                    type="submit" 
                    disabled={saving}
                    className="w-full md:w-auto h-14 px-12 bg-emerald-600 hover:bg-emerald-500 rounded-2xl font-bold text-white text-lg transition-all active:scale-95 flex items-center gap-2"
                  >
                    {saving ? t('profile.saving') : (
                      <>
                        <Save className="w-5 h-5" />
                        {t('profile.saveProfile')}
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

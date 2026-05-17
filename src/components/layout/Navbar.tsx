import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Menu, X, LayoutDashboard, Cloud, Droplets, Map, ShoppingCart, User, Bell, Shield, Languages, Store } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { UserProfile } from '@/types';
import { useLanguage } from '@/lib/languageStore';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const { language, setLanguage, t } = useLanguage();
  const location = useLocation();

  const navItems = [
    { name: t('nav.dashboard'), path: '/dashboard', icon: LayoutDashboard },
    { name: t('nav.crop'), path: '/crop-analysis', icon: Cloud }, // Changed icon to Cloud or something else as Leaf is now the logo
    { name: t('nav.weather'), path: '/weather', icon: Cloud },
    { name: t('nav.irrigation'), path: '/irrigation', icon: Droplets },
    { name: t('nav.marketplace'), path: '/marketplace', icon: ShoppingCart },
    { name: t('nav.sell'), path: '/sell', icon: Store },
    { name: t('nav.admin'), path: '/admin', icon: Shield },
  ];

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        try {
          const userDoc = await getDoc(doc(db, 'users', u.uid));
          if (userDoc.exists()) {
            setProfile(userDoc.data() as UserProfile);
          }
        } catch (err) {
          console.error("Navbar profile fetch error:", err);
          // Don't toast here as it might be a race condition during registration
        }
      } else {
        setProfile(null);
      }
    });
    return () => unsubscribe();
  }, []);

  const filteredNavItems = profile?.role === 'admin' 
    ? navItems 
    : navItems.filter(item => item.path !== '/admin');

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/50 backdrop-blur-xl border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-12 h-12 rounded-xl overflow-hidden group-hover:scale-110 transition-transform shadow-[0_0_20px_rgba(16,185,129,0.3)]">
              <img src="/src/assets/images/kisansathi_logo_1779010672779.png" alt="Kisan Sathi Logo" className="w-full h-full object-cover" />
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
              {t('nav.appName')}
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6">
            {filteredNavItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-2 text-sm font-medium transition-colors ${
                  location.pathname === item.path ? 'text-emerald-400' : 'text-zinc-400 hover:text-white'
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.name}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLanguage(language === 'en' ? 'hi' : 'en')}
              className="text-zinc-400 hover:text-white flex items-center gap-2"
            >
              <Languages className="w-4 h-4" />
              {language === 'en' ? 'Hindi' : 'English'}
            </Button>
            {user ? (
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white relative">
                  <Bell className="w-5 h-5" />
                  <span className="absolute top-2 right-2 w-2 h-2 bg-emerald-500 rounded-full border-2 border-black"></span>
                </Button>
                <div className="h-8 w-[1px] bg-white/10"></div>
                <Button
                  variant="ghost"
                  onClick={() => signOut(auth)}
                  className="text-zinc-400 hover:text-white"
                >
                  {t('nav.signOut')}
                </Button>
                <Link to="/profile" className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white font-bold cursor-pointer hover:ring-2 hover:ring-emerald-400 transition-all">
                  {user.displayName?.[0] || user.email?.[0].toUpperCase()}
                </Link>
              </div>
            ) : (
              <Link to="/auth">
                <Button variant="default" className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-full px-6">
                  Get Started
                </Button>
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button variant="ghost" size="icon" onClick={() => setIsOpen(!isOpen)} className="text-white">
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Nav */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-zinc-900 border-b border-white/10 overflow-hidden"
          >
            <div className="px-4 pt-2 pb-6 space-y-1">
              {filteredNavItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 px-3 py-4 text-base font-medium text-zinc-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
                >
                  <item.icon className="w-5 h-5 text-emerald-400" />
                  {item.name}
                </Link>
              ))}
              {user && (
                <Link
                  to="/profile"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 px-3 py-4 text-base font-medium text-zinc-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
                >
                  <User className="w-5 h-5 text-emerald-400" />
                  {t('nav.profile')}
                </Link>
              )}
              {!user && (
                <Link to="/auth" onClick={() => setIsOpen(false)} className="block pt-4">
                  <Button className="w-full bg-emerald-600 hover:bg-emerald-500 rounded-xl py-6">
                    {t('nav.getStarted')}
                  </Button>
                </Link>
              )}
              <div className="pt-4 border-t border-white/5">
                <Button
                  variant="ghost"
                  className="w-full justify-start text-zinc-400"
                  onClick={() => {
                    setLanguage(language === 'en' ? 'hi' : 'en');
                    setIsOpen(false);
                  }}
                >
                  <Languages className="w-5 h-5 mr-3 text-emerald-400" />
                  {t('nav.switchLanguage')}
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

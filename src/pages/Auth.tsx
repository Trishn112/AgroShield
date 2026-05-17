import * as React from 'react';
import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { GoogleAuthProvider, signInWithPopup, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile, onAuthStateChanged } from 'firebase/auth';
import { auth, db, handleFirestoreError, OperationType } from '@/lib/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Mail, Lock, User, Chrome } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/lib/languageStore';

export default function Auth() {
  const { t } = useLanguage();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<string>('farmer');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        navigate('/dashboard');
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      const userRef = doc(db, 'users', result.user.uid);
      let userDoc;
        try {
          userDoc = await getDoc(userRef);
        } catch (err) {
          handleFirestoreError(err, OperationType.GET, `users/${result.user.uid}`);
          throw err;
        }

      if (!userDoc.exists()) {
        const userData = {
          uid: result.user.uid,
          email: result.user.email || '',
          displayName: result.user.displayName || result.user.email?.split('@')[0] || t('profile.unnamed'),
          role: 'farmer',
          createdAt: new Date().toISOString()
        };
        try {
          await setDoc(userRef, userData);
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, `users/${result.user.uid}`);
          throw err;
        }
      }
      toast.success(`Welcome back, ${result.user.displayName}!`);
      navigate('/dashboard');
    } catch (error: any) {
      console.error(error);
      if (error.code === 'auth/popup-closed-by-user') {
        return; // User closed the popup, no need to show error toast
      }
      const message = error.code === 'auth/popup-blocked' 
        ? "Popup was blocked by your browser. Please allow popups for this site."
        : error.message || "Authentication failed.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
        toast.success("Logged in successfully!");
      } else {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(result.user, { displayName: name });
        const userRef = doc(db, 'users', result.user.uid);
        const userData = {
          uid: result.user.uid,
          email,
          displayName: name,
          role,
          createdAt: new Date().toISOString()
        };
        try {
          await setDoc(userRef, userData);
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, `users/${result.user.uid}`);
          throw err;
        }
        toast.success("Account created!");
      }
      navigate('/dashboard');
    } catch (error: any) {
      console.error(error);
      let message = error.message;
      if (error.code === 'auth/operation-not-allowed') {
        message = "Email/Password sign-in is not enabled. Please use Google Login.";
      }
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 pt-24 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none"></div>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="flex flex-col items-center mb-10">
          <div className="w-20 h-20 rounded-2xl overflow-hidden mb-4 shadow-[0_0_30px_rgba(16,185,129,0.3)]">
            <img src="/logo.png" alt="Kisan Sathi Logo" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">{t('nav.appName')}</h1>
          <p className="text-zinc-500 text-sm">{t('auth.tag')}</p>
        </div>

        <Card className="bg-zinc-900/50 backdrop-blur-xl border-white/10 shadow-2xl rounded-[32px] overflow-hidden">
          <CardHeader className="p-8 pb-4">
             <div className="flex bg-black/40 p-1 rounded-2xl mb-8">
               <button 
                 onClick={() => setIsLogin(true)}
                 className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest rounded-xl transition-all ${isLogin ? 'bg-emerald-500 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
               >
                 {t('auth.login')}
               </button>
               <button 
                 onClick={() => setIsLogin(false)}
                 className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest rounded-xl transition-all ${!isLogin ? 'bg-emerald-500 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
               >
                 {t('auth.register')}
               </button>
             </div>
             <CardTitle className="text-2xl font-bold text-white">{isLogin ? t('auth.welcomeBack') : t('auth.join')}</CardTitle>
             <CardDescription className="text-zinc-500">
               {isLogin ? t('auth.loginDesc') : t('auth.registerDesc')}
             </CardDescription>
          </CardHeader>
          <CardContent className="p-8 pt-4 space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div className="space-y-4">
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <Input 
                      placeholder={t('auth.name')} 
                      className="bg-black/50 border-white/10 pl-12 h-14 rounded-2xl focus:border-emerald-500 transition-all text-white" 
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-zinc-500">
                     <select 
                        value={role} 
                        onChange={(e) => setRole(e.target.value)}
                        className="col-span-2 bg-black/50 border border-white/10 h-14 rounded-2xl px-4 text-sm focus:border-emerald-500 outline-none appearance-none cursor-pointer"
                     >
                       <option value="farmer">{t('auth.iamFarmer')}</option>
                       <option value="consumer">{t('auth.iamConsumer')}</option>
                       <option value="analyst">{t('auth.iamAnalyst')}</option>
                     </select>
                  </div>
                </div>
              )}
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <Input 
                  type="email"
                  placeholder={t('auth.email')} 
                  className="bg-black/50 border-white/10 pl-12 h-14 rounded-2xl focus:border-emerald-500 transition-all text-white" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <Input 
                  type="password"
                  placeholder={t('auth.password')} 
                  className="bg-black/50 border-white/10 pl-12 h-14 rounded-2xl focus:border-emerald-500 transition-all text-white" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" disabled={loading} className="w-full h-14 bg-emerald-600 hover:bg-emerald-500 rounded-2xl font-bold text-white text-lg transition-all active:scale-95">
                {loading ? t('common.loading') : isLogin ? t('auth.signIn') : t('auth.createAccount')}
              </Button>
            </form>

            <div className="relative py-4">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10"></div></div>
              <div className="relative flex justify-center text-xs uppercase"><span className="bg-zinc-900 px-4 text-zinc-500 font-bold tracking-widest">{t('auth.or')}</span></div>
            </div>

            <Button 
              onClick={handleGoogleLogin} 
              disabled={loading}
              variant="outline" 
              className="w-full h-14 bg-white/5 border-white/10 rounded-2xl text-zinc-300 hover:bg-white/10 hover:text-white flex items-center justify-center gap-3 transition-all active:scale-95"
            >
              <Chrome className="w-5 h-5" />
              {t('auth.googleAuth')}
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

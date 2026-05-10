import * as React from 'react';
import { useState } from 'react';
import { motion } from 'motion/react';
import { GoogleAuthProvider, signInWithPopup, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Leaf, Mail, Lock, User, Chrome } from 'lucide-react';
import { toast } from 'sonner';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  return new Error(JSON.stringify(errInfo));
}

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<string>('farmer');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

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
        throw handleFirestoreError(err, OperationType.GET, `users/${result.user.uid}`);
      }

      if (!userDoc.exists()) {
        const userData = {
          uid: result.user.uid,
          email: result.user.email,
          displayName: result.user.displayName,
          role: 'farmer',
          createdAt: new Date().toISOString()
        };
        try {
          await setDoc(userRef, userData);
        } catch (err) {
          throw handleFirestoreError(err, OperationType.WRITE, `users/${result.user.uid}`);
        }
      }
      toast.success(`Welcome back, ${result.user.displayName}!`);
      navigate('/dashboard');
    } catch (error: any) {
      console.error(error);
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
          throw handleFirestoreError(err, OperationType.WRITE, `users/${result.user.uid}`);
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
          <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(16,185,129,0.3)]">
            <Leaf className="text-white w-10 h-10" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">AgroShield AI</h1>
          <p className="text-zinc-500 text-sm">Secure the future of your environment.</p>
        </div>

        <Card className="bg-zinc-900/50 backdrop-blur-xl border-white/10 shadow-2xl rounded-[32px] overflow-hidden">
          <CardHeader className="p-8 pb-4">
             <div className="flex bg-black/40 p-1 rounded-2xl mb-8">
               <button 
                 onClick={() => setIsLogin(true)}
                 className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest rounded-xl transition-all ${isLogin ? 'bg-emerald-500 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
               >
                 Login
               </button>
               <button 
                 onClick={() => setIsLogin(false)}
                 className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest rounded-xl transition-all ${!isLogin ? 'bg-emerald-500 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
               >
                 Register
               </button>
             </div>
             <CardTitle className="text-2xl font-bold text-white">{isLogin ? 'Welcome Back' : 'Join AgroShield'}</CardTitle>
             <CardDescription className="text-zinc-500">
               {isLogin ? 'Access your dashboard and reports.' : 'Start your sustainability journey today.'}
             </CardDescription>
          </CardHeader>
          <CardContent className="p-8 pt-4 space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div className="space-y-4">
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <Input 
                      placeholder="Full Name" 
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
                       <option value="farmer">I am a Farmer</option>
                       <option value="consumer">I am a Consumer</option>
                       <option value="analyst">I am an Analyst</option>
                     </select>
                  </div>
                </div>
              )}
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <Input 
                  type="email"
                  placeholder="Email Address" 
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
                  placeholder="Password" 
                  className="bg-black/50 border-white/10 pl-12 h-14 rounded-2xl focus:border-emerald-500 transition-all text-white" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" disabled={loading} className="w-full h-14 bg-emerald-600 hover:bg-emerald-500 rounded-2xl font-bold text-white text-lg transition-all active:scale-95">
                {loading ? 'Processing...' : isLogin ? 'Sign In' : 'Create Account'}
              </Button>
            </form>

            <div className="relative py-4">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10"></div></div>
              <div className="relative flex justify-center text-xs uppercase"><span className="bg-zinc-900 px-4 text-zinc-500 font-bold tracking-widest">Or continue with</span></div>
            </div>

            <Button 
              onClick={handleGoogleLogin} 
              disabled={loading}
              variant="outline" 
              className="w-full h-14 bg-white/5 border-white/10 rounded-2xl text-zinc-300 hover:bg-white/10 hover:text-white flex items-center justify-center gap-3 transition-all active:scale-95"
            >
              <Chrome className="w-5 h-5" />
              Google Authentication
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

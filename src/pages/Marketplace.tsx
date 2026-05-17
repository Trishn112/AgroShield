import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShoppingBag, 
  Plus, 
  Search, 
  MapPin, 
  Tag, 
  User, 
  Phone,
  Trash2,
  X,
  PlusCircle,
  TrendingUp,
  Store,
  Layers,
  Wheat,
  Clock,
  Package,
  Box
} from 'lucide-react';
import { 
  collection, 
  query, 
  onSnapshot, 
  orderBy, 
  addDoc, 
  serverTimestamp, 
  deleteDoc, 
  doc, 
  where 
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { Link, useSearchParams } from 'react-router-dom';
import { useLanguage } from '@/lib/languageStore';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = (import.meta as any).env.VITE_STRIPE_PUBLISHABLE_KEY 
  ? loadStripe((import.meta as any).env.VITE_STRIPE_PUBLISHABLE_KEY)
  : null;
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ProductListing {
  id: string;
  farmerId: string;
  name: string;
  category: string;
  price: number;
  unit: string;
  description: string;
  imageUrl?: string;
  stock: number;
  location?: string;
  contact?: string;
  createdAt: any;
}

const Marketplace: React.FC = () => {
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState<ProductListing[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [user, setUser] = useState<any>(null);
  const [loadingPayment, setLoadingPayment] = useState<string | null>(null);

  useEffect(() => {
    if (searchParams.get('success')) {
      toast.success("Payment successful! The seller will contact you shortly.");
    }
    if (searchParams.get('canceled')) {
      toast.error("Payment canceled.");
    }

    const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ProductListing[];
      setProducts(items);
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, 'products');
    });

    const authUnsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });

    return () => {
      unsubscribe();
      authUnsubscribe();
    };
  }, []);

  const handleBuy = async (product: ProductListing) => {
    if (!user) {
      toast.error("Please sign in to buy products.");
      return;
    }

    if (!stripePromise) {
      toast.error("Payments are currently disabled. Please contact the administrator.");
      return;
    }

    setLoadingPayment(product.id);
    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId: product.id,
          name: product.name,
          price: product.price,
        }),
      });

      const session = await response.json();
      
      if (session.error) {
        throw new Error(session.error);
      }

      const stripe = await stripePromise;
      const { error } = await (stripe as any)!.redirectToCheckout({
        sessionId: session.id,
      });

      if (error) {
        throw error;
      }
    } catch (err: any) {
      console.error("Payment Error:", err);
      toast.error(err.message || "Failed to initiate payment.");
    } finally {
      setLoadingPayment(null);
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         p.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-black text-white p-6 md:p-10 lg:p-12">
      <div className="max-w-7xl mx-auto space-y-10 pt-16">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-emerald-500 font-black uppercase tracking-[0.3em] text-[10px]">
              <Store className="w-4 h-4" />
              <span>{t('market.tag')}</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-black tracking-tighter leading-none italic uppercase">
              {t('market.title').split(' ')[0]} <span className="text-emerald-500">{t('market.title').split(' ')[1] || ''}</span>
            </h1>
            <p className="text-zinc-500 max-w-md text-sm font-medium leading-relaxed italic">
              {t('market.desc')}
            </p>
          </div>

          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-hover:text-emerald-500 transition-colors" />
              <input 
                type="text" 
                placeholder={t('market.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-zinc-900 border border-white/5 rounded-2xl py-4 pl-12 pr-6 text-sm focus:outline-none focus:border-emerald-500/50 w-full md:w-64 transition-all font-bold"
              />
            </div>
            <Link to="/sell" className="flex-shrink-0">
              <Button className="w-full md:w-auto bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl px-8 font-black uppercase italic tracking-wider h-14">
                <Plus className="w-5 h-5 mr-3" /> {t('market.startListing')}
              </Button>
            </Link>
          </div>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2 pb-4">
           {['All', 'Crop', 'Seed', 'Fertilizer', 'Tool'].map(cat => (
             <button
               key={cat}
               onClick={() => setSelectedCategory(cat)}
               className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all border ${
                 selectedCategory === cat 
                  ? 'bg-white text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.1)]' 
                  : 'bg-zinc-900 border-white/5 text-zinc-500 hover:border-white/10 hover:text-zinc-300'
               }`}
             >
               {t(`market.cat.${cat}`)}
             </button>
           ))}
        </div>

        {/* Listings Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredProducts.map((p, idx) => (
            <motion.div
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.05 }}
              key={p.id}
              className="bg-zinc-900 border border-white/5 rounded-[3rem] p-8 hover:border-emerald-500/30 transition-all group flex flex-col h-full overflow-hidden relative"
            >
              <div className="absolute top-0 right-0 p-6 z-20">
                <Badge className="bg-white/5 text-zinc-500 border-white/5 py-1.5 px-4 text-[9px] uppercase tracking-[0.2em] font-black">
                  {p.category}
                </Badge>
              </div>

              <div className="flex justify-between items-start mb-8 z-10">
                <div className="p-5 bg-emerald-500/10 rounded-[2rem] border border-emerald-500/20">
                  {p.category === 'Crop' ? <Wheat className="w-10 h-10 text-emerald-500" /> :
                   p.category === 'Seed' ? <Package className="w-10 h-10 text-blue-400" /> :
                   p.category === 'Fertilizer' ? <TrendingUp className="w-10 h-10 text-indigo-400" /> :
                   <Box className="w-10 h-10 text-zinc-400" />}
                </div>
              </div>

              <div className="space-y-6 flex-grow z-10">
                <div className="flex justify-between items-end">
                   <div>
                     <h3 className="text-3xl font-black uppercase tracking-tight italic group-hover:text-emerald-500 transition-colors leading-[0.9]">{p.name}</h3>
                     <div className="flex items-center gap-1.5 text-zinc-600 text-[10px] font-black uppercase tracking-widest mt-3">
                       <MapPin className="w-3 h-3 text-emerald-500" />
                       {p.location || 'Distributed Node'}
                     </div>
                   </div>
                </div>

                <div className="p-6 bg-black/50 rounded-3xl space-y-4 border border-white/5">
                   <p className="text-zinc-500 text-sm italic leading-relaxed line-clamp-3">
                     "{p.description || 'Secure communication link established. No specific metadata found for this resource.'}"
                   </p>
                   
                   <div className="flex items-center justify-between pt-4 mt-4 border-t border-white/10">
                      <div>
                        <div className="text-[9px] text-zinc-600 font-black uppercase tracking-widest mb-1 leading-none">{t('common.valuation')}</div>
                        <div className="text-2xl font-black text-emerald-400">₹{p.price}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-[9px] text-zinc-600 font-black uppercase tracking-widest mb-1 leading-none">{t('common.inStock')}</div>
                        <div className="text-2xl font-black text-zinc-400">{p.stock} <span className="text-[10px] uppercase font-bold text-zinc-700">{p.unit}s</span></div>
                      </div>
                   </div>
                </div>
              </div>

              <div className="mt-8 pt-4 z-10 space-y-3">
                <Button 
                  onClick={() => handleBuy(p)}
                  disabled={loadingPayment === p.id}
                  className="w-full flex items-center justify-center gap-3 bg-emerald-600 text-white hover:bg-emerald-500 transition-all rounded-2xl h-14 font-black uppercase tracking-[0.1em] text-sm italic shadow-[0_0_20px_rgba(16,185,129,0.2)]"
                >
                  <ShoppingBag className="w-4 h-4" />
                  {loadingPayment === p.id ? t('market.processing') : t('market.buyNow')}
                </Button>
                <a 
                  href={`mailto:${p.contact}`}
                  className="w-full flex items-center justify-center gap-3 bg-white text-black hover:bg-zinc-200 transition-all rounded-2xl h-14 font-black uppercase tracking-[0.1em] text-sm italic"
                >
                  <Phone className="w-4 h-4" /> {t('market.initiateTrade')}
                </a>
              </div>
            </motion.div>
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="py-40 text-center space-y-4">
            <div className="bg-zinc-900 w-32 h-32 rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 opacity-50 border border-white/5">
              <Search className="w-10 h-10 text-zinc-700" />
            </div>
            <h3 className="text-3xl font-black uppercase text-zinc-800 italic tracking-tighter">{t('market.notFound')}</h3>
            <p className="text-zinc-700 text-sm font-black uppercase tracking-[0.3em]">{t('market.broadcasting')}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Marketplace;

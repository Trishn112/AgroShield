import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Store, 
  Plus, 
  Trash2, 
  X, 
  Wheat, 
  Package, 
  MapPin, 
  Clock, 
  Box,
  TrendingUp,
  AlertCircle
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
import { useLanguage } from '@/lib/languageStore';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface ProductListing {
  id: string;
  farmerId: string;
  name: string;
  category: 'Crop' | 'Seed' | 'Fertilizer' | 'Tool';
  price: number;
  unit: string;
  description: string;
  stock: number;
  location?: string;
  contact?: string;
  createdAt: any;
}

const Sell: React.FC = () => {
  const { t } = useLanguage();
  const [myProducts, setMyProducts] = useState<ProductListing[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [user, setUser] = useState<any>(null);

  // Form State
  const [name, setName] = useState('');
  const [category, setCategory] = useState<'Crop' | 'Seed' | 'Fertilizer' | 'Tool'>('Crop');
  const [price, setPrice] = useState('');
  const [unit, setUnit] = useState('kg');
  const [stock, setStock] = useState('');
  const [desc, setDesc] = useState('');
  const [location, setLocation] = useState('');
  const [contact, setContact] = useState('');

  useEffect(() => {
    let unsubscribe: () => void = () => {};

    const authUnsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u) {
        const q = query(
          collection(db, 'products'), 
          where('farmerId', '==', u.uid),
          orderBy('createdAt', 'desc')
        );
        
        unsubscribe = onSnapshot(q, (snapshot) => {
          const items = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as ProductListing[];
          setMyProducts(items);
        }, (err) => {
          handleFirestoreError(err, OperationType.GET, 'products');
        });
      } else {
        setMyProducts([]);
      }
    });

    return () => {
      authUnsubscribe();
      unsubscribe();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      await addDoc(collection(db, 'products'), {
        farmerId: user.uid,
        name,
        category,
        price: parseFloat(price),
        unit,
        stock: parseFloat(stock),
        description: desc,
        location,
        contact: contact || user.email,
        createdAt: serverTimestamp()
      });

      toast.success("Inventory updated successfully");
      setIsAdding(false);
      setName('');
      setPrice('');
      setDesc('');
      setStock('');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'products');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'products', id));
      toast.success("Listing removed from database");
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, 'products');
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6">
        <div className="text-center space-y-6">
          <div className="w-20 h-20 bg-zinc-900 rounded-3xl flex items-center justify-center mx-auto border border-white/5">
            <AlertCircle className="w-10 h-10 text-zinc-500" />
          </div>
          <h2 className="text-2xl font-black uppercase italic tracking-tight text-white">{t('sell.accessRestricted')}</h2>
          <p className="text-zinc-500 max-w-sm mx-auto">{t('sell.identify')}</p>
          <Button className="bg-emerald-600 hover:bg-emerald-500 rounded-xl px-10 h-12 font-black uppercase" onClick={() => window.location.href = '/auth'}>
            {t('auth.signIn')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-6 md:p-10 lg:p-12">
      <div className="max-w-7xl mx-auto space-y-12 pt-16">
        
        {/* Management Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-white/10 pb-12">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-emerald-500 font-black uppercase tracking-[0.3em] text-[10px]">
              <TrendingUp className="w-4 h-4" />
              <span>{t('sell.tag')}</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-black tracking-tighter leading-none uppercase italic">
              {t('sell.title').split(' ')[0]} <span className="text-emerald-500">{t('sell.title').split(' ')[1] || ''}</span>
            </h1>
            <p className="text-zinc-500 max-lg text-sm font-medium leading-relaxed">
              {t('sell.desc')}
            </p>
          </div>

          <button 
            onClick={() => setIsAdding(!isAdding)}
            className="group relative flex items-center gap-4 bg-white text-black rounded-[2rem] px-8 py-5 font-black uppercase italic tracking-tighter text-xl overflow-hidden active:scale-95 transition-all"
          >
            <div className="absolute inset-0 bg-emerald-500 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
            <span className="relative z-10 group-hover:text-white transition-colors">{isAdding ? t('sell.cancelEntry') : t('sell.newListing')}</span>
            <Plus className={`relative z-10 w-6 h-6 transition-transform duration-500 ${isAdding ? 'rotate-45 text-white' : 'group-hover:text-white'}`} />
          </button>
        </div>

        {/* Add Product Form */}
        <AnimatePresence>
          {isAdding && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="bg-zinc-900/50 border border-white/5 rounded-[3rem] p-10 backdrop-blur-3xl"
            >
              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.2em] ml-2">{t('sell.category')}</label>
                    <div className="grid grid-cols-2 gap-2">
                      {(['Crop', 'Seed', 'Fertilizer', 'Tool'] as const).map(c => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setCategory(c)}
                          className={`py-3 rounded-2xl text-[10px] font-black tracking-widest uppercase transition-all border ${
                            category === c 
                              ? 'bg-emerald-500/10 border-emerald-500 text-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.1)]' 
                              : 'bg-black/50 border-white/5 text-zinc-500 hover:border-white/10'
                          }`}
                        >
                          {t(`market.cat.${c}`)}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.2em] ml-2">{t('sell.name')} *</label>
                    <input 
                      required
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder={t('sell.name')}
                      className="w-full bg-black/50 border border-white/10 rounded-2xl px-5 py-4 text-base focus:outline-none focus:border-emerald-500/50 transition-all font-bold placeholder:text-zinc-700"
                    />
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.2em] ml-2">{t('sell.price')} *</label>
                      <input 
                        required
                        type="number"
                        value={price}
                        onChange={e => setPrice(e.target.value)}
                        placeholder="₹ Amount"
                        className="w-full bg-black/50 border border-white/10 rounded-2xl px-5 py-4 text-base focus:outline-none focus:border-emerald-500/50 transition-all font-bold"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.2em] ml-2">{t('sell.unit')}</label>
                      <input 
                        value={unit}
                        onChange={e => setUnit(e.target.value)}
                        placeholder="kg / bag / etc"
                        className="w-full bg-black/50 border border-white/10 rounded-2xl px-5 py-4 text-base focus:outline-none focus:border-emerald-500/50 transition-all font-bold"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.2em] ml-2">{t('sell.stock')} *</label>
                    <input 
                      required
                      type="number"
                      value={stock}
                      onChange={e => setStock(e.target.value)}
                      placeholder="Quantity"
                      className="w-full bg-black/50 border border-white/10 rounded-2xl px-5 py-4 text-base focus:outline-none focus:border-emerald-500/50 transition-all font-bold"
                    />
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.2em] ml-2">{t('sell.missionParams')}</label>
                    <textarea 
                      rows={4}
                      value={desc}
                      onChange={e => setDesc(e.target.value)}
                      placeholder="Quality specs, batch info..."
                      className="w-full bg-black/50 border border-white/10 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:border-emerald-500/50 transition-all font-medium resize-none"
                    />
                  </div>
                  <Button type="submit" className="w-full h-14 bg-white text-black hover:bg-emerald-500 hover:text-white transition-all rounded-2xl font-black uppercase tracking-widest text-lg">
                    {t('sell.deploy')}
                  </Button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Inventory Overview */}
        <div className="space-y-8">
           <div className="flex items-center gap-4">
             <Box className="w-6 h-6 text-zinc-700" />
             <h2 className="text-2xl font-black italic uppercase tracking-tight">{t('sell.activeListings').split(' ')[0]} <span className="text-zinc-500">{t('sell.activeListings').split(' ')[1] || ''}</span></h2>
             <div className="h-[1px] flex-grow bg-white/5" />
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
             {myProducts.map((p, idx) => (
               <motion.div
                 layout
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ delay: idx * 0.05 }}
                 key={p.id}
                 className="bg-zinc-900 border border-white/5 rounded-[2rem] p-8 hover:border-emerald-500/30 transition-all group relative overflow-hidden"
               >
                 <div className="absolute top-0 right-0 p-4">
                    <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 py-1 px-3 text-[10px] uppercase font-black tracking-widest">
                      {t(`market.cat.${p.category}`)}
                    </Badge>
                 </div>

                 <div className="space-y-6">
                    <div className="space-y-1">
                      <h3 className="text-3xl font-black italic uppercase italic tracking-tighter group-hover:text-emerald-500 transition-colors">
                        {p.name}
                      </h3>
                      <div className="text-zinc-600 text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2">
                        <Clock className="w-3 h-3" />
                        {p.createdAt?.toDate ? p.createdAt.toDate().toLocaleDateString() : 'Awaiting Metadata'}
                      </div>
                    </div>

                    <div className="flex items-end justify-between py-4 border-y border-white/5">
                      <div>
                        <div className="text-zinc-500 text-[9px] font-black uppercase tracking-widest mb-1">{t('common.valuation')}</div>
                        <div className="text-3xl font-black text-white tracking-tight">₹{p.price}<span className="text-zinc-700 text-sm font-bold uppercase ml-1">/{p.unit}</span></div>
                      </div>
                      <div className="text-right">
                        <div className="text-zinc-500 text-[9px] font-black uppercase tracking-widest mb-1">{t('common.inStock')}</div>
                        <div className="text-2xl font-black text-zinc-300 tracking-tight">{p.stock}</div>
                      </div>
                    </div>

                    <p className="text-zinc-500 text-sm font-medium line-clamp-2 h-10 italic">
                      "{p.description || 'No descriptive metadata provided'}"
                    </p>

                    <button 
                      onClick={() => handleDelete(p.id)}
                      className="w-full flex items-center justify-center gap-3 bg-zinc-800 hover:bg-rose-900/50 hover:text-rose-500 transition-all rounded-xl h-12 font-black uppercase tracking-widest text-[11px]"
                    >
                      <Trash2 className="w-4 h-4" /> {t('sell.decommission')}
                    </button>
                 </div>
               </motion.div>
             ))}
           </div>

           {myProducts.length === 0 && (
             <div className="py-24 text-center space-y-6 bg-zinc-900/30 rounded-[3rem] border border-dashed border-white/5">
               <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center mx-auto">
                 <Package className="w-6 h-6 text-zinc-700" />
               </div>
               <div className="space-y-2">
                 <h3 className="text-xl font-bold uppercase text-zinc-500">{t('sell.zeroInventory')}</h3>
                 <p className="text-zinc-700 text-sm font-medium">{t('sell.initFirst')}</p>
               </div>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default Sell;

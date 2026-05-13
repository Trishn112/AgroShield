import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingCart, Search, Filter, ArrowUpRight, TrendingUp, ShieldCheck, User, Leaf, Droplets } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/lib/languageStore';

const products = [
  { id: 1, name: 'Premium Organic Wheat', category: 'Produce', price: 42, unit: 'Bushel', stock: 120, farmer: 'Green Valley Farms', image: 'https://picsum.photos/seed/wheat/400/300' },
  { id: 2, name: 'Nitrogen-Max Fertilizer', category: 'Fertilizers', price: 65, unit: '50kg Bag', stock: 100, farmer: 'AgroBoost Co.', image: 'https://image-placeholder.ais.studio/api/generate-image?prompt=bag+of+premium+nitrogen+fertilizer+agricultural+laboratory+setting+cinematic+lighting' },
  { id: 3, name: 'Precision Irrigation Sensors', category: 'Technology', price: 156, unit: 'Unit', stock: 12, farmer: 'ShieldTech', image: 'https://picsum.photos/seed/sensor/400/300' },
  { id: 4, name: 'Heirloom Tomato Seeds', category: 'Seeds', price: 12, unit: 'Packet', stock: 200, farmer: 'Heritage Seeds', image: 'https://picsum.photos/seed/seeds/400/300' },
  { id: 5, name: 'Solar Water Pump', category: 'Tools', price: 449, unit: 'Full Kit', stock: 5, farmer: 'EcoVibe Energy', image: 'https://picsum.photos/seed/pump/400/300' },
  { id: 6, name: 'Smart Pest Repellent', category: 'Technology', price: 85, unit: 'Device', stock: 20, farmer: 'GuardNature', image: 'https://picsum.photos/seed/repel/400/300' },
  { id: 7, name: 'Eco-Glow Organic Fertilizer', category: 'Fertilizers', price: 38, unit: '25kg bag', stock: 60, farmer: 'EarthFirst', image: 'https://image-placeholder.ais.studio/api/generate-image?prompt=organic+compost+fertilizer+pack+close+up+garden+background' },
  { id: 8, name: 'Bio-Liquid Nutrients', category: 'Fertilizers', price: 120, unit: '5L Gallon', stock: 30, farmer: 'AgroBoost Co.', image: 'https://image-placeholder.ais.studio/api/generate-image?prompt=liquid+fertilizer+bottle+in+a+greenhouse+macro+photography' },
  { id: 9, name: 'Fuji Apples (Organic)', category: 'Produce', price: 5, unit: 'kg', stock: 500, farmer: 'Applewood Orchards', image: 'https://image-placeholder.ais.studio/api/generate-image?prompt=crate+of+fresh+fuji+apples+soft+morning+light' },
  { id: 10, name: 'Sweet Corn Baskets', category: 'Produce', price: 15, unit: 'Basket', stock: 85, farmer: 'Sunny Fields', image: 'https://image-placeholder.ais.studio/api/generate-image?prompt=stack+of+organic+sweet+corn+ears' },
  { id: 11, name: 'Hybrid Sunflower Seeds', category: 'Seeds', price: 18, unit: 'Packet', stock: 150, farmer: 'BioGenics', image: 'https://image-placeholder.ais.studio/api/generate-image?prompt=sunflower+seeds+in+a+wooden+bowl' },
  { id: 12, name: 'Autonomous HarvestBot', category: 'Tools', price: 2999, unit: 'Unit', stock: 2, farmer: 'RoboFarm', image: 'https://image-placeholder.ais.studio/api/generate-image?prompt=autonomous+farming+robot+in+a+futuristic+field' },
  { id: 13, name: 'Honey Gold Potatoes', category: 'Produce', price: 8, unit: '5kg', stock: 300, farmer: 'Root Valley', image: 'https://image-placeholder.ais.studio/api/generate-image?prompt=crate+of+golden+potatoes+on+rustic+table' },
  { id: 14, name: 'Weather Station Pro', category: 'Technology', price: 850, unit: 'Unit', stock: 10, farmer: 'ShieldTech', image: 'https://image-placeholder.ais.studio/api/generate-image?prompt=advanced+weather+station+in+a+windy+field+futuristic+design' },
  { id: 15, name: 'Ancient Grain Sampler', category: 'Seeds', price: 45, unit: 'Assortment', stock: 40, farmer: 'Heritage Seeds', image: 'https://image-placeholder.ais.studio/api/generate-image?prompt=selection+of+ancient+grains+in+small+hemp+bags' },
  { id: 16, name: 'Hydroponic Tower', category: 'Tools', price: 720, unit: 'Unit', stock: 8, farmer: 'EcoVibe Energy', image: 'https://image-placeholder.ais.studio/api/generate-image?prompt=vertical+hydroponic+tower+glowing+with+leds' },
  { id: 17, name: 'Satellite Soil Analyzer', category: 'Technology', price: 1200, unit: 'Annual License', stock: 100, farmer: 'OrbitalAg', image: 'https://image-placeholder.ais.studio/api/generate-image?prompt=satellite+view+of+crop+fields+with+digital+overlay+data' },
  { id: 18, name: 'Organic Blueberries', category: 'Produce', price: 12, unit: 'box', stock: 120, farmer: 'Applewood Orchards', image: 'https://image-placeholder.ais.studio/api/generate-image?prompt=fresh+blueberries+with+water+droplets+macro+shot' },
];

export default function Marketplace() {
  const { t } = useLanguage();
  const [category, setCategory] = useState('All');
  const [search, setSearch] = useState('');

  const filteredProducts = products.filter(p => 
    (category === 'All' || p.category === category) &&
    (p.name.toLowerCase().includes(search.toLowerCase()) || 
     p.farmer.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-black pt-24 pb-20 px-4">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Market Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <Card className="bg-zinc-900 border-white/5 p-6 border-b-2 border-b-emerald-500/50">
             <div className="flex justify-between items-center mb-4">
               <div className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">{t('market.stats1Label')}</div>
               <TrendingUp className="w-4 h-4 text-emerald-500" />
             </div>
             <div className="text-4xl font-black text-white">$1,424.20</div>
             <p className="text-emerald-500 text-xs font-bold mt-1">+2.4% vs last week</p>
           </Card>
           <Card className="bg-zinc-900 border-white/5 p-6 border-b-2 border-b-blue-500/50">
             <div className="flex justify-between items-center mb-4">
               <div className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">{t('market.stats2Label')}</div>
               <ShieldCheck className="w-4 h-4 text-blue-500" />
             </div>
             <div className="text-4xl font-black text-white">4.2K+</div>
             <p className="text-blue-400 text-xs font-bold mt-1">128 new this month</p>
           </Card>
           <Card className="bg-zinc-900 border-white/5 p-6 border-b-2 border-b-orange-500/50">
             <div className="flex justify-between items-center mb-4">
               <div className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">{t('market.stats3Label')}</div>
               <ShoppingCart className="w-4 h-4 text-orange-500" />
             </div>
             <div className="text-4xl font-black text-white">$12.5M</div>
             <p className="text-orange-400 text-xs font-bold mt-1">Direct fair-trade impact</p>
           </Card>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 bg-zinc-900/50 p-4 rounded-[32px] border border-white/5 backdrop-blur-xl">
           <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
              {['All', 'Produce', 'Technology', 'Seeds', 'Tools', 'Fertilizers'].map(c => (
                <button 
                  key={c}
                  onClick={() => setCategory(c)}
                  className={`px-6 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${category === c ? 'bg-white text-black' : 'bg-white/5 text-zinc-500 hover:text-white'}`}
                >
                  {t(`market.cat.${c}`)}
                </button>
              ))}
           </div>
           <div className="relative w-full md:w-96">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <Input 
                 placeholder={t('market.searchPlaceholder')} 
                 className="bg-black/40 border-white/10 pl-12 h-12 rounded-2xl text-white focus:border-emerald-500/50" 
                 value={search}
                 onChange={(e) => setSearch(e.target.value)}
              />
           </div>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
           {filteredProducts.map((product, i) => (
             <motion.div
               key={product.id}
               initial={{ opacity: 0, y: 20 }}
               whileInView={{ opacity: 1, y: 0 }}
               transition={{ delay: i * 0.05 }}
               viewport={{ once: true }}
             >
               <Card className="bg-zinc-900 border-white/5 overflow-hidden group hover:border-white/20 transition-all rounded-[32px] flex flex-col h-full">
                  <div className="aspect-[4/3] overflow-hidden relative">
                     <img 
                       src={product.image} 
                       alt={product.name} 
                       className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                       referrerPolicy="no-referrer"
                     />
                     <div className="absolute top-4 left-4">
                        <Badge className="bg-emerald-500/80 backdrop-blur-md border-none text-white font-bold">{t('common.verified')}</Badge>
                     </div>
                     <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-transparent to-transparent"></div>
                  </div>
                  <CardContent className="p-8 space-y-6 flex-1 flex flex-col justify-between">
                     <div className="space-y-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="text-xl font-bold text-white mb-1">{product.name}</h3>
                            <div className="flex items-center gap-2 text-zinc-500 text-xs">
                              <User className="w-3 h-3" /> {product.farmer}
                            </div>
                          </div>
                          <div className="text-right">
                             <div className="text-2xl font-black text-emerald-400">${product.price}</div>
                             <div className="text-[10px] uppercase font-black tracking-widest text-zinc-600">Per {product.unit}</div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                           <div className="p-3 bg-white/5 rounded-xl flex items-center gap-3">
                              <Leaf className="w-4 h-4 text-emerald-500" />
                              <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{t('common.organic')}</div>
                           </div>
                           <div className="p-3 bg-white/5 rounded-xl flex items-center gap-3">
                              <Droplets className="w-4 h-4 text-blue-500" />
                              <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{t('common.sustainable')}</div>
                           </div>
                        </div>
                     </div>

                     <div className="pt-6 border-t border-white/5 flex gap-3">
                        <Button className="flex-1 bg-white text-black hover:bg-zinc-200 rounded-full font-bold h-12">
                          {t('market.btnAddToCart')}
                        </Button>
                        <Button variant="outline" className="bg-transparent border-white/10 text-white rounded-full h-12 px-8 group">
                          {t('market.btnDetails')}
                          <ArrowUpRight className="ml-2 w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                        </Button>
                     </div>
                  </CardContent>
               </Card>
             </motion.div>
           ))}
        </div>

        {/* Bulk Order Banner */}
        <div className="bg-emerald-600 rounded-[40px] p-12 relative overflow-hidden group">
           <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_top_right,#ffffff20_0%,transparent_60%)]"></div>
           <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
              <div className="max-w-xl text-center md:text-left">
                 <h2 className="text-4xl font-black text-black mb-4 tracking-tighter">{t('market.bulkTitle')}</h2>
                 <p className="text-black/70 font-medium italic">{t('market.bulkDesc')}</p>
              </div>
              <Button size="lg" className="bg-black text-white hover:bg-zinc-900 rounded-full px-12 py-8 text-xl font-bold shadow-2xl group transition-all hover:scale-105">
                 {t('market.btnQuote')}
              </Button>
           </div>
        </div>
      </div>
    </div>
  );
}

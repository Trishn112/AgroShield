import * as React from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Shield, Zap, Droplets, Map, ShoppingCart, Activity } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/lib/languageStore';

export default function Landing() {
  const { t } = useLanguage();
  return (
    <div className="bg-black text-white selection:bg-emerald-500 selection:text-white overflow-hidden">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center pt-20">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 -left-1/4 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[120px] animate-pulse"></div>
          <div className="absolute bottom-1/4 -right-1/4 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[120px] animate-pulse [animation-delay:2s]"></div>
          
          {/* Grid lines */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse:60%_50%_at_50%_50%,#000_70%,transparent_100%)]"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-8 hover:bg-emerald-500/10 hover:border-emerald-500/30 transition-all cursor-default">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-ping"></span>
              <span className="text-zinc-400 text-xs font-semibold tracking-widest uppercase">{t('landing.aiTag')}</span>
            </div>
            
            <h1 className="text-6xl md:text-8xl font-black mb-6 tracking-tight leading-[0.9]">
              {t('landing.heroTitle1')} <span className="text-emerald-500 italic">{t('landing.heroTitle2')}</span>.<br />
              {t('landing.heroTitle1')} <span className="text-blue-400 italic">{t('landing.heroTitle3')}</span>.
            </h1>
            
            <p className="max-w-2xl mx-auto text-zinc-400 text-lg md:text-xl mb-12 leading-relaxed">
              {t('landing.heroDesc')}
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/crop-analysis">
                <Button size="lg" className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-full px-8 py-7 text-lg group">
                  {t('landing.btnAnalyze')}
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link to="/dashboard">
                <Button variant="outline" size="lg" className="border-white/10 bg-white/5 hover:bg-white/10 text-white rounded-full px-8 py-7 text-lg">
                  {t('landing.btnMonitor')}
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Floating Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-24">
            {[
              { label: 'Crops Protected', val: '4.2M+', color: 'text-emerald-500' },
              { label: 'Water Saved', val: '12B Gal', color: 'text-blue-400' },
              { label: 'Risk Accuracy', val: '99.4%', color: 'text-emerald-500' },
              { label: 'Farmers Impacted', val: '850K', color: 'text-blue-400' },
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.1 }}
                className="bg-white/5 border border-white/5 rounded-2xl p-6 backdrop-blur-sm"
              >
                <div className={`text-3xl font-bold mb-1 ${stat.color}`}>{stat.val}</div>
                <div className="text-zinc-500 text-xs uppercase tracking-widest">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 px-4 bg-zinc-950/50 relative">
        <div className="max-w-7xl mx-auto">
          <div className="mb-20">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">{t('landing.futureTitle')}</h2>
            <p className="text-zinc-500 max-w-xl">{t('landing.futureDesc')}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<Shield className="w-8 h-8 text-emerald-500" />}
              title={t('landing.feature1Title')}
              desc={t('landing.feature1Desc')}
              link="/crop-analysis"
            />
            <FeatureCard 
              icon={<Activity className="w-8 h-8 text-blue-400" />}
              title={t('landing.feature2Title')}
              desc={t('landing.feature2Desc')}
              link="/dashboard"
            />
            <FeatureCard 
              icon={<Droplets className="w-8 h-8 text-cyan-400" />}
              title={t('landing.feature3Title')}
              desc={t('landing.feature3Desc')}
              link="/irrigation"
            />
            <FeatureCard 
              icon={<ShoppingCart className="w-8 h-8 text-blue-400" />}
              title={t('landing.feature4Title')}
              desc={t('landing.feature4Desc')}
              link="/marketplace"
            />
            <FeatureCard 
              icon={<Zap className="w-8 h-8 text-yellow-500" />}
              title={t('landing.feature5Title')}
              desc={t('landing.feature5Desc')}
              link="/dashboard"
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 px-4">
        <div className="max-w-4xl mx-auto text-center bg-gradient-to-br from-zinc-900 to-zinc-950 border border-white/5 rounded-[40px] p-16 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-emerald-500/10 blur-[80px]"></div>
          <h2 className="text-4xl md:text-6xl font-bold mb-8 tracking-tighter">{t('landing.ctaTitle')}</h2>
          <p className="text-zinc-400 mb-12 text-xl max-w-xl mx-auto">
            {t('landing.ctaDesc')}
          </p>
          <Link to="/auth">
            <Button size="lg" className="bg-white text-black hover:bg-zinc-200 rounded-full px-12 py-8 text-xl font-bold transition-all hover:scale-105">
              {t('landing.launchBtn')}
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({ icon, title, desc, link }: { icon: React.ReactNode, title: string, desc: string, link: string }) {
  return (
    <Link to={link}>
      <motion.div 
        whileHover={{ y: -5 }}
        className="bg-zinc-900/50 border border-white/5 p-8 rounded-[32px] hover:bg-zinc-900 transition-all group"
      >
        <div className="mb-6 p-4 bg-black rounded-2xl w-fit group-hover:bg-zinc-800 transition-colors">
          {icon}
        </div>
        <h3 className="text-xl font-bold mb-3">{title}</h3>
        <p className="text-zinc-500 text-sm leading-relaxed mb-6">{desc}</p>
        <div className="flex items-center gap-2 text-emerald-500 text-xs font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
          Launch Module <ArrowRight className="w-3 h-3" />
        </div>
      </motion.div>
    </Link>
  );
}

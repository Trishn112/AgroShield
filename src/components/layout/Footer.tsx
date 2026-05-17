import { Github, Twitter, Linkedin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/lib/languageStore';

export default function Footer() {
  const { t } = useLanguage();
  
  return (
    <footer className="bg-zinc-950 border-t border-white/5 pt-20 pb-10 px-4">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
        <div className="space-y-6">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-12 h-12 rounded-xl overflow-hidden group-hover:scale-110 transition-transform">
              <img src="/logo.png" alt="Kisan Sathi Logo" className="w-full h-full object-cover" />
            </div>
            <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
              Kisan Sathi
            </span>
          </Link>
          <p className="text-zinc-400 text-sm leading-relaxed max-w-xs">
            {t('footer.tagline')}
          </p>
          <div className="flex gap-4">
            <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-zinc-400 hover:bg-emerald-500 hover:text-white transition-all">
              <Twitter className="w-5 h-5" />
            </a>
            <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-zinc-400 hover:bg-emerald-500 hover:text-white transition-all">
              <Github className="w-5 h-5" />
            </a>
            <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-zinc-400 hover:bg-emerald-500 hover:text-white transition-all">
              <Linkedin className="w-5 h-5" />
            </a>
          </div>
        </div>

        <div>
          <h4 className="text-white font-semibold mb-6">{t('footer.platform')}</h4>
          <ul className="space-y-4 text-zinc-400 text-sm">
            <li><Link to="/dashboard" className="hover:text-emerald-400 transition-colors">{t('footer.dashboard')}</Link></li>
            <li><Link to="/crop-analysis" className="hover:text-emerald-400 transition-colors">{t('footer.cropAI')}</Link></li>
            <li><Link to="/weather" className="hover:text-emerald-400 transition-colors">{t('footer.weather')}</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-semibold mb-6">{t('footer.resources')}</h4>
          <ul className="space-y-4 text-zinc-400 text-sm">
            <li><a href="#" className="hover:text-emerald-400 transition-colors">{t('footer.handbook')}</a></li>
            <li><a href="#" className="hover:text-emerald-400 transition-colors">{t('footer.apiDoc')}</a></li>
            <li><a href="#" className="hover:text-emerald-400 transition-colors">{t('footer.reports')}</a></li>
            <li><a href="#" className="hover:text-emerald-400 transition-colors">{t('footer.forum')}</a></li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-semibold mb-6">{t('footer.trust')}</h4>
          <ul className="space-y-4 text-zinc-400 text-sm">
            <li><a href="#" className="hover:text-emerald-400 transition-colors">{t('footer.privacy')}</a></li>
            <li><a href="#" className="hover:text-emerald-400 transition-colors">{t('footer.terms')}</a></li>
            <li><a href="#" className="hover:text-emerald-400 transition-colors">{t('footer.security')}</a></li>
            <li><a href="#" className="hover:text-emerald-400 transition-colors">{t('footer.cookie')}</a></li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
        <p className="text-zinc-500 text-xs">
          &copy; {new Date().getFullYear()} Kisan Sathi. {t('footer.rights')}
        </p>
        <p className="text-zinc-500 text-xs flex items-center gap-1">
          {t('footer.madeWith')} <span className="text-emerald-500">♥</span> for the planet.
        </p>
      </div>
    </footer>
  );
}

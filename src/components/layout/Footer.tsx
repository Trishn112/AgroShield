import { Briefcase, Github, Twitter, Linkedin, Facebook, Leaf } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-zinc-950 border-t border-white/5 pt-20 pb-10 px-4">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
        <div className="space-y-6">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center group-hover:rotate-12 transition-transform">
              <Leaf className="text-white w-6 h-6" />
            </div>
            <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
              Kisan Sathi
            </span>
          </Link>
          <p className="text-zinc-400 text-sm leading-relaxed max-w-xs">
            Next-generation environmental intelligence platform leveraging AI to protect global food stability and rural communities.
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
          <h4 className="text-white font-semibold mb-6">Platform</h4>
          <ul className="space-y-4 text-zinc-400 text-sm">
            <li><Link to="/dashboard" className="hover:text-emerald-400 transition-colors">Analytics Dashboard</Link></li>
            <li><Link to="/crop-analysis" className="hover:text-emerald-400 transition-colors">Crop Diagnosis AI</Link></li>
            <li><Link to="/weather" className="hover:text-emerald-400 transition-colors">Weather Intelligence</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-semibold mb-6">Resources</h4>
          <ul className="space-y-4 text-zinc-400 text-sm">
            <li><a href="#" className="hover:text-emerald-400 transition-colors">Farmer's Handbook</a></li>
            <li><a href="#" className="hover:text-emerald-400 transition-colors">API Documentation</a></li>
            <li><a href="#" className="hover:text-emerald-400 transition-colors">Sustainability Reports</a></li>
            <li><a href="#" className="hover:text-emerald-400 transition-colors">Community Forum</a></li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-semibold mb-6">Trust</h4>
          <ul className="space-y-4 text-zinc-400 text-sm">
            <li><a href="#" className="hover:text-emerald-400 transition-colors">Privacy Policy</a></li>
            <li><a href="#" className="hover:text-emerald-400 transition-colors">Terms of Service</a></li>
            <li><a href="#" className="hover:text-emerald-400 transition-colors">Security Center</a></li>
            <li><a href="#" className="hover:text-emerald-400 transition-colors">Cookie Policy</a></li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
        <p className="text-zinc-500 text-xs">
          &copy; {new Date().getFullYear()} Kisan Sathi. All rights reserved.
        </p>
        <p className="text-zinc-500 text-xs flex items-center gap-1">
          Made with <span className="text-emerald-500">♥</span> for the planet.
        </p>
      </div>
    </footer>
  );
}

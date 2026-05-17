import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Droplets, 
  Cloud, 
  Thermometer, 
  Wind, 
  CheckCircle2, 
  Info, 
  Search,
  Gauge, 
  Activity, 
  Waves,
  Sprout,
  X,
  ArrowUpRight,
  RefreshCw,
  Sparkles,
  MapPin
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { getCurrentWeatherByCoords, WeatherResponse } from '@/services/weatherService';
import { toast } from 'sonner';
import { useLanguage } from '@/lib/languageStore';

interface CropProfile {
  name: string;
  moisture: string;
  temp: string;
  cloud: string;
  wind: string;
  description: string;
}

const CROP_DATABASE: CropProfile[] = [
  { name: 'Corn', moisture: '38-45%', temp: '21-30°C', cloud: '10-20%', wind: '5-15km/h', description: 'Requires deep watering during silking stage.' },
  { name: 'Wheat', moisture: '25-35%', temp: '15-24°C', cloud: '20-40%', wind: '10-20km/h', description: 'Sensitive to excessive moisture during grain filling.' },
  { name: 'Rice', moisture: '75-90%', temp: '25-35°C', cloud: '40-60%', wind: '0-10km/h', description: 'Requires consistent flooding or high saturation.' },
  { name: 'Tomato', moisture: '50-65%', temp: '20-28°C', cloud: '0-15%', wind: '5-10km/h', description: 'Needs consistent moisture to prevent blossom end rot.' },
  { name: 'Potato', moisture: '60-75%', temp: '15-20°C', cloud: '30-50%', wind: '5-12km/h', description: 'Prefers cool, consistently moist soil.' },
  { name: 'Soybean', moisture: '45-55%', temp: '22-32°C', cloud: '20-30%', wind: '8-15km/h', description: 'High water demand during pod development.' },
  { name: 'Cotton', moisture: '30-40%', temp: '25-35°C', cloud: '10-25%', wind: '10-18km/h', description: 'Drought tolerant but needs water for boll sizing.' },
  { name: 'Coffee', moisture: '60-80%', temp: '18-24°C', cloud: '40-70%', wind: '0-8km/h', description: 'Requires high humidity and filtered sunlight.' },
  { name: 'Sugarcane', moisture: '70-85%', temp: '20-35°C', cloud: '20-50%', wind: '5-15km/h', description: 'High water requirement throughout growth cycle.' },
  { name: 'Barley', moisture: '20-30%', temp: '12-20°C', cloud: '20-40%', wind: '10-20km/h', description: 'Tolerates some drought but needs water during tillering.' },
];

export default function Irrigation() {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCrop, setSelectedCrop] = useState<CropProfile>(CROP_DATABASE[0]);
  const [computing, setComputing] = useState(false);
  const [searchingAI, setSearchingAI] = useState(false);
  const [recommendation, setRecommendation] = useState<any>(null);
  const [realTimeWeather, setRealTimeWeather] = useState<WeatherResponse | null>(null);
  const [manualTelemetry, setManualTelemetry] = useState({
    moisture: '42',
    temp: '',
    cloud: '',
    wind: ''
  });
  
  useEffect(() => {
    // Get current location weather
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          try {
            const data = await getCurrentWeatherByCoords(pos.coords.latitude, pos.coords.longitude);
            setRealTimeWeather(data);
            setManualTelemetry(prev => ({
              ...prev,
              temp: Math.round(data.main.temp).toString(),
              cloud: data.clouds.all.toString(),
              wind: Math.round(data.wind.speed).toString()
            }));
          } catch (err) {
            console.error("Weather fetch error:", err);
          }
        }
      );
    }
  }, []);

  const filteredCrops = useMemo(() => {
    if (!searchQuery) return [];
    return CROP_DATABASE.filter(c => 
      c.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

const searchGlobalCrop = async () => {
  if (!searchQuery) return;

  setSearchingAI(true);

  try {
    const response = await fetch(
      "https://kisan-sathi-dz6w.onrender.com/api/chat",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          messages: [
            {
              role: "user",
              content: `
Provide agricultural optimization parameters for crop "${searchQuery}" in JSON format.

Return ONLY valid JSON.

Format:
{
  "name": "",
  "moisture": "",
  "temp": "",
  "cloud": "",
  "wind": "",
  "description": ""
}
`
            }
          ]
        }),
      }
    );

    if (!response.ok) {
      throw new Error("Failed AI request");
    }

    const text = await response.text();

    let data;

    try {
      data = JSON.parse(text);
    } catch {
      toast.error("AI returned invalid JSON");
      return;
    }

    setSelectedCrop(data);
    setSearchQuery("");
    setRecommendation(null);

    toast.success(`Telemetry loaded for ${data.name}`);
  } catch (err) {
    console.error(err);
    toast.error("Failed to retrieve AI crop telemetry.");
  } finally {
    setSearchingAI(false);
  }
};

  const calculateIrrigation = () => {
    setComputing(true);
    setTimeout(() => {
      setRecommendation({
        amount: (Math.random() * 5 + 2).toFixed(1) + 'L',
        frequency: 'Every ' + (Math.floor(Math.random() * 8) + 4) + ' hours',
        efficiency: (90 + Math.random() * 8).toFixed(1) + '%',
        timing: 'Next: 19:45 (Optimal)',
        reason: `Environmental parameters for ${selectedCrop.name} are shifting. Current moisture levels approaching lower threshold.`
      });
      setComputing(false);
    }, 1500);
  };

  const handleSelectCrop = (crop: CropProfile) => {
    setSelectedCrop(crop);
    setSearchQuery('');
    setRecommendation(null);
  };

  return (
    <div className="min-h-screen bg-black pt-24 pb-20 px-4 md:px-8">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-end gap-8 border-b border-white/5 pb-12">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 text-emerald-500 mb-4">
               <Activity className="w-4 h-4 animate-pulse" />
               <span className="text-[10px] font-black uppercase tracking-[0.4em]">{t('irr.tag')}</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-black text-white mb-6 tracking-tighter leading-none italic uppercase">
              {t('irr.title')}
            </h1>
            <p className="text-zinc-500 text-lg font-medium leading-relaxed italic">
              {t('irr.desc')}
            </p>
          </div>
          <Button 
            onClick={calculateIrrigation} 
            disabled={computing} 
            className="bg-emerald-500 hover:bg-emerald-400 text-black rounded-2xl px-16 py-10 text-xl font-black uppercase tracking-widest shadow-[0_0_50px_rgba(16,185,129,0.2)] transition-all transform hover:scale-105 active:scale-95"
          >
            {computing ? (
              <span className="flex items-center gap-3">
                <RefreshCw className="w-6 h-6 animate-spin" /> {t('irr.syncing').toUpperCase()}
              </span>
            ) : t('irr.btnCompute').toUpperCase()}
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           {/* Sidebar: Search & Stats */}
           <div className="space-y-6">
             <Card className="bg-slate-900/40 backdrop-blur-xl border-white/5 rounded-[40px] p-8">
                <div className="space-y-6">
                   <div className="relative">
                    <div className="flex items-center justify-between mb-4">
                      <label className="text-[10px] uppercase font-black tracking-widest text-zinc-600">{t('irr.searchLabel')}</label>
                      <Sprout className="w-3 h-3 text-emerald-500" />
                    </div>
                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                      <Input 
                        placeholder={t('irr.searchPlaceholder')} 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && searchGlobalCrop()}
                        className="bg-black/40 border-white/5 rounded-2xl pl-12 py-6 text-sm focus:ring-emerald-500/20"
                      />
                      {searchQuery && (
                        <button onClick={() => setSearchQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white">
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <AnimatePresence>
                      {(filteredCrops.length > 0 || (searchQuery && !searchingAI)) && (
                        <motion.div 
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 5 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="absolute z-50 w-full bg-[#0a0a0a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden mt-1"
                        >
                          {filteredCrops.map(crop => (
                            <button
                              key={crop.name}
                              onClick={() => handleSelectCrop(crop)}
                              className="w-full px-6 py-4 text-left hover:bg-emerald-500/10 transition-colors flex items-center justify-between group border-b border-white/5 last:border-none"
                            >
                              <span className="text-zinc-300 font-bold group-hover:text-emerald-500">{crop.name}</span>
                              <ArrowUpRight className="w-3 h-3 text-zinc-600 group-hover:text-emerald-500" />
                            </button>
                          ))}
                          {searchQuery && (
                            <button
                              onClick={searchGlobalCrop}
                              disabled={searchingAI}
                              className="w-full px-6 py-5 text-left hover:bg-emerald-500/20 transition-colors flex items-center gap-3 bg-emerald-500/5 group"
                            >
                              <Sparkles className={`w-4 h-4 text-emerald-500 ${searchingAI ? 'animate-spin' : ''}`} />
                              <span className="text-emerald-500 text-xs font-black uppercase tracking-widest">
                                {searchingAI ? t('irr.consultingAI') : `${t('irr.bioDatabase')} "${searchQuery}"`}
                              </span>
                            </button>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="pt-6 border-t border-white/5 space-y-4">
                    <div className="flex items-baseline gap-2 mb-2">
                       <span className="text-3xl font-black text-white italic tracking-tighter">{selectedCrop.name.toUpperCase()}</span>
                       <Badge className="bg-emerald-500/10 text-emerald-500 text-[8px] font-black tracking-widest uppercase">Target Vector</Badge>
                    </div>
                    <p className="text-[11px] text-zinc-600 font-bold leading-relaxed italic uppercase tracking-wider">{selectedCrop.description}</p>
                  </div>
                </div>
             </Card>

             <Card className="bg-slate-900/40 backdrop-blur-xl border-white/5 rounded-[40px] p-8 space-y-4">
                <div className="flex items-center justify-between mb-6">
                  <h4 className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em]">{t('irr.telemetryTitle')}</h4>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3 h-3 text-blue-500" />
                    <span className="text-[10px] font-bold text-zinc-500 truncate max-w-[100px]">{realTimeWeather?.name || 'Searching...'}</span>
                  </div>
                </div>
                {[
                  { 
                    label: t('irr.soilMoisture'), 
                    value: selectedCrop.moisture, 
                    current: manualTelemetry.moisture,
                    suffix: '%',
                    key: 'moisture',
                    icon: <Droplets className="w-4 h-4" />, 
                    color: 'text-blue-400' 
                  },
                  { 
                    label: t('irr.thermals'), 
                    value: selectedCrop.temp, 
                    current: manualTelemetry.temp,
                    suffix: '°C',
                    key: 'temp',
                    icon: <Thermometer className="w-4 h-4" />, 
                    color: 'text-orange-500' 
                  },
                  { 
                    label: t('irr.cloudDensity'), 
                    value: selectedCrop.cloud, 
                    current: manualTelemetry.cloud,
                    suffix: '%',
                    key: 'cloud',
                    icon: <Cloud className="w-4 h-4" />, 
                    color: 'text-zinc-500' 
                  },
                  { 
                    label: t('irr.windVelocity'), 
                    value: selectedCrop.wind, 
                    current: manualTelemetry.wind,
                    suffix: 'km/h',
                    key: 'wind',
                    icon: <Wind className="w-4 h-4" />, 
                    color: 'text-cyan-400' 
                  },
                ].map((input, i) => (
                  <div key={i} className="p-5 bg-black/40 rounded-3xl border border-white/5 group hover:border-white/10 transition-all">
                    <div className="flex items-center justify-between mb-4">
                       <div className="flex items-center gap-3">
                        <div className={`p-2 bg-white/5 rounded-xl ${input.color}`}>
                          {input.icon}
                        </div>
                        <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{input.label}</span>
                      </div>
                      <Badge variant="outline" className="border-white/5 text-[9px] text-zinc-600 uppercase font-black tracking-tighter">{t('irr.manualOverride')}</Badge>
                    </div>
                    
                    <div className="flex items-end justify-between px-1">
                      <div className="w-1/2">
                        <div className="flex items-center gap-1 group/input">
                          <input 
                            type="text"
                            value={input.current}
                            onChange={(e) => setManualTelemetry(prev => ({ ...prev, [input.key]: e.target.value }))}
                            className="w-full bg-transparent text-2xl font-black text-white italic tracking-tighter outline-none border-b border-transparent focus:border-emerald-500/50 transition-colors"
                          />
                          <span className="text-xl font-black text-zinc-500 italic mb-0.5">{input.suffix}</span>
                        </div>
                        <div className="text-[9px] font-bold text-zinc-700 uppercase">{t('irr.inputValue')}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-black text-emerald-500 italic tracking-tighter opacity-60">{input.value}</div>
                        <div className="text-[9px] font-bold text-emerald-500/50 uppercase">{t('irr.optimal')}</div>
                      </div>
                    </div>
                  </div>
                ))}
             </Card>
           </div>

           <div className="lg:col-span-2 space-y-8">
             {recommendation ? (
               <motion.div 
                 initial={{ opacity: 0, scale: 0.95 }}
                 animate={{ opacity: 1, scale: 1 }}
                 className="grid grid-cols-1 md:grid-cols-2 gap-6"
               >
                 <Card className="bg-emerald-500 border-none p-12 md:col-span-2 rounded-[48px] overflow-hidden relative group">
                    <div className="absolute -right-20 -top-20 opacity-10 group-hover:scale-110 transition-transform duration-1000 rotate-12">
                       <Waves className="w-96 h-96 text-black" />
                    </div>
                    <div className="relative z-10">
                      <div className="flex items-center gap-3 mb-8 text-black/60 text-[10px] font-black uppercase tracking-[0.4em]">
                        <CheckCircle2 className="w-4 h-4" /> {t('irr.actionProtocol')}
                      </div>
                      <div className="text-[10rem] font-black text-black leading-none mb-8 tracking-tighter italic">
                        {recommendation.amount.split('.')[0]}<span className="text-5xl">.{recommendation.amount.split('.')[1]}</span>
                        <div className="text-3xl uppercase tracking-[0.2em] mt-2 opacity-60">{t('irr.litersPerPlant')}</div>
                      </div>
                      <p className="text-black/80 font-bold text-xl leading-relaxed max-w-xl italic">
                        "{recommendation.reason}"
                      </p>
                    </div>
                 </Card>

                 <Card className="bg-slate-900/40 backdrop-blur-xl border-white/5 p-10 rounded-[40px] group transition-all hover:border-emerald-500/20">
                    <div className="flex items-center justify-between mb-10">
                       <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">{t('irr.temporalWindow')}</span>
                       <Activity className="text-emerald-500 w-5 h-5 group-hover:scale-125 transition-transform" />
                    </div>
                    <div className="text-4xl font-black text-white italic tracking-tighter mb-2">{recommendation.timing}</div>
                    <p className="text-zinc-600 text-xs font-bold leading-relaxed uppercase tracking-wide">{t('irr.solarSync')}</p>
                 </Card>

                 <Card className="bg-slate-900/40 backdrop-blur-xl border-white/5 p-10 rounded-[40px] group transition-all hover:border-blue-500/20">
                    <div className="flex items-center justify-between mb-10">
                       <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">{t('irr.cyclePulsation')}</span>
                       <Waves className="text-blue-500 w-5 h-5 group-hover:scale-125 transition-transform" />
                    </div>
                    <div className="text-4xl font-black text-white italic tracking-tighter mb-2">{recommendation.frequency}</div>
                    <p className="text-zinc-600 text-xs font-bold leading-relaxed uppercase tracking-wide">{t('irr.transpirationBuffering')}</p>
                 </Card>
               </motion.div>
             ) : (
               <div className="h-[500px] bg-slate-900/20 border border-dashed border-white/10 rounded-[64px] flex flex-col items-center justify-center p-20 text-center group">
                  <div className="w-32 h-32 bg-white/5 rounded-[48px] flex items-center justify-center mb-10 group-hover:bg-emerald-500/10 transition-all">
                    <Gauge className="text-zinc-800 w-16 h-16 group-hover:text-emerald-500 transition-colors animate-slow-spin" />
                  </div>
                  <h3 className="text-zinc-500 font-black text-3xl mb-4 italic tracking-tighter uppercase">{t('irr.standbyTitle')}</h3>
                  <p className="text-zinc-700 max-w-sm text-sm font-bold leading-relaxed uppercase tracking-widest">
                    {t('irr.standbyDesc')}
                  </p>
               </div>
             )}

             <div className="bg-zinc-950/50 border border-white/5 rounded-[48px] p-12 relative overflow-hidden">
                <div className="absolute right-0 top-0 w-64 h-64 bg-emerald-500/5 blur-[80px]"></div>
                <div className="flex items-center gap-6 mb-12">
                  <div className="w-16 h-16 bg-white/5 rounded-3xl flex items-center justify-center border border-white/5">
                    <Info className="text-emerald-500 w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="text-2xl font-black text-white italic tracking-tighter">{t('irr.sustainability').toUpperCase()}</h4>
                    <p className="text-zinc-600 text-[10px] font-black uppercase tracking-[0.3em]">Planetary Resource Protection</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                  {[
                    { title: t('irr.resourceEff'), val: '98.2%', color: 'text-blue-400' },
                    { title: t('irr.globalYield'), val: '+22.4%', color: 'text-emerald-500' },
                    { title: t('irr.soilVitality'), val: 'OPTIMAL', color: 'text-white' },
                  ].map((stat, i) => (
                    <div key={i} className="space-y-3">
                      <div className="text-zinc-700 text-[9px] font-black uppercase tracking-[0.4em]">{stat.title}</div>
                      <div className={`text-4xl font-black italic tracking-tighter ${stat.color}`}>{stat.val}</div>
                      <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                         <div className={`h-full bg-current opacity-20 w-3/4 ${stat.color}`}></div>
                      </div>
                    </div>
                  ))}
                </div>
             </div>
           </div>
        </div>
      </div>
    </div>
  );
}



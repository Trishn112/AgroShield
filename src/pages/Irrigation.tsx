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
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          try {
            const data = await getCurrentWeatherByCoords(
              pos.coords.latitude,
              pos.coords.longitude
            );

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
      setSearchQuery('');
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
        reason: `Environmental parameters for ${selectedCrop.name} are shifting.`
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

        <div className="flex flex-col md:flex-row justify-between items-end gap-8 border-b border-white/5 pb-12">

          <div className="max-w-2xl">
            <div className="flex items-center gap-2 text-emerald-500 mb-4">
              <Activity className="w-4 h-4 animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-[0.4em]">
                {t('irr.tag')}
              </span>
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
            className="bg-emerald-500 hover:bg-emerald-400 text-black rounded-2xl px-16 py-10 text-xl font-black uppercase"
          >
            {computing ? (
              <span className="flex items-center gap-3">
                <RefreshCw className="w-6 h-6 animate-spin" />
                {t('irr.syncing').toUpperCase()}
              </span>
            ) : (
              t('irr.btnCompute').toUpperCase()
            )}
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          <div className="space-y-6">

            <Card className="bg-slate-900/40 border-white/5 rounded-[40px] p-8">

              <div className="space-y-6">

                <div className="relative">

                  <div className="flex items-center justify-between mb-4">
                    <label className="text-[10px] uppercase font-black tracking-widest text-zinc-600">
                      {t('irr.searchLabel')}
                    </label>

                    <Sprout className="w-3 h-3 text-emerald-500" />
                  </div>

                  <div className="relative">

                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />

                    <Input
                      placeholder={t('irr.searchPlaceholder')}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) =>
                        e.key === 'Enter' && searchGlobalCrop()
                      }
                      className="bg-black/40 border-white/5 rounded-2xl pl-12 py-6 text-sm"
                    />

                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <AnimatePresence>

                    {(filteredCrops.length > 0 || (searchQuery && !searchingAI)) && (

                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute z-50 w-full bg-[#0a0a0a] border border-white/10 rounded-2xl overflow-hidden mt-1"
                      >

                        {filteredCrops.map(crop => (

                          <button
                            key={crop.name}
                            onClick={() => handleSelectCrop(crop)}
                            className="w-full px-6 py-4 text-left hover:bg-emerald-500/10"
                          >
                            <span className="text-zinc-300 font-bold">
                              {crop.name}
                            </span>
                          </button>

                        ))}

                        {searchQuery && (

                          <button
                            onClick={searchGlobalCrop}
                            disabled={searchingAI}
                            className="w-full px-6 py-5 text-left hover:bg-emerald-500/20"
                          >
                            <span className="text-emerald-500 text-xs font-black uppercase">
                              {searchingAI
                                ? t('irr.consultingAI')
                                : `Search "${searchQuery}"`}
                            </span>
                          </button>

                        )}
                      </motion.div>

                    )}

                  </AnimatePresence>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

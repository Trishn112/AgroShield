import * as React from 'react';
import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Cloud, 
  Droplets, 
  Thermometer, 
  Wind, 
  AlertTriangle, 
  TrendingUp, 
  Zap, 
  ArrowUpRight,
  RefreshCw,
  MapPin,
  Info,
  ShieldAlert,
  Radio
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from '@/lib/languageStore';
import { getCurrentWeatherByCoords, getForecastByCoords, WeatherResponse, getCurrentAQIByCoords, AirQualityResponse, getAQIDescription } from '@/services/weatherService';
import { toast } from 'sonner';
import { collection, query, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

interface Alert {
  type: 'critical' | 'warning' | 'info';
  title: string;
  msg: string;
  time: string;
  isRealTime?: boolean;
}

export default function Dashboard() {
  const { t } = useLanguage();
  const [weather, setWeather] = useState<WeatherResponse | null>(null);
  const [aqi, setAqi] = useState<AirQualityResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [firestoreAlerts, setFirestoreAlerts] = useState<Alert[]>([]);

  // Real-time alerts from Firestore
  useEffect(() => {
    let unsubscribe: () => void = () => {};

    const setupListener = () => {
      const q = query(
        collection(db, 'alerts'), 
        orderBy('createdAt', 'desc'), 
        limit(5)
      );

      unsubscribe = onSnapshot(q, (snapshot) => {
        const alerts = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            type: data.type,
            title: data.title,
            msg: data.msg,
            time: 'Just now',
            isRealTime: true
          } as Alert;
        });
        setFirestoreAlerts(alerts);
      }, (err) => {
        // Only log error if user is actually signed in
        if (auth.currentUser) {
          console.error("Alerts listener error:", err);
          if (err.message.includes('permissions')) {
            toast.error("Dashboard sync error. Please check your credentials.");
          }
        }
      });
    };

    const authUnsubscribe = onAuthStateChanged(auth, (u) => {
      if (u) {
        setupListener();
      } else {
        unsubscribe();
        setFirestoreAlerts([]);
      }
    });

    return () => {
      authUnsubscribe();
      unsubscribe();
    };
  }, []);

  const dynamicAlerts = useMemo(() => {
    const alerts: Alert[] = [];
    if (!weather) return alerts;

    if (weather.main.temp > 35) {
      alerts.push({
        type: 'critical',
        title: 'Heatwave Alert',
        msg: 'Extreme solar influx detected. Execute irrigation protocol Delta.',
        time: 'Live'
      });
    }

    if (weather.wind.speed > 25) {
      alerts.push({
        type: 'warning',
        title: 'High Wind Warning',
        msg: 'Wind velocity exceeding stability thresholds.',
        time: 'Live'
      });
    }

    if (weather.main.humidity > 85) {
      alerts.push({
        type: 'warning',
        title: 'Pathogen Risk',
        msg: 'Hyper-moisture detected. Fungal risk elevated.',
        time: 'Live'
      });
    }

    if (aqi && aqi.list[0].main.aqi >= 4) {
      alerts.push({
        type: 'critical',
        title: 'Atmospheric Crisis',
        msg: 'Dangerous aerosol levels. Seal sensitive grow sites.',
        time: 'Live'
      });
    }

    return alerts;
  }, [weather, aqi]);

  const allAlerts = useMemo(() => {
    const base = [...dynamicAlerts, ...firestoreAlerts];
    if (base.length === 0) {
      return [
        { 
          type: 'info', 
          title: 'System Nominal', 
          msg: 'Station Alpha synced with orbital satellites.', 
          time: 'Synced' 
        }
      ] as Alert[];
    }
    return base;
  }, [dynamicAlerts, firestoreAlerts]);

  const [citySearch, setCitySearch] = useState('');
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  const fetchStats = async (lat: number, lon: number) => {
    setLoading(true);
    setError(null);
    try {
      const weatherData = await getCurrentWeatherByCoords(lat, lon);
      const forecastData = await getForecastByCoords(lat, lon);
      const aqiData = await getCurrentAQIByCoords(lat, lon);
      
      setWeather(weatherData);
      setAqi(aqiData);
      setLastRefreshed(new Date());

      const items = forecastData.list.slice(0, 6).map((f: any) => ({
        time: new Date(f.dt * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        temp: Math.round(f.main.temp),
        hum: f.main.humidity,
        water: Math.round(f.main.temp / 2)
      }));
      setChartData(items);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to fetch stats");
    } finally {
      setLoading(false);
    }
  };

  const fetchStatsByCity = async (city: string) => {
    if (!city.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const { getCurrentWeatherByCity } = await import('@/services/weatherService');
      const weatherData = await getCurrentWeatherByCity(city);
      await fetchStats(weatherData.coord.lat, weatherData.coord.lon);
      setCitySearch('');
    } catch (err: any) {
      toast.error(err.message || "City not found");
    } finally {
      setLoading(false);
    }
  };

  // Auto-refresh weather every 15 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      if (weather) {
        fetchStats(weather.coord.lat, weather.coord.lon);
      }
    }, 15 * 60 * 1000);
    return () => clearInterval(interval);
  }, [weather]);

  useEffect(() => {
    const defaultLat = 28.6139; // New Delhi
    const defaultLon = 77.2090;

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => fetchStats(pos.coords.latitude, pos.coords.longitude),
        () => {
          fetchStats(defaultLat, defaultLon);
          toast.info("Location access denied. Using default sector Alpha-01.");
        },
        { timeout: 10000 }
      );
    } else {
      fetchStats(defaultLat, defaultLon);
    }
  }, []);

  return (
    <div className="min-h-screen bg-black pt-24 pb-20 px-4 md:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Critical Alerts Banner */}
        <AnimatePresence>
          {allAlerts.filter(a => a.type === 'critical').map((alert, i) => (
            <motion.div
              key={`banner-${i}`}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="bg-orange-500 text-black px-6 py-4 rounded-2xl flex items-center justify-between mb-4 shadow-[0_0_30px_rgba(249,115,22,0.3)]">
                <div className="flex items-center gap-4">
                  <div className="bg-black/20 p-2 rounded-full animate-pulse">
                    <ShieldAlert className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="font-black uppercase tracking-tighter text-lg leading-tight">{alert.title}</h2>
                    <p className="text-sm font-medium opacity-90">{alert.msg}</p>
                  </div>
                </div>
                <Badge className="bg-black text-white border-none font-black text-[10px] tracking-widest hidden sm:block">
                  ACTION REQUIRED
                </Badge>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-1">
            <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic italic-none-not-really">{t('dash.title')}</h1>
            <div className="flex items-center gap-3 text-zinc-500">
              <div className="flex items-center gap-1 text-xs font-bold uppercase tracking-widest">
                <MapPin className="w-3 h-3 text-emerald-500" /> 
                {weather?.name || 'Alpha-01'}
              </div>
              <span className="w-1 h-1 bg-zinc-800 rounded-full"></span>
              <div className="text-[10px] font-bold uppercase tracking-widest">
                Last Sync: {lastRefreshed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="relative group flex-1 md:flex-initial min-w-[200px]">
              <input 
                type="text"
                value={citySearch}
                onChange={(e) => setCitySearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchStatsByCity(citySearch)}
                placeholder="Search Sector..."
                className="w-full bg-zinc-900 border border-white/5 rounded-full px-5 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50 transition-all pl-10"
              />
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
              <button 
                onClick={() => fetchStatsByCity(citySearch)}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/5 hover:bg-white/10 p-1.5 rounded-full transition-colors"
                title="Search city"
              >
                <ArrowUpRight className="w-3.5 h-3.5 text-zinc-400" />
              </button>
            </div>
            
            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 px-4 py-2 font-black tracking-widest text-[10px] uppercase">
              {t('dash.systemsOptimal')}
            </Badge>
            
            <Button onClick={() => {
              if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                  (pos) => fetchStats(pos.coords.latitude, pos.coords.longitude),
                  () => fetchStats(28.6139, 77.2090),
                  { timeout: 5000 }
                );
              }
            }} variant="outline" size="sm" className="bg-white/5 border-white/10 text-white rounded-full h-10 px-5">
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> {t('dash.refresh')}
            </Button>
          </div>
        </div>

        {/* Core Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard 
            title={t('dash.temp')} 
            value={weather ? `${Math.round(weather.main.temp)}°C` : '--'} 
            icon={<Thermometer className="w-5 h-5" />} 
            trend={weather ? `${Math.round(weather.main.feels_like - weather.main.temp)}° Diff` : ''}
            color="text-orange-500"
            desc="Solar irradiance nominal"
          />
          <StatCard 
            title="Humidity" 
            value={weather ? `${weather.main.humidity}%` : '--'} 
            icon={<Droplets className="w-5 h-5" />} 
            trend="Live"
            color="text-blue-400"
            desc="Soil evaporation active"
          />
          <StatCard 
            title={t('dash.airQuality')} 
            value={aqi ? `${aqi.list[0].main.aqi * 20} AQI` : '-- AQI'} 
            icon={<Wind className="w-5 h-5" />} 
            trend={aqi ? getAQIDescription(aqi.list[0].main.aqi).label : '--'}
            color={aqi ? getAQIDescription(aqi.list[0].main.aqi).color : 'text-zinc-400'}
            desc={aqi ? getAQIDescription(aqi.list[0].main.aqi).desc : 'Telemetry missing'}
          />
          <StatCard 
            title={t('dash.precip')} 
            value="12%" 
            icon={<Cloud className="w-5 h-5" />} 
            trend="48h Proj"
            color="text-zinc-400"
            desc="Accumulation forecast low"
          />
        </div>

        {/* Main Charts Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 bg-zinc-900 border-white/5 overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-white">Planetary Resource Flow</CardTitle>
                <CardDescription className="text-zinc-500">Multispectral telemetry stream</CardDescription>
              </div>
              <div className="flex gap-2">
                 <Badge className="bg-white/5 text-zinc-400">Temp</Badge>
                 <Badge className="bg-emerald-500/20 text-emerald-500">Hydration</Badge>
              </div>
            </CardHeader>
            <CardContent className="h-[300px] w-full pt-10">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                  <XAxis dataKey="time" stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '12px' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Area type="monotone" dataKey="temp" stroke="#10b981" fillOpacity={1} fill="url(#colorTemp)" strokeWidth={2} />
                  <Area type="monotone" dataKey="water" stroke="#3b82f6" fillOpacity={0} strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-white/5">
            <CardHeader className="flex flex-row items-center justify-between border-b border-white/5 pb-4">
              <CardTitle className="text-white text-lg flex items-center gap-2">
                <Radio className="w-4 h-4 text-emerald-500 animate-pulse" />
                {t('dash.alerts')}
              </CardTitle>
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[8px] font-black tracking-widest">
                LIVE TELEMETRY
              </Badge>
            </CardHeader>
            <CardContent className="space-y-4 pt-6 max-h-[400px] overflow-y-auto custom-scrollbar">
              <AnimatePresence mode="popLayout">
                {allAlerts.map((alert, index) => (
                  <motion.div
                    key={`${alert.title}-${index}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2, delay: index * 0.05 }}
                  >
                    <AlertItem 
                      type={alert.type} 
                      title={alert.title} 
                      time={alert.time} 
                      msg={alert.msg}
                      isRealTime={alert.isRealTime}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </CardContent>
          </Card>
        </div>

        {/* Lower Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="bg-zinc-900 border-white/5 p-6">
             <div className="flex items-center justify-between mb-4">
               <h3 className="text-white font-semibold">{t('dash.risk')}</h3>
               <ArrowUpRight className="w-4 h-4 text-zinc-500" />
             </div>
             <div className="flex items-end gap-3 mb-6">
               <span className="text-5xl font-black text-emerald-500">22</span>
               <span className="text-zinc-500 text-sm mb-1 uppercase tracking-widest font-semibold">/ 100</span>
             </div>
             <div className="w-full bg-zinc-800 h-2 rounded-full mb-4 overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: '22%' }}
                  transition={{ duration: 1 }}
                  className="bg-emerald-500 h-full"
                ></motion.div>
             </div>
             <p className="text-zinc-500 text-xs leading-relaxed">System state: Nominal. No immediate biological threats detected in sector sensors.</p>
          </Card>

          <Card className="bg-zinc-900 border-white/5 p-6 space-y-4">
             <h3 className="text-white font-semibold">{t('dash.tasks')}</h3>
             <ul className="space-y-3">
               {[
                 { task: 'Calibrate Relay 04', priority: 'High' },
                 { task: 'Analyze Soil Sample X', priority: 'Medium' },
                 { task: 'Check Solar Array', priority: 'Low' },
               ].map((t, i) => (
                 <li key={i} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                   <span className="text-zinc-300 text-sm">{t.task}</span>
                   <span className={`text-[10px] font-bold uppercase tracking-widest ${t.priority === 'High' ? 'text-orange-500' : 'text-zinc-500'}`}>{t.priority}</span>
                 </li>
               ))}
             </ul>
          </Card>

          <Card className="bg-zinc-900 border-white/5 p-0 overflow-hidden relative group">
             <img 
               src="https://picsum.photos/seed/agro-analysis/400/300" 
               className="w-full h-full object-cover opacity-40 group-hover:scale-105 transition-transform duration-700" 
               alt="Analysis"
               referrerPolicy="no-referrer"
             />
             <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 p-6 flex flex-col justify-end">
                <Badge variant="outline" className="w-fit mb-2 border-emerald-500/30 text-emerald-400 bg-emerald-500/10">Active GIS</Badge>
                <h3 className="text-white font-bold text-lg mb-1">Environmental Analysis</h3>
                <p className="text-zinc-400 text-xs">Access continental-scale risk visualizations.</p>
             </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, trend, color, desc }: any) {
  return (
    <Card className="bg-zinc-900 border-white/5 p-5 hover:border-white/20 transition-all group">
      <div className="flex justify-between items-start mb-4">
        <div className="p-3 bg-white/5 rounded-xl text-zinc-400 group-hover:text-white transition-colors">
          {icon}
        </div>
        <Badge variant="outline" className="text-zinc-500 font-bold bg-white/5 text-[10px]">
          {trend}
        </Badge>
      </div>
      <div>
        <div className="text-3xl font-bold text-white mb-1">{value}</div>
        <div className="flex items-center gap-2">
          <span className="text-zinc-500 text-xs font-medium uppercase tracking-wider">{title}</span>
        </div>
        <p className="text-[10px] mt-3 text-zinc-600 font-semibold uppercase tracking-widest">{desc}</p>
      </div>
    </Card>
  );
}

function AlertItem({ type, title, time, msg, isRealTime }: any) {
  const colors = {
    critical: 'border-l-orange-500 bg-orange-500/5',
    warning: 'border-l-yellow-500 bg-yellow-500/5',
    info: 'border-l-blue-500 bg-blue-500/5'
  };

  const icons = {
    critical: <ShieldAlert className="w-4 h-4 text-orange-500" />,
    warning: <AlertTriangle className="w-4 h-4 text-yellow-500" />,
    info: <Info className="w-4 h-4 text-blue-500" />
  };

  return (
    <div className={`p-4 border-l-4 rounded-r-xl space-y-2 group hover:bg-white/5 transition-all ${colors[type as keyof typeof colors]}`}>
      <div className="flex justify-between items-center text-xs">
        <div className="flex items-center gap-2">
          {icons[type as keyof typeof icons]}
          <span className="font-bold text-white uppercase tracking-wider">{title}</span>
          {isRealTime && (
            <Badge className="h-4 px-1.5 bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[8px] font-black tracking-widest">
              BROADCAST
            </Badge>
          )}
        </div>
        <span className="text-zinc-500 text-[10px] font-bold uppercase">{time}</span>
      </div>
      <p className="text-zinc-400 text-xs leading-relaxed">{msg}</p>
    </div>
  );
}

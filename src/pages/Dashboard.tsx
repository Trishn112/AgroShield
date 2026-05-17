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
  Radio,
  Plus,
  Trash2,
  CheckCircle,
  X
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
import { 
  getCurrentWeatherByCoords, 
  getForecastByCoords, 
  WeatherResponse, 
  getCurrentAQIByCoords, 
  AirQualityResponse, 
  getAQIDescription,
  calculateCropRiskScore,
  getRiskInfo,
  getSearchSuggestions
} from '@/services/weatherService';
import { toast } from 'sonner';
import { collection, query, onSnapshot, orderBy, limit, addDoc, serverTimestamp, deleteDoc, doc, where } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '@/lib/firebase';
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
  const [tasks, setTasks] = useState<any[]>([]);
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<'Low' | 'Medium' | 'High'>('Medium');

  // Real-time alerts from Firestore
  useEffect(() => {
    let unsubscribe: () => void = () => {};
    let unsubscribeTasks: () => void = () => {};

    const setupListener = (uid: string) => {
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
        handleFirestoreError(err, OperationType.GET, 'alerts');
      });

      // Tasks listener
      const qTasks = query(
        collection(db, 'tasks'),
        where('userId', '==', uid),
        orderBy('createdAt', 'desc')
      );

      unsubscribeTasks = onSnapshot(qTasks, (snapshot) => {
        const items = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setTasks(items);
      }, (err) => {
        handleFirestoreError(err, OperationType.GET, 'tasks');
      });
    };

    const authUnsubscribe = onAuthStateChanged(auth, (u) => {
      if (u) {
        setupListener(u.uid);
      } else {
        unsubscribe();
        unsubscribeTasks();
        setFirestoreAlerts([]);
        setTasks([]);
      }
    });

    return () => {
      authUnsubscribe();
      unsubscribe();
      unsubscribeTasks();
    };
  }, []);

  const handleAddTask = async () => {
    if (!newTaskTitle.trim()) {
      toast.error("Task title cannot be empty");
      return;
    }
    if (!auth.currentUser) return;

    try {
      await addDoc(collection(db, 'tasks'), {
        userId: auth.currentUser.uid,
        title: newTaskTitle,
        priority: newTaskPriority,
        completed: false,
        createdAt: serverTimestamp()
      });
      setNewTaskTitle('');
      setIsAddingTask(false);
      toast.success("Task added to queue");
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'tasks');
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await deleteDoc(doc(db, 'tasks', taskId));
      toast.success("Task decommissioned");
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, 'tasks');
    }
  };

  const dynamicAlerts = useMemo(() => {
    const alerts: Alert[] = [];
    if (!weather) return alerts;

    if (weather.main.temp > 35) {
      alerts.push({
        type: 'critical',
        title: t('alert.heatwave'),
        msg: t('alert.heatwaveMsg'),
        time: 'Live'
      });
    }

    if (weather.wind.speed > 50) {
      alerts.push({
        type: 'critical',
        title: t('alert.winds'),
        msg: t('alert.windsMsg'),
        time: 'Live'
      });
    }

    if (weather.main.temp > 40) {
      alerts.push({
        type: 'critical',
        title: t('alert.extremeHeat'),
        msg: t('alert.extremeHeatMsg'),
        time: 'Live'
      });
    } else if (weather.main.temp < 5) {
      alerts.push({
        type: 'warning',
        title: t('alert.frost'),
        msg: t('alert.frostMsg'),
        time: 'Live'
      });
    }

    if (weather.main.humidity > 90) {
      alerts.push({
        type: 'warning',
        title: t('alert.pathogen'),
        msg: t('alert.pathogenMsg'),
        time: 'Live'
      });
    }

    if (aqi && aqi.data.aqi > 150) {
      alerts.push({
        type: 'critical',
        title: t('alert.atmosphericCrisis'),
        msg: t('alert.atmosphericCrisisMsg'),
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
          title: t('alert.systemNominal'), 
          msg: t('alert.systemNominalMsg'), 
          time: 'Synced' 
        }
      ] as Alert[];
    }
    return base;
  }, [dynamicAlerts, firestoreAlerts]);

  const [citySearch, setCitySearch] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [isLocating, setIsLocating] = useState(false);

  const riskScore = useMemo(() => {
    if (!weather) return 22;
    return calculateCropRiskScore(weather, aqi);
  }, [weather, aqi]);

  const riskInfo = getRiskInfo(riskScore);

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
        hum: f.main.humidity
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
      setIsLocating(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setIsLocating(false);
          fetchStats(pos.coords.latitude, pos.coords.longitude);
        },
        (err) => {
          setIsLocating(false);
          fetchStats(defaultLat, defaultLon);
          if (err.code === 1) {
            toast.info("Location access denied. Using New Delhi (Default).");
          } else {
            toast.info("Location error. Using New Delhi.");
          }
        },
        { timeout: 15000, enableHighAccuracy: true }
      );
    } else {
      fetchStats(defaultLat, defaultLon);
    }
  }, []);

  const handleSearchChange = async (val: string) => {
    setCitySearch(val);
    if (val.length >= 2) {
      const found = await getSearchSuggestions(val);
      setSuggestions(found);
    } else {
      setSuggestions([]);
    }
  };

  const precipitation = useMemo(() => {
    if (!weather) return '0%';
    const rain = weather.rain?.['1h'] || weather.rain?.['3h'] || 0;
    const snow = weather.snow?.['1h'] || weather.snow?.['3h'] || 0;
    if (rain > 0) return `${rain}mm/h`;
    if (snow > 0) return `${snow}mm/h`;
    return `${weather.clouds.all}%`; // Cloud coverage as proxy
  }, [weather]);

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
                  {t('common.actionRequired')}
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
                {t('common.lastSync')}: {lastRefreshed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="relative group flex-1 md:flex-initial min-w-[240px]">
              <input 
                type="text"
                value={citySearch}
                onChange={(e) => handleSearchChange(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchStatsByCity(citySearch)}
                placeholder={t('common.searchSector')}
                className="w-full bg-zinc-900 border border-white/5 rounded-full px-5 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50 transition-all pl-10"
              />
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
              
              {suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-zinc-900 border border-white/10 rounded-2xl overflow-hidden z-[60] shadow-2xl">
                  {suggestions.map((s, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setCitySearch(s.name);
                        fetchStatsByCity(s.name);
                        setSuggestions([]);
                      }}
                      className="w-full px-4 py-3 text-left text-sm text-zinc-300 hover:bg-white/5 hover:text-white transition-colors flex items-center gap-3"
                    >
                      <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                      <div>
                        <div className="font-bold">{s.name}</div>
                        <div className="text-[10px] text-zinc-500 uppercase tracking-widest">{s.region}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              <button 
                onClick={() => fetchStatsByCity(citySearch)}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/5 hover:bg-white/10 p-1.5 rounded-full transition-colors"
                title="Search city"
              >
                <ArrowUpRight className="w-3.5 h-3.5 text-zinc-400" />
              </button>
            </div>
            
            <Badge variant="outline" className={`border-emerald-500/20 px-4 py-2 font-black tracking-widest text-[10px] uppercase transition-colors ${isLocating ? 'bg-blue-500/10 text-blue-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
              {isLocating ? t('dash.locating') : t('dash.systemsOptimal')}
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
            desc={t('dash.solarIrradiance')}
          />
          <StatCard 
            title={t('weather.humidity')} 
            value={weather ? `${weather.main.humidity}%` : '--'} 
            icon={<Droplets className="w-5 h-5" />} 
            trend="Live"
            color="text-blue-400"
            desc={t('dash.soilEvap')}
          />
          <StatCard 
            title={t('dash.airQuality')} 
            value={aqi ? getAQIDescription(aqi).score.toString() : '--'} 
            icon={<Wind className="w-5 h-5" />} 
            trend={aqi ? getAQIDescription(aqi).label : '--'}
            color={aqi ? getAQIDescription(aqi).color : 'text-zinc-400'}
            desc={aqi ? `${getAQIDescription(aqi).desc} • PM2.5: ${getAQIDescription(aqi).pm25}µg/m³` : t('dash.telemetryMissing')}
          />
          <StatCard 
            title={t('dash.precip')} 
            value={precipitation} 
            icon={<Cloud className="w-5 h-5" />} 
            trend={weather?.rain ? 'Active Rain' : 'Cloud Cover'}
            color="text-zinc-400"
            desc={weather?.rain ? 'Precipitation detected' : 'Satellite cloud imagery'}
          />
        </div>

        {/* Main Charts Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 bg-zinc-900 border-white/5 overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-white">{t('dash.planetaryResourceFlow')}</CardTitle>
                <CardDescription className="text-zinc-500">{t('dash.multispectralTelemetry')}</CardDescription>
              </div>
              <div className="flex gap-2">
                 <Badge className="bg-emerald-500/20 text-emerald-500 border-emerald-500/10">Temperature Flow</Badge>
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-zinc-900 border-white/5 p-6">
             <div className="flex items-center justify-between mb-4">
               <h3 className="text-white font-semibold">{t('dash.risk')}</h3>
               <ArrowUpRight className="w-4 h-4 text-zinc-500" />
             </div>
             <div className="flex items-end gap-3 mb-6">
               <span className={`text-5xl font-black ${riskInfo.color}`}>{riskScore}</span>
               <span className="text-zinc-500 text-sm mb-1 uppercase tracking-widest font-semibold">/ 100</span>
             </div>
             <div className="w-full bg-zinc-800 h-2 rounded-full mb-4 overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${riskScore}%` }}
                  transition={{ duration: 1 }}
                  className={`${riskInfo.bg} h-full`}
                ></motion.div>
             </div>
             <p className="text-zinc-500 text-xs leading-relaxed">System state: {riskInfo.label}. {riskInfo.desc}</p>
          </Card>

          <Card className="bg-zinc-900 border-white/5 p-6 space-y-4">
             <div className="flex items-center justify-between">
               <h3 className="text-white font-semibold">{t('dash.tasks')}</h3>
               <button 
                onClick={() => setIsAddingTask(!isAddingTask)}
                className="p-1.5 bg-white/5 hover:bg-emerald-500/20 text-zinc-400 hover:text-emerald-500 rounded-lg transition-all"
               >
                 {isAddingTask ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
               </button>
             </div>

             <AnimatePresence>
               {isAddingTask && (
                 <motion.div 
                   initial={{ height: 0, opacity: 0 }}
                   animate={{ height: 'auto', opacity: 1 }}
                   exit={{ height: 0, opacity: 0 }}
                   className="overflow-hidden space-y-3 pb-2"
                 >
                   <input 
                     type="text"
                     value={newTaskTitle}
                     onChange={(e) => setNewTaskTitle(e.target.value)}
                     placeholder="Mission Objective..."
                     className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500/50"
                     onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
                   />
                   <div className="flex gap-2">
                     {(['Low', 'Medium', 'High'] as const).map(p => (
                       <button
                         key={p}
                         onClick={() => setNewTaskPriority(p)}
                         className={`flex-1 py-2 rounded-lg text-[10px] font-black tracking-widest uppercase transition-all border ${
                           newTaskPriority === p 
                            ? (p === 'High' ? 'bg-orange-500/10 border-orange-500 text-orange-500' : 
                               p === 'Medium' ? 'bg-blue-500/10 border-blue-500 text-blue-500' : 
                               'bg-zinc-500/10 border-zinc-500 text-zinc-400')
                            : 'bg-white/5 border-white/5 text-zinc-600 hover:bg-white/10'
                         }`}
                       >
                         {p}
                       </button>
                     ))}
                   </div>
                   <Button 
                     onClick={handleAddTask}
                     className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase text-[11px] tracking-widest rounded-xl h-11"
                   >
                     Submit Task
                   </Button>
                 </motion.div>
               )}
             </AnimatePresence>

             <div className="space-y-3 max-h-[280px] overflow-y-auto custom-scrollbar pr-1">
               {tasks.length === 0 ? (
                 <div className="py-10 text-center space-y-2">
                   <div className="text-zinc-700 font-bold uppercase text-[10px] tracking-[0.2em]">{t('dash.noTasks') || 'No Tasks Queued'}</div>
                   <p className="text-zinc-600 text-xs">Awaiting new directives.</p>
                 </div>
               ) : (
                 <AnimatePresence mode="popLayout">
                   {tasks.map((t, i) => (
                     <motion.div 
                        key={t.id} 
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 group hover:border-white/10 transition-all"
                      >
                       <div className="flex items-center gap-3">
                        <button 
                          onClick={() => handleDeleteTask(t.id)}
                          className="w-5 h-5 rounded-full border border-zinc-700 flex items-center justify-center hover:border-emerald-500 hover:bg-emerald-500/10 group/btn transition-all"
                        >
                          <CheckCircle className="w-3 h-3 text-transparent group-hover/btn:text-emerald-500" />
                        </button>
                        <span className="text-zinc-300 text-sm font-medium">{t.title}</span>
                       </div>
                       <div className="flex items-center gap-3">
                        <span className={`text-[10px] font-black uppercase tracking-widest ${
                          t.priority === 'High' ? 'text-orange-500' : 
                          t.priority === 'Medium' ? 'text-blue-400' : 
                          'text-zinc-600'
                        }`}>
                          {t.priority}
                        </span>
                        <button 
                          onClick={() => handleDeleteTask(t.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:text-rose-500"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                       </div>
                     </motion.div>
                   ))}
                 </AnimatePresence>
               )}
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

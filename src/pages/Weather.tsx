import * as React from 'react';
import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Cloud, Sun, CloudRain, Wind, Thermometer, Droplets, MapPin, Search, Calendar, Zap, AlertTriangle, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/lib/languageStore';
import { getCurrentWeatherByCity, getCurrentWeatherByCoords, getForecastByCoords, WeatherResponse, getCurrentAQIByCoords, AirQualityResponse, getAQIDescription } from '@/services/weatherService';
import { toast } from 'sonner';

export default function Weather() {
  const { t } = useLanguage();
  const [city, setCity] = useState('');
  const [weather, setWeather] = useState<WeatherResponse | null>(null);
  const [aqi, setAqi] = useState<AirQualityResponse | null>(null);
  const [forecastData, setForecastData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [alerts, setAlerts] = useState<any[]>([]);

  const generateAlerts = (weather: WeatherResponse) => {
    const newAlerts = [];
    const temp = Math.round(weather.main.temp);
    const humidity = weather.main.humidity;

    if (temp > 35) {
      newAlerts.push({ title: 'Heat Advisory', msg: `Critical heat detected (${temp}°C). Hydrate crops.` });
    } else if (temp < 5) {
      newAlerts.push({ title: 'Frost Alert', msg: `Sub-optimal thermals (${temp}°C). Frost protection required.` });
    } else {
      newAlerts.push({ title: 'Thermal Nominal', msg: `Stable thermals for ${weather.name}.` });
    }

    if (humidity > 80) {
      newAlerts.push({ title: 'Humidity Peak', msg: `High moisture level (${humidity}%). Monitor for fungus.` });
    } else if (humidity < 30) {
      newAlerts.push({ title: 'Aridity High', msg: `Low humidity (${humidity}%). Increase irrigation frequency.` });
    } else {
      newAlerts.push({ title: 'Hydration Ideal', msg: `Optimal humidity index for growth.` });
    }

    setAlerts(newAlerts);
  };

  const fetchByCoords = async (lat: number, lon: number) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getCurrentWeatherByCoords(lat, lon);
      const forecast = await getForecastByCoords(lat, lon);
      const aqiData = await getCurrentAQIByCoords(lat, lon);
      
      setWeather(data);
      setAqi(aqiData);
      setCity(data.name);
      generateAlerts(data);
      
      // Simplify forecast...
      const daily = forecast.list.filter((_: any, i: number) => i % 8 === 0).map((f: any) => ({
        day: new Date(f.dt * 1000).toLocaleDateString('en-US', { weekday: 'short' }),
        temp: Math.round(f.main.temp),
        high: Math.round(f.main.temp_max),
        low: Math.round(f.main.temp_min),
        cond: f.weather[0].main,
        icon: getIcon(f.weather[0].main)
      }));
      setForecastData(daily);
    } catch (error: any) {
      console.error(error);
      const msg = error.message || "Failed to fetch weather data";
      setError(msg);
      if (msg.includes("API Key")) {
        toast.error(t('common.missingApiKey'));
      } else {
        toast.error("Failed to fetch weather data.");
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchByCity = async () => {
    if (!city) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getCurrentWeatherByCity(city);
      setWeather(data);
      generateAlerts(data);
      if (data.coord) {
        const aqiData = await getCurrentAQIByCoords(data.coord.lat, data.coord.lon);
        setAqi(aqiData);
      }
    } catch (error: any) {
      const msg = error.message || "City not found";
      setError(msg);
      toast.error(msg.includes("API Key") ? t('common.missingApiKey') : "City not found.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const defaultLat = 28.6139; // New Delhi
    const defaultLon = 77.2090;

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => fetchByCoords(pos.coords.latitude, pos.coords.longitude),
        () => {
          fetchByCoords(defaultLat, defaultLon);
          toast.info("Location access denied. Using default.");
        },
        { timeout: 10000 }
      );
    } else {
      fetchByCoords(defaultLat, defaultLon);
    }
  }, []);

  const getIcon = (cond: string) => {
    switch (cond.toLowerCase()) {
      case 'clear': return <Sun className="text-orange-400" />;
      case 'clouds': return <Cloud className="text-zinc-400" />;
      case 'rain': return <CloudRain className="text-blue-400" />;
      case 'thunderstorm': return <Zap className="text-yellow-400" />;
      default: return <Sun className="text-orange-400" />;
    }
  };

  if (loading && !weather) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center space-y-4">
           <RefreshCw className="w-10 h-10 text-emerald-500 animate-spin mx-auto" />
           <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs">Accessing Satellite Feed...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black pt-24 pb-20 px-4">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Search Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10">
              <Cloud className="text-white w-6 h-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white tracking-tight">{t('weather.title')}</h1>
              <p className="text-zinc-500 text-sm flex items-center gap-1"><MapPin className="w-3 h-3" /> {weather?.name || city}</p>
            </div>
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <Input 
                placeholder={t('weather.search')} 
                className="bg-zinc-900 border-white/10 pl-10 h-11 rounded-xl text-white" 
                value={city}
                onChange={(e) => setCity(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchByCity()}
              />
            </div>
            <Button onClick={fetchByCity} variant="outline" className="bg-white/5 border-white/10 text-white h-11 rounded-xl gap-2">
              <Search className="w-4 h-4" />
              {t('common.search')}
            </Button>
          </div>
        </div>

        {/* Main Weather Card */}
        {error?.includes("API Key") && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Card className="bg-orange-500/10 border-orange-500/20 p-8 text-center space-y-4">
              <AlertTriangle className="w-12 h-12 text-orange-500 mx-auto" />
              <h2 className="text-xl font-bold text-white">{t('common.missingApiKey')}</h2>
              <p className="text-zinc-400 max-w-md mx-auto">{t('common.apiKeySetup')}</p>
              <div className="pt-2">
                 <code className="bg-black/40 px-3 py-1 rounded text-orange-400 text-xs">VITE_OPENWEATHER_API_KEY</code>
              </div>
            </Card>
          </motion.div>
        )}

        {weather && !error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="bg-zinc-900 border-white/5 overflow-hidden relative group">
              <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-emerald-500/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
              <CardContent className="p-10 relative z-10 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                 <div className="space-y-6">
                   <div className="flex items-center gap-4">
                     <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 px-3">High Stability</Badge>
                     <span className="text-zinc-500 text-xs font-bold uppercase tracking-widest leading-none">{t('weather.lastUpdated')}: Just Now</span>
                   </div>
                   <div className="flex items-end gap-4">
                     <span className="text-8xl font-black text-white leading-none">{Math.round(weather.main.temp)}°</span>
                     <div className="mb-2">
                       <div className="text-3xl font-bold text-white capitalize">{weather.weather[0].description}</div>
                       <div className="text-zinc-500 flex items-center gap-1">{t('weather.feelsLike')} {Math.round(weather.main.feels_like)}°</div>
                     </div>
                   </div>
                   <div className="flex gap-8 text-zinc-400">
                     <div className="flex flex-col">
                       <span className="text-[10px] uppercase font-black tracking-widest text-zinc-600 mb-1">{t('weather.humidity')}</span>
                       <span className="text-white font-bold flex items-center gap-1 text-xl"><Droplets className="w-4 h-4 text-blue-400" /> {weather.main.humidity}%</span>
                     </div>
                     <div className="flex flex-col">
                       <span className="text-[10px] uppercase font-black tracking-widest text-zinc-600 mb-1">{t('weather.wind')}</span>
                       <span className="text-white font-bold flex items-center gap-1 text-xl"><Wind className="w-4 h-4 text-emerald-400" /> {weather.wind.speed}km/h</span>
                     </div>
                     <div className="flex flex-col">
                       <span className="text-[10px] uppercase font-black tracking-widest text-zinc-600 mb-1">Air Quality</span>
                       <span className={`font-bold flex items-center gap-1 text-xl ${aqi ? getAQIDescription(aqi.list[0].main.aqi).color : 'text-zinc-400'}`}>
                         <Wind className="w-4 h-4" /> {aqi ? getAQIDescription(aqi.list[0].main.aqi).label : '--'}
                       </span>
                     </div>
                     <div className="flex flex-col">
                       <span className="text-[10px] uppercase font-black tracking-widest text-zinc-600 mb-1">{t('weather.visibility')}</span>
                       <span className="text-white font-bold flex items-center gap-1 text-xl"><Search className="w-4 h-4 text-orange-400" /> {weather.visibility / 1000}km</span>
                     </div>
                   </div>
                 </div>

                  <div className="space-y-4">
                    {alerts.map((alert, idx) => (
                      <div key={idx} className="p-6 bg-white/5 rounded-3xl border border-white/5 flex items-center gap-6 group hover:bg-white/10 transition-colors">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${idx === 0 ? 'bg-orange-500/20' : 'bg-blue-500/20'}`}>
                          {idx === 0 ? <Thermometer className="text-orange-500 w-8 h-8" /> : <Droplets className="text-blue-500 w-8 h-8" />}
                        </div>
                        <div>
                          <h4 className="text-white font-bold">{alert.title}</h4>
                          <p className="text-zinc-500 text-sm">{alert.msg}</p>
                        </div>
                      </div>
                    ))}
                  </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* 7-Day Forecast */}
        {forecastData.length > 0 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-emerald-500" />
              {t('weather.forecast')}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
              {forecastData.map((f, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-zinc-900 border border-white/5 p-6 rounded-3xl text-center hover:bg-zinc-800 transition-colors group cursor-default"
                >
                  <div className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-4 group-hover:text-emerald-400 transition-colors">{f.day}</div>
                  <div className="w-12 h-12 mx-auto mb-4 bg-white/5 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    {f.icon}
                  </div>
                  <div className="text-2xl font-black text-white mb-1">{f.temp}°</div>
                  <div className="flex justify-center gap-3 text-[10px] font-bold">
                    <span className="text-orange-500">H: {f.high}°</span>
                    <span className="text-blue-400">L: {f.low}°</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


function ArrowUpRight(props: any) {
    return (
      <svg
        {...props}
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M7 7h10v10" />
        <path d="M7 17 17 7" />
      </svg>
    )
  }

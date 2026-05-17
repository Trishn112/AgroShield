import axios, { AxiosError } from 'axios';

const API_KEY = (import.meta as any).env.VITE_WEATHERAPI_KEY;
const WAQI_TOKEN = (import.meta as any).env.VITE_WAQI_API_TOKEN;
const BASE_URL = 'https://api.weatherapi.com/v1';
const WAQI_URL = 'https://api.waqi.info';

const handleApiError = (err: unknown) => {
  if (axios.isAxiosError(err)) {
    const axiosError = err as AxiosError;
    if (axiosError.response?.status === 401) {
      throw new Error("Invalid API Key. Please check your VITE_WEATHERAPI_KEY or VITE_WAQI_API_TOKEN in the settings.");
    }
  }
  throw err;
};

const checkApiKey = () => {
  if (!API_KEY || API_KEY === 'YOUR_WEATHERAPI_KEY' || API_KEY === 'undefined') {
    throw new Error("Missing WeatherAPI Key. Please add VITE_WEATHERAPI_KEY to your secrets.");
  }
};

const checkWaqiToken = () => {
  if (!WAQI_TOKEN || WAQI_TOKEN === 'YOUR_WAQI_TOKEN' || WAQI_TOKEN === 'undefined') {
    throw new Error("Missing WAQI API Token. Please add VITE_WAQI_API_TOKEN to your secrets.");
  }
};

export interface WeatherResponse {
  name: string;
  coord: {
    lat: number;
    lon: number;
  };
  main: {
    temp: number;
    humidity: number;
    feels_like: number;
    temp_max: number;
    temp_min: number;
  };
  rain?: {
    '1h'?: number;
    '3h'?: number;
  };
  snow?: {
    '1h'?: number;
    '3h'?: number;
  };
  wind: {
    speed: number;
  };
  clouds: {
    all: number;
  };
  weather: Array<{
    main: string;
    description: string;
    icon: string;
  }>;
  visibility: number;
}

export const GLOBAL_HUBS = [
  { name: 'Mumbai', lat: 19.0760, lon: 72.8777, region: 'India' },
  { name: 'Delhi', lat: 28.6139, lon: 77.2090, region: 'India' },
  { name: 'Bangalore', lat: 12.9716, lon: 77.5946, region: 'India' },
  { name: 'Hyderabad', lat: 17.3850, lon: 78.4867, region: 'India' },
  { name: 'Ahmedabad', lat: 23.0225, lon: 72.5714, region: 'India' },
  { name: 'Chennai', lat: 13.0827, lon: 80.2707, region: 'India' },
  { name: 'Kolkata', lat: 22.5726, lon: 88.3639, region: 'India' },
  { name: 'Pune', lat: 18.5204, lon: 73.8567, region: 'India' },
  { name: 'Jaipur', lat: 26.9124, lon: 75.7873, region: 'India' },
  { name: 'Lucknow', lat: 26.8467, lon: 80.9462, region: 'India' },
  { name: 'Surat', lat: 21.1702, lon: 72.8311, region: 'India' },
  { name: 'Patna', lat: 25.5941, lon: 85.1376, region: 'India' },
  { name: 'Bhopal', lat: 23.2599, lon: 77.4126, region: 'India' },
  { name: 'Ludhiana', lat: 30.9010, lon: 75.8573, region: 'India' },
  { name: 'Agra', lat: 27.1767, lon: 78.0081, region: 'India' },
  { name: 'Varanasi', lat: 25.3176, lon: 82.9739, region: 'India' },
  { name: 'Amritsar', lat: 31.6340, lon: 74.8723, region: 'India' },
  { name: 'Ranchi', lat: 23.3441, lon: 85.3094, region: 'India' },
  { name: 'Guwahati', lat: 26.1158, lon: 91.7086, region: 'India' },
  { name: 'Chandigarh', lat: 30.7333, lon: 76.7794, region: 'India' },
  { name: 'Bhubaneswar', lat: 20.2961, lon: 85.8245, region: 'India' },
  { name: 'Thiruvananthapuram', lat: 8.5241, lon: 76.9366, region: 'India' },
  { name: 'Chicago', lat: 41.8781, lon: -87.6298, region: 'North America' },
  { name: 'London', lat: 51.5074, lon: -0.1278, region: 'Europe' },
  { name: 'Tokyo', lat: 35.6762, lon: 139.6503, region: 'Asia' },
  { name: 'Paris', lat: 48.8566, lon: 2.3522, region: 'Europe' }
];

export const getThreatLevel = (w: WeatherResponse) => {
  const temp = w.main.temp;
  const wind = w.wind.speed;
  const condition = w.weather[0].main.toLowerCase();

  if (condition.includes('storm') || condition.includes('cyclone') || wind > 25 || temp > 42) return 'Critical';
  if (condition.includes('rain') || condition.includes('drizzle') || wind > 15 || temp > 38 || temp < 0) return 'High';
  if (condition.includes('cloud') || temp > 32 || w.main.humidity > 80) return 'Medium';
  return 'Low';
};

export const getCurrentWeatherByCoords = async (lat: number, lon: number): Promise<WeatherResponse> => {
  checkApiKey();
  try {
    const response = await axios.get(`${BASE_URL}/current.json`, {
      params: {
        key: API_KEY,
        q: `${lat},${lon}`,
      }
    });
    
    const data = response.data;
    return {
      name: data.location.name,
      coord: { lat: data.location.lat, lon: data.location.lon },
      main: {
        temp: data.current.temp_c,
        humidity: data.current.humidity,
        feels_like: data.current.feelslike_c,
        temp_max: data.current.temp_c, // Current endpoint doesn't give min/max
        temp_min: data.current.temp_c
      },
      wind: { speed: data.current.wind_kph },
      clouds: { all: data.current.cloud },
      weather: [{
        main: data.current.condition.text,
        description: data.current.condition.text,
        icon: data.current.condition.icon
      }],
      visibility: data.current.vis_km * 1000
    };
  } catch (err) {
    return handleApiError(err);
  }
};

export const getCurrentWeatherByCity = async (city: string): Promise<WeatherResponse> => {
  checkApiKey();
  try {
    const response = await axios.get(`${BASE_URL}/current.json`, {
      params: {
        key: API_KEY,
        q: city,
      }
    });

    const data = response.data;
    return {
      name: data.location.name,
      coord: { lat: data.location.lat, lon: data.location.lon },
      main: {
        temp: data.current.temp_c,
        humidity: data.current.humidity,
        feels_like: data.current.feelslike_c,
        temp_max: data.current.temp_c,
        temp_min: data.current.temp_c
      },
      wind: { speed: data.current.wind_kph },
      clouds: { all: data.current.cloud },
      weather: [{
        main: data.current.condition.text,
        description: data.current.condition.text,
        icon: data.current.condition.icon
      }],
      visibility: data.current.vis_km * 1000
    };
  } catch (err) {
    return handleApiError(err);
  }
};

export const getForecastByCoords = async (lat: number, lon: number) => {
  checkApiKey();
  try {
    const response = await axios.get(`${BASE_URL}/forecast.json`, {
      params: {
        key: API_KEY,
        q: `${lat},${lon}`,
        days: 5,
      }
    });

    // Map WeatherAPI forecast to OpenWeather-like structure used in Dashboard/Charts
    const data = response.data;
    return {
      list: data.forecast.forecastday[0].hour.map((h: any) => ({
        dt: h.time_epoch,
        main: {
          temp: h.temp_c,
          humidity: h.humidity
        },
        weather: [{ main: h.condition.text, icon: h.condition.icon }]
      }))
    };
  } catch (err) {
    return handleApiError(err);
  }
};

export interface AirQualityResponse {
  data: {
    aqi: number;
    idx: number;
    iaqi: {
      pm25?: { v: number };
      pm10?: { v: number };
      o3?: { v: number };
      no2?: { v: number };
      so2?: { v: number };
      co?: { v: number };
    };
    city: {
      name: string;
      geo: [number, number];
    };
    time: {
      s: string;
    };
  };
}

export const getCurrentAQIByCoords = async (lat: number, lon: number): Promise<AirQualityResponse> => {
  checkWaqiToken();
  try {
    const response = await axios.get(`${WAQI_URL}/feed/geo:${lat};${lon}/`, {
      params: {
        token: WAQI_TOKEN,
      }
    });
    
    if (response.data.status !== 'ok') {
      throw new Error(`WAQI API Error: ${response.data.data || 'Unknown error'}`);
    }
    
    return response.data;
  } catch (err) {
    return handleApiError(err);
  }
};

export const getSearchSuggestions = async (query: string) => {
  if (!query || query.length < 2) return [];
  const normalized = query.toLowerCase();
  
  // Local filtering first
  const local = GLOBAL_HUBS.filter(hub => 
    hub.name.toLowerCase().includes(normalized) || 
    hub.region.toLowerCase().includes(normalized)
  ).slice(0, 5);

  if (local.length >= 3) return local;

  // Fallback to Geocoding API for "All Indian Cities" (and more)
  try {
    const response = await axios.get(`${BASE_URL}/search.json`, {
      params: {
        key: API_KEY,
        q: query
      }
    });
    
    const apiResults = response.data.map((item: any) => ({
      name: item.name,
      lat: item.lat,
      lon: item.lon,
      region: item.region || item.country
    }));

    // Merge and deduplicate
    const combined = [...local];
    apiResults.forEach((res: any) => {
      if (!combined.find(c => c.name.toLowerCase() === res.name.toLowerCase())) {
        combined.push(res);
      }
    });
    
    return combined.slice(0, 5);
  } catch (err) {
    return local;
  }
};
export const getAQIDescription = (aqiResponse: AirQualityResponse) => {
  const aqiv = aqiResponse.data.aqi;
  const pm25 = aqiResponse.data.iaqi.pm25?.v || 0;
  
  // Mapping WAQI to our UI tiers
  if (aqiv <= 50) return { label: 'Good', color: 'text-emerald-400', desc: 'Minimal health risk', score: aqiv, pm25 };
  if (aqiv <= 100) return { label: 'Moderate', color: 'text-yellow-400', desc: 'Minor pollutants', score: aqiv, pm25 };
  if (aqiv <= 150) return { label: 'Sensitive', color: 'text-orange-400', desc: 'Monitor sensitive crops', score: aqiv, pm25 };
  if (aqiv <= 200) return { label: 'Unhealthy', color: 'text-red-400', desc: 'Health warning', score: aqiv, pm25 };
  if (aqiv <= 300) return { label: 'Very Poor', color: 'text-purple-600', desc: 'Severe Hazard', score: aqiv, pm25 };
  return { label: 'Hazardous', color: 'text-rose-700', desc: 'Extreme Hazard', score: aqiv, pm25 };
};

export const calculateCropRiskScore = (weather: WeatherResponse, aqi?: AirQualityResponse) => {
  let score = 100; // Start with perfect score
  
  // Temperature Impact
  const temp = weather.main.temp;
  if (temp > 40 || temp < 0) score -= 40;
  else if (temp > 35 || temp < 5) score -= 20;
  else if (temp > 30 || temp < 10) score -= 10;

  // Humidity Impact (Pest/Fungus Risk)
  const humidity = weather.main.humidity;
  if (humidity > 90 || humidity < 15) score -= 25;
  else if (humidity > 80 || humidity < 25) score -= 10;

  // Wind Impact
  const wind = weather.wind.speed;
  if (wind > 30) score -= 30;
  else if (wind > 20) score -= 15;

  // AQI Impact (WAQI scale)
  if (aqi) {
    const aqiv = aqi.data.aqi;
    if (aqiv > 200) score -= 30;
    else if (aqiv > 150) score -= 20;
    else if (aqiv > 100) score -= 10;
  }

  // Ensure bounds
  return Math.max(0, Math.min(100, score));
};

export const getRiskInfo = (score: number) => {
  if (score >= 80) return { label: 'Optimum', color: 'text-emerald-500', bg: 'bg-emerald-500', desc: 'Perfect conditions for growth.' };
  if (score >= 60) return { label: 'Nominal', color: 'text-blue-400', bg: 'bg-blue-400', desc: 'Stable environment detected.' };
  if (score >= 40) return { label: 'Caution', color: 'text-yellow-500', bg: 'bg-yellow-500', desc: 'Monitor anomalies closely.' };
  return { label: 'High Risk', color: 'text-orange-500', bg: 'bg-orange-500', desc: 'Systemic biological stress detected.' };
};

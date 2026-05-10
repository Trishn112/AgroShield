import axios, { AxiosError } from 'axios';

const API_KEY = (import.meta as any).env.VITE_OPENWEATHER_API_KEY;
const BASE_URL = 'https://api.openweathermap.org/data/2.5';

const handleApiError = (err: unknown) => {
  if (axios.isAxiosError(err)) {
    const axiosError = err as AxiosError;
    if (axiosError.response?.status === 401) {
      throw new Error("Invalid OpenWeather API Key. Please check your VITE_OPENWEATHER_API_KEY in the settings.");
    }
  }
  throw err;
};

const checkApiKey = () => {
  if (!API_KEY || API_KEY === 'YOUR_API_KEY' || API_KEY === 'undefined') {
    throw new Error("Missing OpenWeather API Key. Please add VITE_OPENWEATHER_API_KEY to your secrets.");
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
  { name: 'New Delhi', lat: 28.6139, lon: 77.2090, region: 'Asia' },
  { name: 'Chicago', lat: 41.8781, lon: -87.6298, region: 'North America' },
  { name: 'Sao Paulo', lat: -23.5505, lon: -46.6333, region: 'South America' },
  { name: 'Nairobi', lat: -1.2921, lon: 36.8219, region: 'Africa' },
  { name: 'Paris', lat: 48.8566, lon: 2.3522, region: 'Europe' },
  { name: 'Sydney', lat: -33.8688, lon: 151.2093, region: 'Oceania' },
  { name: 'Beijing', lat: 39.9042, lon: 116.4074, region: 'Asia' },
  { name: 'Cairo', lat: 30.0444, lon: 31.2357, region: 'Africa' },
  { name: 'Buenos Aires', lat: -34.6037, lon: -58.3816, region: 'South America' },
  { name: 'Bangkok', lat: 13.7563, lon: 100.5018, region: 'Asia' },
  { name: 'Kiev', lat: 50.4501, lon: 30.5234, region: 'Europe' },
  { name: 'St. Louis', lat: 38.6270, lon: -90.1994, region: 'North America' },
  { name: 'Tokyo', lat: 35.6762, lon: 139.6503, region: 'Asia' },
  { name: 'Moscow', lat: 55.7558, lon: 37.6173, region: 'Europe' },
  { name: 'London', lat: 51.5074, lon: -0.1278, region: 'Europe' }
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
    const response = await axios.get(`${BASE_URL}/weather`, {
      params: {
        lat,
        lon,
        appid: API_KEY,
        units: 'metric',
      }
    });
    return response.data;
  } catch (err) {
    return handleApiError(err);
  }
};

export const getCurrentWeatherByCity = async (city: string): Promise<WeatherResponse> => {
  checkApiKey();
  try {
    const response = await axios.get(`${BASE_URL}/weather`, {
      params: {
        q: city,
        appid: API_KEY,
        units: 'metric',
      }
    });
    return response.data;
  } catch (err) {
    return handleApiError(err);
  }
};

export const getForecastByCoords = async (lat: number, lon: number) => {
  checkApiKey();
  try {
    const response = await axios.get(`${BASE_URL}/forecast`, {
      params: {
        lat,
        lon,
        appid: API_KEY,
        units: 'metric',
      }
    });
    return response.data;
  } catch (err) {
    return handleApiError(err);
  }
};

export interface AirQualityResponse {
  list: Array<{
    main: {
      aqi: number;
    };
    components: {
      co: number;
      no: number;
      no2: number;
      o3: number;
      so2: number;
      pm2_5: number;
      pm10: number;
      nh3: number;
    };
    dt: number;
  }>;
}

export const getCurrentAQIByCoords = async (lat: number, lon: number): Promise<AirQualityResponse> => {
  checkApiKey();
  try {
    const response = await axios.get(`${BASE_URL}/air_pollution`, {
      params: {
        lat,
        lon,
        appid: API_KEY,
      }
    });
    return response.data;
  } catch (err) {
    return handleApiError(err);
  }
};

export const getAQIDescription = (aqi: number) => {
  switch (aqi) {
    case 1: return { label: 'Good', color: 'text-emerald-400', desc: 'Aerosol levels stable' };
    case 2: return { label: 'Fair', color: 'text-yellow-400', desc: 'Slight ozone elevation' };
    case 3: return { label: 'Moderate', color: 'text-orange-400', desc: 'Particulate matter detected' };
    case 4: return { label: 'Poor', color: 'text-red-400', desc: 'Health caution advised' };
    case 5: return { label: 'Very Poor', color: 'text-purple-600', desc: 'Extreme aerosol density' };
    default: return { label: 'Unknown', color: 'text-zinc-400', desc: 'Telemetry missing' };
  }
};

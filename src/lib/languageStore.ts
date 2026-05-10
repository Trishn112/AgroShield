import { create } from 'zustand';

type Language = 'en' | 'hi';

interface LanguageState {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations = {
  en: {
    // Navbar
    'nav.dashboard': 'Dashboard',
    'nav.crop': 'Crop Analysis',
    'nav.weather': 'Weather',
    'nav.irrigation': 'Irrigation',
    'nav.marketplace': 'Marketplace',
    'nav.admin': 'Admin',
    'nav.profile': 'Profile',
    'nav.getStarted': 'Get Started',
    'nav.signOut': 'Sign Out',
    'nav.switchLanguage': 'Switch to Hindi',
    
    // Generic
    'common.search': 'Search',
    'common.loading': 'Loading...',
    'common.error': 'Error Occurred',
    'common.missingApiKey': 'Missing Weather API Key',
    'common.apiKeySetup': 'Please enter a valid OpenWeather API key in the settings panel to enable weather intelligence.',
    
    // Weather
    'weather.title': 'Weather Intelligence',
    'weather.search': 'Search city...',
    'weather.lastUpdated': 'Last Updated',
    'weather.feelsLike': 'Feels like',
    'weather.humidity': 'Humidity',
    'weather.wind': 'Wind Speed',
    'weather.visibility': 'Visibility',
    'weather.forecast': 'Extended Forecast',
    'weather.advisory': 'Heat Stress Advisory',
    'weather.opportunity': 'Irrigation Opportunity',
    
    // Dashboard
    'dash.title': 'Environmental Intel',
    'dash.systemsOptimal': 'Systems Optimal',
    'dash.refresh': 'Refresh Data',
    'dash.temp': 'Temperature',
    'dash.airQuality': 'Air Quality',
    'dash.precip': 'Precipitation',
    'dash.risk': 'Crop Risk Score',
    'dash.alerts': 'System Alerts',
    'dash.tasks': 'Upcoming Tasks',
  },
  hi: {
    // Navbar
    'nav.dashboard': 'डैशबोर्ड',
    'nav.crop': 'फसल विश्लेषण',
    'nav.weather': 'मौसम',
    'nav.irrigation': 'सिंचाई',
    'nav.marketplace': 'मार्केटप्लेस',
    'nav.admin': 'प्रशासक',
    'nav.profile': 'प्रोफ़ाइल',
    'nav.getStarted': 'शुरू करें',
    'nav.signOut': 'साइन आउट',
    'nav.switchLanguage': 'अंग्रेजी में स्विच करें',

    // Generic
    'common.search': 'खोजें',
    'common.loading': 'लोड हो रहा है...',
    'common.error': 'त्रुटि हुई',
    'common.missingApiKey': 'मौसम एपीआई कुंजी गायब है',
    'common.apiKeySetup': 'मौसम खुफिया सक्षम करने के लिए कृपया सेटिंग्स पैनल में एक वैध ओपनवेदर एपीआई कुंजी दर्ज करें।',
    
    // Weather
    'weather.title': 'मौसम खुफिया',
    'weather.search': 'शहर खोजें...',
    'weather.lastUpdated': 'पिछली बार अपडेट किया गया',
    'weather.feelsLike': 'जैसा महसूस होता है',
    'weather.humidity': 'नमी',
    'weather.wind': 'हवा की गति',
    'weather.visibility': 'दृश्यता',
    'weather.forecast': 'विस्तारित पूर्वानुमान',
    'weather.advisory': 'गर्मी के तनाव की सलाह',
    'weather.opportunity': 'सिंचाई का अवसर',
    
    // Dashboard
    'dash.title': 'पर्यावरण खुफिया',
    'dash.systemsOptimal': 'सिस्टम इष्टतम',
    'dash.refresh': 'डेटा ताज़ा करें',
    'dash.temp': 'तापमान',
    'dash.airQuality': 'वायु गुणवत्ता',
    'dash.precip': 'वर्षा',
    'dash.risk': 'फसल जोखिम स्कोर',
    'dash.alerts': 'सिस्टम अलर्ट',
    'dash.tasks': 'आगामी कार्य',
  }
};

export const useLanguage = create<LanguageState>((set, get) => ({
  language: 'en',
  setLanguage: (lang) => set({ language: lang }),
  t: (key) => {
    const lang = get().language;
    return (translations[lang] as any)[key] || key;
  }
}));

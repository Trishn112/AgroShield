export type UserRole = 'farmer' | 'consumer' | 'analyst' | 'admin';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  createdAt: string;
}

export interface CropAnalysisRecord {
  id?: string;
  userId: string;
  imageUrl: string;
  disease: string;
  severity: 'low' | 'medium' | 'high';
  treatment: string;
  confidence: number;
  createdAt: string;
}

export interface WeatherData {
  temp: number;
  humidity: number;
  condition: string;
  windSpeed: number;
  location: string;
  forecast: Array<{
    date: string;
    temp: number;
    condition: string;
  }>;
}

export interface Product {
  id?: string;
  farmerId: string;
  name: string;
  price: number;
  unit: string;
  description: string;
  imageUrl: string;
  stock: number;
  createdAt: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

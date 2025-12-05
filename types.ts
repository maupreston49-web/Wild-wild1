export enum Gender {
  Male = 'Male',
  Female = 'Female',
}

export enum ActivityLevel {
  Low = 'Low',
  Moderate = 'Moderate',
  High = 'High',
  Working = 'Working',
}

export interface MedicalCondition {
  id: string;
  name: string;
  impact: 'joint' | 'cardio' | 'anxiety' | 'general';
}

export interface DogProfile {
  id: string; // Unique ID for the dog
  name: string;
  age: number;
  weightKg: number;
  breed: string;
  gender: Gender;
  medicalConditions: string[]; // IDs of MedicalCondition
  
  // AI-Derived Stats
  isBrachycephalic: boolean;
  strideLengthMeters: number; // For step calculation
  energyBaseline: ActivityLevel;
  heatTolerance: number; // 0-10 scale (0 = very sensitive)
}

export interface Coordinate {
  lat: number;
  lng: number;
  timestamp: number;
}

export interface HikeSession {
  isActive: boolean;
  startTime: number;
  durationSeconds: number;
  distanceMiles: number;
  elevationGainFeet: number;
  currentSpeedMph: number;
  path: Coordinate[]; // Real GPS path
  
  // Calculated Bio-Metrics
  dogSteps: number;
  caloriesBurned: number;
  strainIndex: number; // 0-100
  waterNeedOz: number;
}

export interface CompletedHike extends Omit<HikeSession, 'isActive'> {
  id: string;
  dogId: string; // Link to specific dog
  completedAt: number; // Timestamp
  dateStr: string; // ISO Date string for grouping
  aiAnalysis?: string; // Persisted Gemini Analysis
}

export interface Trail {
  id: string;
  name: string;
  distanceMiles: number;
  elevationGainFeet: number;
  difficulty: 'Easy' | 'Moderate' | 'Hard';
  dogAbilityScore: number; // 0-100
  dogAbilityReason: string; // "Great for joints due to soft ground"
  tags: string[]; // "Shaded", "Water Access", "No Burrs"
  hazards: string[];
  uri?: string; // Google Maps Link
}

export interface WeatherData {
  tempF: number;
  condition: string;
  humidity: number;
  realFeelF: number;
}
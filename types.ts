export interface Coordinates {
  lat: number;
  lng: number;
}

export interface TimeParams {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
}

export interface HistoricalEvent {
  id: string;
  title: string;
  coordinates: Coordinates;
  description: string;
  time: TimeParams;
}

export interface TravelResult {
  imageUrl: string | null;
  description: string;
  locationName: string;
  time: TimeParams;
}

export interface GeminiError {
  message: string;
}

// Global augmentation for the AI Studio key selection
declare global {
  interface Window {
    aistudio?: {
      hasSelectedApiKey(): Promise<boolean>;
      openSelectKey(): Promise<void>;
    };
  }
}
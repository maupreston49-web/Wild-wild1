import { useState, useEffect, useRef, useCallback } from 'react';
import { WeatherData, Coordinate } from '../types';
import { getCurrentWeather } from '../services/geminiService';

const DEFAULT_WEATHER: WeatherData = {
  tempF: 70,
  condition: 'Loading...',
  humidity: 50,
  realFeelF: 70,
};

const STORAGE_KEY = 'wildcord_weather_cache';

interface WeatherCache {
  data: WeatherData;
  timestamp: number;
  coords: Coordinate | null;
}

export const useWeather = () => {
  // Initialize state and refs from localStorage to persist across refreshes
  const getCache = (): WeatherCache | null => {
      try {
          const cached = localStorage.getItem(STORAGE_KEY);
          return cached ? JSON.parse(cached) : null;
      } catch { return null; }
  };

  const cache = getCache();

  // Initialize with cached data if available, otherwise default
  const [weather, setWeather] = useState<WeatherData>(cache ? cache.data : DEFAULT_WEATHER);
  
  // Initialize refs from cache so throttling logic works immediately after refresh
  const lastFetchTime = useRef<number>(cache ? cache.timestamp : 0);
  const lastFetchCoords = useRef<Coordinate | null>(cache ? cache.coords : null);

  const fetchWeather = useCallback(async (lat: number, lng: number, force = false) => {
    const now = Date.now();
    // Throttle: Only fetch if 15 mins passed OR moved > 0.07 deg (approx 5 miles) OR forced
    const timeDiff = now - lastFetchTime.current;
    let distDiff = 0;
    
    if (lastFetchCoords.current) {
        distDiff = Math.sqrt(
            Math.pow(lat - lastFetchCoords.current.lat, 2) + 
            Math.pow(lng - lastFetchCoords.current.lng, 2)
        );
    }

    if (force || timeDiff > 15 * 60 * 1000 || distDiff > 0.07 || lastFetchTime.current === 0) {
        try {
            const w = await getCurrentWeather(lat, lng);
            setWeather(w);
            lastFetchTime.current = now;
            lastFetchCoords.current = { lat, lng, timestamp: now };
            
            // Persist to localStorage
            localStorage.setItem(STORAGE_KEY, JSON.stringify({
                data: w,
                timestamp: now,
                coords: { lat, lng, timestamp: now }
            }));
        } catch (err) {
            console.error("Failed to fetch weather", err);
        }
    }
  }, []);

  // Initial fetch on mount
  useEffect(() => {
    if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition((position) => {
            fetchWeather(position.coords.latitude, position.coords.longitude);
        }, (err) => {
            console.warn("Location access denied for weather", err);
        });
    }
  }, [fetchWeather]);

  return { weather, fetchWeather };
};
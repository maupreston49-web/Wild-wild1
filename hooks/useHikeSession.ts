import { useState, useRef, useEffect, useCallback } from 'react';
import { HikeSession, DogProfile, WeatherData, CompletedHike } from '../types';
import { getDistanceFromLatLonInMiles, SimpleKalmanFilter } from '../utils/geo';

export const useHikeSession = (
  profile: DogProfile | null, 
  weather: WeatherData, 
  onHikeComplete: (hike: CompletedHike) => void
) => {
  const [isHikeActive, setIsHikeActive] = useState(false);
  const [gpsError, setGpsError] = useState(false);
  
  const [session, setSession] = useState<HikeSession>({
    isActive: false,
    startTime: 0,
    durationSeconds: 0,
    distanceMiles: 0,
    elevationGainFeet: 0,
    currentSpeedMph: 0,
    dogSteps: 0,
    caloriesBurned: 0,
    strainIndex: 0,
    waterNeedOz: 0,
    path: []
  });

  const timerInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const watchId = useRef<number | null>(null);
  const latFilter = useRef<SimpleKalmanFilter>(new SimpleKalmanFilter());
  const lngFilter = useRef<SimpleKalmanFilter>(new SimpleKalmanFilter());
  const isFirstLocation = useRef(true);

  const startHike = useCallback(() => {
    if (!navigator.geolocation) {
        alert("GPS is not supported on this device.");
        return;
    }

    if (!profile) return;

    setGpsError(false);
    isFirstLocation.current = true;
    
    // Reset Filters
    latFilter.current = new SimpleKalmanFilter(0.0001, 0.00002);
    lngFilter.current = new SimpleKalmanFilter(0.0001, 0.00002);

    setSession({ 
      isActive: true, 
      startTime: Date.now(),
      durationSeconds: 0,
      distanceMiles: 0,
      elevationGainFeet: 0,
      currentSpeedMph: 0,
      dogSteps: 0,
      caloriesBurned: 0,
      strainIndex: 0,
      waterNeedOz: 0,
      path: []
    });
    setIsHikeActive(true);

    // Robust Timer
    timerInterval.current = setInterval(() => {
        setSession(prev => {
             if (!prev.isActive) return prev;
             return {
                ...prev,
                durationSeconds: Math.floor((Date.now() - prev.startTime) / 1000)
            };
        });
    }, 1000);

    // GPS Tracking
    watchId.current = navigator.geolocation.watchPosition(
        (position) => {
            const { latitude, longitude, speed, accuracy } = position.coords;
            const timestamp = position.timestamp;

            // Initialize filters to current location on first fix to avoid jump from 0,0
            if (isFirstLocation.current) {
                latFilter.current.setState(latitude);
                lngFilter.current.setState(longitude);
                isFirstLocation.current = false;
            }

            // Dynamic Noise
            const R = accuracy ? accuracy / 111000 : 0.0001;

            const filteredLat = latFilter.current.filter(latitude, 0, R);
            const filteredLng = lngFilter.current.filter(longitude, 0, R);

            setSession(prev => {
                const newPath = [...prev.path, { lat: filteredLat, lng: filteredLng, timestamp }];
                
                let addedDistance = 0;
                if (prev.path.length > 0) {
                    const lastPoint = prev.path[prev.path.length - 1];
                    addedDistance = getDistanceFromLatLonInMiles(lastPoint.lat, lastPoint.lng, filteredLat, filteredLng);
                    if (addedDistance < 0.0006) addedDistance = 0; // Filter drift
                }

                const newDistance = prev.distanceMiles + addedDistance;
                
                // Bio-Metrics Logic
                const stepsIncrement = (addedDistance * 1609.34) / (profile.strideLengthMeters || 0.5);
                const heatFactor = Math.max(0, (weather.tempF - 65) * (11 - profile.heatTolerance) * 0.05);
                const medicalFactor = profile.medicalConditions.length > 0 ? 1.5 : 1.0;
                const strainIncrement = (addedDistance * 10 * medicalFactor) + (heatFactor * 0.01); 
                const caloriesIncrement = addedDistance * 1.6 * profile.weightKg * 0.75;
                const waterIncrement = addedDistance * (0.5 + (weather.tempF / 100));

                return {
                    ...prev,
                    path: newPath,
                    distanceMiles: newDistance,
                    currentSpeedMph: speed ? speed * 2.237 : 0, 
                    dogSteps: prev.dogSteps + stepsIncrement,
                    strainIndex: Math.min(100, prev.strainIndex + strainIncrement),
                    caloriesBurned: prev.caloriesBurned + caloriesIncrement,
                    waterNeedOz: prev.waterNeedOz + waterIncrement
                };
            });
            setGpsError(false);
        },
        (error) => {
            console.error("GPS Error", error);
            setGpsError(true);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, [profile, weather.tempF]);

  const stopHike = useCallback(() => {
    if (!profile) return;
    
    if (timerInterval.current) clearInterval(timerInterval.current);
    if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current);
    
    // Commit to History
    const { isActive, ...sessionData } = session;
    const completedHike: CompletedHike = {
      ...sessionData,
      id: crypto.randomUUID(),
      dogId: profile.id, // Save which dog this was
      completedAt: Date.now(),
      dateStr: new Date().toISOString()
    };
    
    if (session.durationSeconds > 5 || session.distanceMiles > 0.01) {
      onHikeComplete(completedHike);
    }

    setSession(prev => ({ ...prev, isActive: false }));
    setIsHikeActive(false);
  }, [session, onHikeComplete, profile]);

  // Wake Lock & Background Handling
  useEffect(() => {
    let wakeLock: any = null;
    const requestWakeLock = async () => {
      // @ts-ignore
      if ('wakeLock' in navigator) {
        try {
          // @ts-ignore
          wakeLock = await navigator.wakeLock.request('screen');
        } catch (err) { console.warn(err); }
      }
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && isHikeActive) requestWakeLock();
    };

    if (isHikeActive) {
      requestWakeLock();
      document.addEventListener('visibilitychange', handleVisibility);
      window.onbeforeunload = (e) => { e.preventDefault(); return "Tracking active."; };
    } else {
        if (wakeLock) wakeLock.release().catch(() => {});
        window.onbeforeunload = null;
    }

    return () => {
      if (wakeLock) wakeLock.release().catch(() => {});
      document.removeEventListener('visibilitychange', handleVisibility);
      window.onbeforeunload = null;
    };
  }, [isHikeActive]);

  return { session, isHikeActive, gpsError, startHike, stopHike };
};
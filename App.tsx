import React, { useState, useEffect, useCallback } from 'react';
import { DogProfile, CompletedHike, Trail } from './types';
import { analyzeBreed, getSmartTrailRecommendations } from './services/geminiService';
import { usePersistentState } from './hooks/usePersistentState';
import { useWeather } from './hooks/useWeather';
import { useHikeSession } from './hooks/useHikeSession';

// Components
import { Onboarding } from './components/views/Onboarding';
import { Dashboard } from './components/views/Dashboard';
import { HistoryView } from './components/views/HistoryView';
import { TrailsView } from './components/views/TrailsView';
import { BottomNav } from './components/navigation/BottomNav';
import { ActiveHikeView } from './components/overlays/ActiveHikeView';
import { HikeDetailView } from './components/overlays/HikeDetailView';

export default function App() {
  const [view, setView] = useState<'onboarding' | 'dashboard' | 'trails' | 'history'>('onboarding');
  
  // State for multiple profiles
  const [profiles, setProfiles] = usePersistentState<DogProfile[]>('wildcord_profiles_v2', []);
  const [activeDogId, setActiveDogId] = useState<string | null>(null);

  // History state
  const [history, setHistory] = usePersistentState<CompletedHike[]>('wildcord_history', []);
  const [selectedHike, setSelectedHike] = useState<CompletedHike | null>(null);
  
  const [trails, setTrails] = useState<Trail[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Computed Active Profile
  const activeProfile = profiles.find(p => p.id === activeDogId) || profiles[0] || null;

  // Migration for legacy single-profile users
  useEffect(() => {
    const legacyProfile = localStorage.getItem('wildcord_profile');
    if (legacyProfile && profiles.length === 0) {
        try {
            const parsed = JSON.parse(legacyProfile);
            const newProfile = { ...parsed, id: crypto.randomUUID() };
            setProfiles([newProfile]);
            localStorage.removeItem('wildcord_profile'); // Clear old key
        } catch (e) { console.error("Migration failed", e); }
    }
  }, []);

  // Set active dog ID on load
  useEffect(() => {
    if (profiles.length > 0 && !activeDogId) {
        setActiveDogId(profiles[0].id);
        setView('dashboard');
    } else if (profiles.length === 0) {
        setView('onboarding');
    }
  }, [profiles, activeDogId]);

  // Custom Hooks
  const { weather, fetchWeather } = useWeather();
  const { session: hikeSession, isHikeActive, gpsError, startHike, stopHike } = useHikeSession(
    activeProfile, 
    weather,
    (completedHike) => {
        setHistory(prev => [completedHike, ...prev]);
        setSelectedHike(completedHike);
    }
  );

  // Handlers
  const handleProfileSubmit = async (data: Partial<DogProfile>) => {
    setIsLoading(true);
    if (data.breed) {
      const bioData = await analyzeBreed(data.breed);
      const newProfile = { 
          ...data, 
          ...bioData, 
          id: crypto.randomUUID() 
      } as DogProfile;
      
      setProfiles(prev => [...prev, newProfile]);
      setActiveDogId(newProfile.id);
      setView('dashboard');
    }
    setIsLoading(false);
  };

  const handleAddDog = () => {
      setView('onboarding');
  };

  const loadTrails = useCallback(async () => {
    if (!activeProfile) return;
    setIsLoading(true);
    
    let locationString = "Boulder, CO"; 
    let coords;

    try {
      if ("geolocation" in navigator) {
         const position = await new Promise<GeolocationPosition>((resolve, reject) => {
           navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
         });
         coords = { lat: position.coords.latitude, lng: position.coords.longitude };
         locationString = "my current location";
      }
    } catch (e) { console.warn("Geo failed", e); }

    const recs = await getSmartTrailRecommendations(activeProfile, locationString, weather.tempF, coords);
    setTrails(recs);
    setIsLoading(false);
  }, [activeProfile, weather]);

  useEffect(() => {
    if (view === 'trails' && trails.length === 0) loadTrails();
  }, [view, trails.length, loadTrails]);

  const handleAnalysisUpdate = (id: string, text: string) => {
    setHistory(prev => prev.map(h => h.id === id ? { ...h, aiAnalysis: text } : h));
    if (selectedHike && selectedHike.id === id) {
        setSelectedHike(prev => prev ? { ...prev, aiAnalysis: text } : null);
    }
  };

  // Filter history for active dog
  const activeHistory = history.filter(h => h.dogId === activeProfile?.id);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      {view === 'onboarding' && (
        <Onboarding 
            onComplete={handleProfileSubmit} 
            isLoading={isLoading} 
            hasExistingProfile={profiles.length > 0}
            onCancel={() => setView('dashboard')}
        />
      )}
      
      {view !== 'onboarding' && activeProfile && (
        <>
            <div className="p-4">
                {view === 'dashboard' && (
                    <Dashboard 
                        profile={activeProfile}
                        allProfiles={profiles}
                        activeDogId={activeDogId}
                        onSwitchDog={setActiveDogId}
                        onAddDog={handleAddDog}
                        weather={weather} 
                        onStartHike={startHike} 
                        onFindTrails={() => setView('trails')}
                        history={activeHistory}
                    />
                )}
                {view === 'history' && <HistoryView history={activeHistory} onViewDetails={setSelectedHike} />}
                {view === 'trails' && <TrailsView trails={trails} isLoading={isLoading} />}
            </div>
            <BottomNav activeTab={view} onTabChange={(t: any) => setView(t)} />
        </>
      )}

      {isHikeActive && activeProfile && (
        <div className="fixed inset-0 z-50 bg-slate-950 p-4">
          <ActiveHikeView session={hikeSession} onStop={stopHike} gpsError={gpsError} />
        </div>
      )}

      {selectedHike && activeProfile && (
        <HikeDetailView 
          session={selectedHike} 
          profile={activeProfile} 
          onDismiss={() => setSelectedHike(null)}
          onAnalysisGenerated={handleAnalysisUpdate}
          weather={weather}
        />
      )}
    </div>
  );
}
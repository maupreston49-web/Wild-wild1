import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Dog, 
  Activity, 
  Map as MapIcon, 
  Thermometer, 
  Droplets, 
  HeartPulse, 
  AlertTriangle, 
  Navigation,
  ChevronRight,
  Info,
  Play,
  Pause,
  StopCircle,
  Mountain,
  Flame,
  Wind,
  Calendar,
  History,
  CheckCircle2,
  Share2,
  Home,
  Locate,
  Sparkles,
  Stethoscope,
  LayoutDashboard,
  FileText,
  X,
  Satellite
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { analyzeBreed, getSmartTrailRecommendations, generatePostActivityAnalysis, getCurrentWeather } from './services/geminiService';
import { DogProfile, Gender, MedicalCondition, ActivityLevel, HikeSession, Trail, WeatherData, CompletedHike, Coordinate } from './types';
import { getDistanceFromLatLonInMiles } from './utils/geo';

// --- Constants ---
const MEDICAL_CONDITIONS: MedicalCondition[] = [
  { id: 'arthritis', name: 'Arthritis / Joint Issues', impact: 'joint' },
  { id: 'heart', name: 'Heart Condition', impact: 'cardio' },
  { id: 'anxiety', name: 'Anxiety / Reactive', impact: 'anxiety' },
  { id: 'surgery', name: 'Recent Surgery', impact: 'general' },
];

const DEFAULT_WEATHER: WeatherData = {
  tempF: 70,
  condition: 'Loading...',
  humidity: 50,
  realFeelF: 70,
};

// --- Components ---

const Button = ({ onClick, children, variant = 'primary', className = '', disabled = false }: any) => {
  const baseStyle = "px-6 py-4 rounded-2xl font-bold transition-all duration-200 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/20 border-t border-white/10",
    secondary: "bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/50",
    danger: "bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/50",
    outline: "border-2 border-emerald-600/30 text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-500/50",
    ghost: "text-slate-400 hover:text-white hover:bg-white/5"
  };

  return (
    <button onClick={onClick} disabled={disabled} className={`${baseStyle} ${variants[variant as keyof typeof variants]} ${className}`}>
      {children}
    </button>
  );
};

const Card = ({ children, className = '', noPadding = false, onClick = undefined }: any) => (
  <div 
    onClick={onClick}
    className={`bg-slate-900/60 backdrop-blur-md rounded-3xl border border-white/5 shadow-xl overflow-hidden ${onClick ? 'cursor-pointer hover:bg-slate-800/60 transition-colors' : ''} ${noPadding ? '' : 'p-5'} ${className}`}
  >
    {children}
  </div>
);

// --- Sub-Components ---

const BottomNav = ({ activeTab, onTabChange }: { activeTab: string, onTabChange: (tab: string) => void }) => {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'history', label: 'History', icon: FileText },
    { id: 'trails', label: 'Trails', icon: MapIcon },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-slate-950/90 backdrop-blur-xl border-t border-white/10 p-4 pb-6 flex justify-around z-50">
      {tabs.map(tab => {
        const isActive = activeTab === tab.id;
        const Icon = tab.icon;
        return (
          <button 
            key={tab.id} 
            onClick={() => onTabChange(tab.id)}
            className={`flex flex-col items-center gap-1 transition-colors ${isActive ? 'text-emerald-400' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <div className={`p-1.5 rounded-xl ${isActive ? 'bg-emerald-500/20' : ''}`}>
              <Icon className={`w-6 h-6 ${isActive ? 'fill-current' : ''}`} />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
};

const Onboarding = ({ onComplete, isLoading }: any) => {
  const [formData, setFormData] = useState({
    name: '',
    breed: '',
    age: 3,
    weightKg: 20,
    gender: Gender.Male,
    medicalConditions: [] as string[],
  });

  const toggleCondition = (id: string) => {
    setFormData(prev => ({
      ...prev,
      medicalConditions: prev.medicalConditions.includes(id)
        ? prev.medicalConditions.filter(c => c !== id)
        : [...prev.medicalConditions, id]
    }));
  };

  return (
    <div className="p-4 pt-12 max-w-md mx-auto">
      <div className="mb-8 text-center">
        <div className="w-16 h-16 bg-emerald-500 rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-xl shadow-emerald-500/20">
          <Dog className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Create Dog Profile</h1>
        <p className="text-emerald-400 font-medium italic mb-2">"Never roam alone"</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Name</label>
          <input 
            type="text" 
            value={formData.name}
            onChange={e => setFormData({...formData, name: e.target.value})}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors"
            placeholder="e.g. Buddy"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Breed</label>
          <input 
            type="text" 
            value={formData.breed}
            onChange={e => setFormData({...formData, breed: e.target.value})}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors"
            placeholder="e.g. Border Collie"
          />
          <p className="text-xs text-slate-500 mt-2">Used to calculate biomechanics & heat tolerance via Google Search.</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Age (yrs)</label>
            <input 
              type="number" 
              value={formData.age}
              onChange={e => setFormData({...formData, age: Number(e.target.value)})}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Weight (kg)</label>
            <input 
              type="number" 
              value={formData.weightKg}
              onChange={e => setFormData({...formData, weightKg: Number(e.target.value)})}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Conditions</label>
          <div className="grid grid-cols-2 gap-2">
            {MEDICAL_CONDITIONS.map(cond => (
              <button
                key={cond.id}
                onClick={() => toggleCondition(cond.id)}
                className={`text-left px-3 py-2 rounded-lg text-sm font-medium border transition-all ${
                  formData.medicalConditions.includes(cond.id)
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                    : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-600'
                }`}
              >
                {cond.name}
              </button>
            ))}
          </div>
        </div>

        <Button 
          onClick={() => onComplete(formData)} 
          className="w-full mt-8"
          disabled={!formData.name || !formData.breed || isLoading}
        >
          {isLoading ? 'Analyzing Bio-Mechanics...' : 'Create Profile'}
          {!isLoading && <ChevronRight className="w-4 h-4" />}
        </Button>
      </div>
    </div>
  );
};

const Dashboard = ({ profile, weather, onStartHike, onFindTrails, history }: any) => {
  // Calculate Weekly Stats
  const calculateWeeklyStats = () => {
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const recentHikes = history.filter((h: CompletedHike) => h.completedAt > oneWeekAgo);
    
    const totalMiles = recentHikes.reduce((acc: number, h: CompletedHike) => acc + h.distanceMiles, 0);
    const totalDuration = recentHikes.reduce((acc: number, h: CompletedHike) => acc + h.durationSeconds, 0);
    
    // Prepare chart data (last 7 days)
    const chartData = [];
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString();
      const dayName = days[d.getDay()];
      
      const dayStats = recentHikes
        .filter((h: CompletedHike) => new Date(h.completedAt).toLocaleDateString() === dateStr)
        .reduce((acc: number, h: CompletedHike) => acc + h.distanceMiles, 0);
        
      chartData.push({ name: dayName, miles: dayStats });
    }
    
    return { totalMiles, totalDuration, chartData };
  };

  const { totalMiles, totalDuration, chartData } = calculateWeeklyStats();

  return (
    <div className="space-y-6 max-w-md mx-auto pb-24">
      <Card className="relative overflow-hidden">
        <div className="absolute top-0 right-0 p-3 opacity-10">
          <Dog className="w-32 h-32" />
        </div>
        <div>
          <h2 className="text-lg font-medium text-slate-400">Good Morning,</h2>
          <h1 className="text-3xl font-bold text-white mb-1">{profile.name}</h1>
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-2 text-sm text-emerald-400">
              <Activity className="w-4 h-4" />
              <span>Ready for action</span>
            </div>
            
            <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-full backdrop-blur-md">
                <Thermometer className="w-4 h-4 text-amber-400" />
                <span className="text-white font-bold">{Math.round(weather.tempF)}°F</span>
                <span className="text-xs text-slate-300 hidden sm:inline">{weather.condition}</span>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-4">
        <Card className="flex flex-col items-center justify-center text-center py-6">
          <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center mb-2">
            <Flame className="w-5 h-5 text-orange-400" />
          </div>
          <div className="text-2xl font-bold text-white">{profile.heatTolerance}/10</div>
          <div className="text-xs font-medium text-slate-400 uppercase tracking-wide">Heat Tol.</div>
        </Card>
        <Card className="flex flex-col items-center justify-center text-center py-6">
          <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center mb-2">
            <Activity className="w-5 h-5 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-white">{profile.energyBaseline}</div>
          <div className="text-xs font-medium text-slate-400 uppercase tracking-wide">Energy</div>
        </Card>
      </div>

      {/* Weekly Tracking Section */}
      <Card noPadding>
        <div className="p-5 pb-0 flex justify-between items-end">
          <div>
            <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 mb-1">
              <Calendar className="w-3.5 h-3.5" />
              Weekly Activity
            </h3>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-white">{totalMiles.toFixed(1)}</span>
              <span className="text-sm text-slate-500">miles</span>
            </div>
          </div>
          <div className="text-right">
             <div className="text-xs text-slate-500 mb-0.5">Active Time</div>
             <div className="font-mono text-emerald-400 font-medium">
               {Math.floor(totalDuration / 3600)}h {Math.floor((totalDuration % 3600) / 60)}m
             </div>
          </div>
        </div>
        
        <div className="h-32 w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorMiles" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{fill: '#64748b', fontSize: 10}} 
                dy={-5}
              />
              <Tooltip 
                contentStyle={{backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px'}}
                itemStyle={{color: '#10b981'}}
                labelStyle={{display: 'none'}}
                formatter={(value: any) => [`${value.toFixed(1)} mi`, '']}
              />
              <Area 
                type="monotone" 
                dataKey="miles" 
                stroke="#10b981" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorMiles)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="space-y-3">
        <Button onClick={onStartHike} className="w-full justify-between group">
          <span className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-lg">
              <Play className="w-5 h-5 fill-current" />
            </div>
            <div className="text-left">
              <div className="font-bold">Start Activity</div>
              <div className="text-xs text-emerald-100 font-normal">Track strain & hydration</div>
            </div>
          </span>
          <ChevronRight className="w-5 h-5 opacity-50 group-hover:translate-x-1 transition-transform" />
        </Button>

        <Button onClick={onFindTrails} variant="secondary" className="w-full justify-between group">
           <span className="flex items-center gap-3">
            <div className="bg-slate-700 p-2 rounded-lg">
              <MapIcon className="w-5 h-5" />
            </div>
            <div className="text-left">
              <div className="font-bold">Find Smart Trails</div>
              <div className="text-xs text-slate-400 font-normal">AI-curated for {profile.name}</div>
            </div>
          </span>
          <ChevronRight className="w-5 h-5 opacity-50 group-hover:translate-x-1 transition-transform" />
        </Button>
      </div>

      {profile.isBrachycephalic && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
          <div className="text-sm text-amber-200">
            <span className="font-bold">Heat Warning:</span> {profile.name} is Brachycephalic. Limit activity when temp > 75°F.
          </div>
        </div>
      )}
    </div>
  );
};

const HistoryView = ({ history, onViewDetails }: { history: CompletedHike[], onViewDetails: (hike: CompletedHike) => void }) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    return `${Math.floor(mins / 60) > 0 ? `${Math.floor(mins/60)}h ` : ''}${mins % 60}m`;
  };

  return (
    <div className="space-y-4 max-w-md mx-auto pb-24">
      <div className="flex items-center gap-2 mb-6">
        <div className="p-2 bg-emerald-500/10 rounded-lg">
          <FileText className="w-6 h-6 text-emerald-400" />
        </div>
        <h2 className="text-xl font-bold text-white">Activity History</h2>
      </div>

      {history.length === 0 ? (
        <div className="text-center py-12 text-slate-500">
          <p>No hikes recorded yet.</p>
          <p className="text-sm mt-2">Go to Dashboard to start an activity!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {history.map((hike) => (
            <Card key={hike.id} onClick={() => onViewDetails(hike)} className="group">
              <div className="flex justify-between items-start mb-3">
                <div className="text-sm font-bold text-slate-300">
                  {new Date(hike.completedAt).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
                </div>
                <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-emerald-400 transition-colors" />
              </div>
              
              <div className="grid grid-cols-4 gap-2 mb-3">
                <div className="text-center">
                   <div className="text-lg font-bold text-white">{hike.distanceMiles.toFixed(1)}</div>
                   <div className="text-[10px] text-slate-500 uppercase">Miles</div>
                </div>
                 <div className="text-center">
                   <div className="text-lg font-bold text-white">{formatTime(hike.durationSeconds)}</div>
                   <div className="text-[10px] text-slate-500 uppercase">Time</div>
                </div>
                 <div className="text-center">
                   <div className="text-lg font-bold text-white">{Math.floor(hike.dogSteps)}</div>
                   <div className="text-[10px] text-slate-500 uppercase">Steps</div>
                </div>
                <div className="text-center">
                   <div className="text-lg font-bold text-white">{Math.ceil(hike.caloriesBurned)}</div>
                   <div className="text-[10px] text-slate-500 uppercase">Kcal</div>
                </div>
              </div>

              {hike.aiAnalysis ? (
                 <div className="bg-emerald-900/20 border border-emerald-500/10 rounded-lg p-2 flex items-center gap-2">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    <span className="text-xs text-emerald-200">Analysis Complete</span>
                 </div>
              ) : (
                <div className="bg-slate-800 rounded-lg p-2 flex items-center gap-2 opacity-60">
                    <Sparkles className="w-3 h-3 text-slate-400" />
                    <span className="text-xs text-slate-400">Analysis pending...</span>
                 </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

const TrailsView = ({ trails, isLoading, onBack }: any) => {
  return (
    <div className="space-y-4 max-w-md mx-auto pb-24">
      <div className="flex items-center gap-4 mb-6">
        <div className="p-2 bg-slate-800/50 rounded-lg">
           <MapIcon className="w-6 h-6 text-slate-200" />
        </div>
        <h2 className="text-xl font-bold">Recommended Trails</h2>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-slate-400">Locating you & analyzing terrain...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {trails.map((trail: any) => (
            <Card key={trail.id} noPadding className="active:scale-[0.98] transition-transform">
              <div className="p-5">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-lg text-white">{trail.name}</h3>
                  <div className={`px-2 py-1 rounded text-xs font-bold ${
                    trail.dogAbilityScore >= 80 ? 'bg-emerald-500 text-emerald-950' : 
                    trail.dogAbilityScore >= 50 ? 'bg-amber-500 text-amber-950' : 'bg-red-500 text-white'
                  }`}>
                    {trail.dogAbilityScore} Score
                  </div>
                </div>
                
                <div className="flex gap-4 text-sm text-slate-400 mb-4">
                  <span className="flex items-center gap-1">
                    <Navigation className="w-3 h-3" /> {trail.distanceMiles} mi
                  </span>
                  <span className="flex items-center gap-1">
                    <Mountain className="w-3 h-3" /> {trail.elevationGainFeet} ft
                  </span>
                </div>

                <div className="bg-slate-800/50 rounded-lg p-3 mb-4">
                  <p className="text-xs text-slate-300 leading-relaxed">
                    <span className="text-emerald-400 font-bold">Why:</span> {trail.dogAbilityReason}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  {trail.tags.map((tag: string) => (
                    <span key={tag} className="text-[10px] uppercase font-bold tracking-wide text-slate-500 bg-slate-900 border border-slate-800 px-2 py-1 rounded">
                      {tag}
                    </span>
                  ))}
                </div>

                {trail.uri && (
                  <a 
                    href={trail.uri} 
                    target="_blank" 
                    rel="noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-bold text-emerald-400 transition-colors"
                  >
                    <MapIcon className="w-3.5 h-3.5" />
                    Open in Google Maps
                  </a>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

const ActiveHikeView = ({ session, profile, onStop, weather, gpsError }: any) => {
  const getStrainColor = (strain: number) => {
    if (strain < 50) return 'text-emerald-400';
    if (strain < 80) return 'text-amber-400';
    return 'text-red-500 animate-pulse';
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col h-[85vh] max-w-md mx-auto">
      <div className="flex-1 flex flex-col items-center justify-center text-center space-y-8">
        
        {/* Main Stats */}
        <div className="space-y-1">
          <div className="text-6xl font-black text-white tabular-nums tracking-tighter">
            {formatTime(session.durationSeconds)}
          </div>
          <div className="flex items-center justify-center gap-2">
            <Satellite className={`w-3 h-3 ${gpsError ? 'text-red-500' : 'text-emerald-500 animate-pulse'}`} />
            <div className="text-sm font-medium text-slate-500 uppercase tracking-widest">
                {gpsError ? "GPS Error" : "GPS Tracking"}
            </div>
          </div>
        </div>

        {/* Strain Gauge */}
        <div className="relative w-64 h-64 flex items-center justify-center">
          <svg className="w-full h-full rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" fill="none" stroke="#1e293b" strokeWidth="8" />
            <circle 
              cx="50" cy="50" r="45" fill="none" 
              stroke="currentColor" 
              strokeWidth="8" 
              strokeDasharray={283}
              strokeDashoffset={283 - (283 * session.strainIndex / 100)}
              className={`${getStrainColor(session.strainIndex)} transition-all duration-1000 ease-out`}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <HeartPulse className={`w-8 h-8 mb-2 ${getStrainColor(session.strainIndex)}`} />
            <div className="text-3xl font-bold text-white">{Math.round(session.strainIndex)}%</div>
            <div className="text-xs text-slate-400 uppercase">Strain</div>
          </div>
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-3 gap-8 w-full px-4">
          <div>
            <div className="text-2xl font-bold text-white tabular-nums">{session.distanceMiles.toFixed(2)}</div>
            <div className="text-[10px] text-slate-500 uppercase font-bold">Miles</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-white tabular-nums">{Math.floor(session.dogSteps)}</div>
            <div className="text-[10px] text-slate-500 uppercase font-bold">Paws</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-white tabular-nums">{session.waterNeedOz.toFixed(1)}</div>
            <div className="text-[10px] text-slate-500 uppercase font-bold">Oz Water</div>
          </div>
        </div>
        
        {gpsError && (
             <div className="text-xs text-red-400 bg-red-900/20 px-3 py-1 rounded">
                 Check location permissions
             </div>
        )}

        {session.strainIndex > 80 && (
          <div className="bg-red-500/10 border border-red-500/50 rounded-xl px-4 py-3 flex items-center gap-3 mx-4 animate-bounce">
            <AlertTriangle className="w-6 h-6 text-red-500" />
            <div className="text-left">
              <div className="font-bold text-red-400 text-sm">High Strain Detected</div>
              <div className="text-xs text-red-300">Take a break and offer water immediately.</div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-auto pt-8">
        <Button onClick={onStop} variant="danger" className="w-full py-6 text-lg">
          <StopCircle className="w-6 h-6" />
          End Activity
        </Button>
      </div>
    </div>
  );
};

/**
 * Reusable component for displaying hike details.
 * Can be used for "Just Finished" or "Historical" view.
 */
const HikeDetailView = ({ session, profile, onDismiss, onAnalysisGenerated, weather }: any) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Trigger analysis if it doesn't exist
  useEffect(() => {
    let isMounted = true;
    
    const fetchAnalysis = async () => {
      if (session.aiAnalysis) return; // Already have it

      setIsAnalyzing(true);
      const result = await generatePostActivityAnalysis(profile, session, weather || DEFAULT_WEATHER);
      
      if (isMounted) {
        setIsAnalyzing(false);
        if (onAnalysisGenerated) {
            onAnalysisGenerated(session.id, result);
        }
      }
    };

    fetchAnalysis();
    return () => { isMounted = false; };
  }, [profile, session, weather, onAnalysisGenerated]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${Math.floor(mins / 60) > 0 ? `${Math.floor(mins/60)}h ` : ''}${mins % 60}m`;
  };

  const analysisText = session.aiAnalysis || "Analysis pending...";

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 overflow-y-auto animate-in slide-in-from-bottom duration-300">
      <div className="max-w-md mx-auto p-6 pb-20">
        <div className="flex items-center justify-between mb-8">
            <h2 className="text-lg font-bold text-slate-400">Activity Report</h2>
            <button onClick={onDismiss} className="p-2 bg-slate-900 rounded-full hover:bg-slate-800 transition-colors">
                <X className="w-6 h-6 text-white" />
            </button>
        </div>

        <div className="text-center mb-8">
            <div className="w-16 h-16 bg-emerald-500 rounded-full mx-auto flex items-center justify-center mb-4 shadow-2xl shadow-emerald-500/30">
                <CheckCircle2 className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-black text-white mb-2">{session.distanceMiles.toFixed(2)} mi</h1>
            <p className="text-slate-400">
                {new Date(session.completedAt).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
            <Card className="p-4 text-center">
            <div className="text-slate-500 text-xs font-bold uppercase mb-1">Time</div>
            <div className="text-2xl font-bold text-white">{formatTime(session.durationSeconds)}</div>
            </Card>
            <Card className="p-4 text-center">
            <div className="text-slate-500 text-xs font-bold uppercase mb-1">Steps</div>
            <div className="text-2xl font-bold text-emerald-400">{Math.floor(session.dogSteps)}</div>
            </Card>
            <Card className="p-4 text-center">
            <div className="text-slate-500 text-xs font-bold uppercase mb-1">Strain</div>
            <div className="text-2xl font-bold text-white">{Math.round(session.strainIndex)}%</div>
            </Card>
            <Card className="p-4 text-center">
            <div className="text-slate-500 text-xs font-bold uppercase mb-1">Calories</div>
            <div className="text-2xl font-bold text-white">{Math.ceil(session.caloriesBurned)}</div>
            </Card>
        </div>

        <Card className="mb-6 overflow-hidden border-emerald-500/20">
            <div className="bg-emerald-900/20 p-4 border-b border-white/5 flex items-center justify-between">
            <h3 className="font-bold text-white flex items-center gap-2">
                <Stethoscope className="w-5 h-5 text-emerald-400" />
                Bio-Analysis
            </h3>
            {isAnalyzing && (
                <div className="flex items-center gap-2 text-xs text-emerald-400 animate-pulse">
                <Sparkles className="w-3 h-3" />
                Thinking...
                </div>
            )}
            </div>
            <div className="p-5">
            {isAnalyzing ? (
                <div className="space-y-3">
                <div className="h-4 bg-slate-800 rounded w-3/4 animate-pulse"></div>
                <div className="h-4 bg-slate-800 rounded w-full animate-pulse"></div>
                <div className="h-4 bg-slate-800 rounded w-5/6 animate-pulse"></div>
                <p className="text-xs text-slate-500 mt-4 text-center">Consulting breed database...</p>
                </div>
            ) : (
                <div className="text-sm text-slate-300 leading-relaxed space-y-4 whitespace-pre-wrap">
                {analysisText}
                </div>
            )}
            </div>
        </Card>

        <Card className="p-5 mb-8 border-cyan-500/20 bg-cyan-900/5">
            <h3 className="font-bold text-white mb-2 flex items-center gap-2">
            <Droplets className="w-4 h-4 text-cyan-400" />
            Hydration
            </h3>
            <p className="text-sm text-slate-300">
            Recommended water intake for this session: <span className="text-cyan-400 font-bold">{Math.ceil(session.waterNeedOz)}oz</span>.
            </p>
        </Card>
      </div>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [view, setView] = useState<'onboarding' | 'dashboard' | 'trails' | 'history'>('onboarding');
  const [isHikeActive, setIsHikeActive] = useState(false);
  const [selectedHike, setSelectedHike] = useState<CompletedHike | null>(null);

  // Persistent Profile State
  const [profile, setProfile] = useState<DogProfile | null>(() => {
    try {
      const saved = localStorage.getItem('wildcord_profile');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Persistent History State
  const [history, setHistory] = useState<CompletedHike[]>(() => {
    try {
      const saved = localStorage.getItem('wildcord_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isLoading, setIsLoading] = useState(false);
  const [gpsError, setGpsError] = useState(false);
  
  // Real-time Weather State
  const [weather, setWeather] = useState<WeatherData>(DEFAULT_WEATHER);

  // Hike Session State
  const [hikeSession, setHikeSession] = useState<HikeSession>({
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

  const [trails, setTrails] = useState<Trail[]>([]);

  // Persist Profile changes
  useEffect(() => {
    if (profile) {
      localStorage.setItem('wildcord_profile', JSON.stringify(profile));
    }
  }, [profile]);

  // Persist History changes
  useEffect(() => {
    localStorage.setItem('wildcord_history', JSON.stringify(history));
  }, [history]);

  // Check if profile exists on mount to determine view
  useEffect(() => {
    if (profile && view === 'onboarding') {
      setView('dashboard');
    }
  }, [profile, view]);

  // Fetch Weather on Mount
  useEffect(() => {
    if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(async (position) => {
            const w = await getCurrentWeather(position.coords.latitude, position.coords.longitude);
            setWeather(w);
        }, (err) => {
            console.warn("Location access denied for weather", err);
        });
    }
  }, []);

  // --- Onboarding Logic ---
  const handleProfileSubmit = async (data: Partial<DogProfile>) => {
    setIsLoading(true);
    if (data.breed) {
      const bioData = await analyzeBreed(data.breed);
      const fullProfile = {
        ...data,
        ...bioData,
      } as DogProfile;
      setProfile(fullProfile);
      // View transition handled by useEffect
    }
    setIsLoading(false);
  };

  // --- Dashboard/Trail Logic ---
  const loadTrails = useCallback(async () => {
    if (!profile) return;
    setIsLoading(true);
    
    let locationString = "Boulder, CO"; // Fallback
    let coords;

    try {
      if ("geolocation" in navigator) {
         const position = await new Promise<GeolocationPosition>((resolve, reject) => {
           navigator.geolocation.getCurrentPosition(resolve, reject, {
             timeout: 5000,
             maximumAge: 0
           });
         });
         coords = {
           lat: position.coords.latitude,
           lng: position.coords.longitude
         };
         locationString = "my current location";
      }
    } catch (error) {
      console.warn("Geolocation failed or denied, using fallback.");
    }

    // Use current weather temp
    const recs = await getSmartTrailRecommendations(profile, locationString, weather.tempF, coords);
    setTrails(recs);
    setIsLoading(false);
  }, [profile, weather]);

  useEffect(() => {
    if (view === 'trails' && trails.length === 0) {
      loadTrails();
    }
  }, [view, trails.length, loadTrails]);

  // --- Bio-Engine Active Hike Logic (REAL GPS) ---
  const timerInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const watchId = useRef<number | null>(null);

  const startHike = () => {
    if (!navigator.geolocation) {
        alert("GPS is not supported on this device.");
        return;
    }

    setGpsError(false);
    setHikeSession(prev => ({ 
      ...prev, 
      isActive: true, 
      startTime: Date.now(),
      // Reset counters
      durationSeconds: 0,
      distanceMiles: 0,
      dogSteps: 0,
      caloriesBurned: 0,
      strainIndex: 0,
      waterNeedOz: 0,
      path: [],
      currentSpeedMph: 0
    }));
    setIsHikeActive(true);

    // Start Timer
    timerInterval.current = setInterval(() => {
        setHikeSession(prev => ({
            ...prev,
            durationSeconds: prev.durationSeconds + 1
        }));
    }, 1000);

    // Start GPS Tracking
    watchId.current = navigator.geolocation.watchPosition(
        (position) => {
            const { latitude, longitude, speed } = position.coords;
            const timestamp = position.timestamp;
            
            setHikeSession(prev => {
                const newPath = [...prev.path, { lat: latitude, lng: longitude, timestamp }];
                
                // Calculate distance from last point
                let addedDistance = 0;
                if (prev.path.length > 0) {
                    const lastPoint = prev.path[prev.path.length - 1];
                    // Calculate distance in miles
                    addedDistance = getDistanceFromLatLonInMiles(lastPoint.lat, lastPoint.lng, latitude, longitude);
                    
                    // Filter GPS jitter (ignore tiny movements < 3 meters approx 0.0018 miles)
                    if (addedDistance < 0.0018) {
                        addedDistance = 0;
                    }
                }

                const newDistance = prev.distanceMiles + addedDistance;
                
                // Calculate Bio Metrics based on REAL distance
                // Steps
                const stepsIncrement = (addedDistance * 1609.34) / (profile!.strideLengthMeters || 0.5);
                
                // Strain
                const heatFactor = Math.max(0, (weather.tempF - 65) * (11 - profile!.heatTolerance) * 0.05);
                const medicalFactor = profile!.medicalConditions.length > 0 ? 1.5 : 1.0;
                // Accumulate strain based on distance covered, not just time
                const strainIncrement = (addedDistance * 10 * medicalFactor) + (heatFactor * 0.01); 

                // Calories (Rough estimate: 0.8 calories per pound per mile is a generic dog heuristic, simplified here)
                // Using 0.05 * kg per update tick was the old way.
                // New way: roughly 0.75 * kg * distance(km) -> 0.75 * kg * (miles * 1.6)
                const caloriesIncrement = addedDistance * 1.6 * profile!.weightKg * 0.75;

                // Water
                const waterIncrement = addedDistance * (0.5 + (weather.tempF / 100));

                return {
                    ...prev,
                    path: newPath,
                    distanceMiles: newDistance,
                    // Use GPS speed if available (m/s to mph), else 0. 2.237 is conversion factor
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
        {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        }
    );
  };

  const stopHike = () => {
    if (timerInterval.current) clearInterval(timerInterval.current);
    if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current);
    
    // Save to history
    const { isActive, ...sessionData } = hikeSession;
    
    const completedHike: CompletedHike = {
      ...sessionData,
      id: crypto.randomUUID(),
      completedAt: Date.now(),
      dateStr: new Date().toISOString()
    };
    
    // Only save if meaningful duration or distance
    if (hikeSession.durationSeconds > 5 || hikeSession.distanceMiles > 0.01) {
      setHistory(prev => [completedHike, ...prev]);
      // Open the detail view immediately for this new hike
      setSelectedHike(completedHike);
    }

    setHikeSession(prev => ({ ...prev, isActive: false }));
    setIsHikeActive(false);
  };

  // Callback to update history when AI generates the analysis
  const handleAnalysisUpdate = (id: string, text: string) => {
    setHistory(prevHistory => 
        prevHistory.map(h => h.id === id ? { ...h, aiAnalysis: text } : h)
    );
    // Also update the currently selected hike to reflect changes in UI if it's open
    if (selectedHike && selectedHike.id === id) {
        setSelectedHike(prev => prev ? { ...prev, aiAnalysis: text } : null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      {view === 'onboarding' && <Onboarding onComplete={handleProfileSubmit} isLoading={isLoading} />}
      
      {view !== 'onboarding' && profile && (
        <>
            <div className="p-4">
                {view === 'dashboard' && (
                    <Dashboard 
                        profile={profile} 
                        weather={weather} 
                        onStartHike={startHike} 
                        onFindTrails={() => setView('trails')}
                        history={history}
                    />
                )}

                {view === 'history' && (
                    <HistoryView 
                        history={history} 
                        onViewDetails={setSelectedHike} 
                    />
                )}

                {view === 'trails' && (
                    <TrailsView trails={trails} isLoading={isLoading} onBack={() => setView('dashboard')} />
                )}
            </div>

            <BottomNav activeTab={view} onTabChange={(t: any) => setView(t)} />
        </>
      )}

      {/* Overlays */}
      
      {isHikeActive && profile && (
        <div className="fixed inset-0 z-50 bg-slate-950 p-4">
          <ActiveHikeView 
             session={hikeSession} 
             profile={profile} 
             onStop={stopHike} 
             weather={weather}
             gpsError={gpsError}
          />
        </div>
      )}

      {selectedHike && profile && (
        <HikeDetailView 
          session={selectedHike} 
          profile={profile} 
          onDismiss={() => setSelectedHike(null)}
          onAnalysisGenerated={handleAnalysisUpdate}
          weather={weather}
        />
      )}
    </div>
  );
}
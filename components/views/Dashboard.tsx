import React, { useMemo } from 'react';
import { Dog, Activity, Thermometer, Flame, Calendar, Play, ChevronRight, Map as MapIcon, AlertTriangle, Plus } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, Tooltip } from 'recharts';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { CompletedHike, DogProfile } from '../../types';

interface DashboardProps {
    profile: DogProfile;
    allProfiles: DogProfile[];
    activeDogId: string | null;
    onSwitchDog: (id: string) => void;
    onAddDog: () => void;
    weather: any;
    onStartHike: () => void;
    onFindTrails: () => void;
    history: CompletedHike[];
}

export const Dashboard = ({ 
    profile, 
    allProfiles,
    activeDogId,
    onSwitchDog,
    onAddDog,
    weather, 
    onStartHike, 
    onFindTrails, 
    history 
}: DashboardProps) => {
  
  const { totalMiles, totalDuration, chartData } = useMemo(() => {
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const recentHikes = history.filter((h: CompletedHike) => h.completedAt > oneWeekAgo);
    
    const totalMiles = recentHikes.reduce((acc: number, h: CompletedHike) => acc + h.distanceMiles, 0);
    const totalDuration = recentHikes.reduce((acc: number, h: CompletedHike) => acc + h.durationSeconds, 0);
    
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
  }, [history]);

  return (
    <div className="space-y-6 max-w-md mx-auto pb-24">
      {/* Dog Switcher */}
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        {allProfiles.map(p => (
            <button
                key={p.id}
                onClick={() => onSwitchDog(p.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all whitespace-nowrap ${
                    activeDogId === p.id 
                    ? 'bg-emerald-500 border-emerald-400 text-white shadow-lg shadow-emerald-500/20' 
                    : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500'
                }`}
            >
                <Dog className="w-4 h-4" />
                <span className="font-bold text-sm">{p.name}</span>
            </button>
        ))}
        {allProfiles.length < 2 && (
            <button
                onClick={onAddDog}
                className="flex items-center gap-2 px-4 py-2 rounded-full border border-dashed border-slate-600 text-slate-400 hover:text-white hover:border-emerald-500 transition-all whitespace-nowrap"
            >
                <Plus className="w-4 h-4" />
                <span className="font-bold text-sm">Add Dog</span>
            </button>
        )}
      </div>

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
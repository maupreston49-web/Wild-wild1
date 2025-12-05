import React from 'react';
import { Satellite, HeartPulse, AlertTriangle, StopCircle } from 'lucide-react';
import { Button } from '../ui/Button';

export const ActiveHikeView = ({ session, onStop, gpsError }: any) => {
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
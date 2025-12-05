import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, Stethoscope, Sparkles, Droplets } from 'lucide-react';
import { Card } from '../ui/Card';
import { generatePostActivityAnalysis } from '../../services/geminiService';
import { WeatherData } from '../../types';

// Mock default weather to prevent crash if not passed
const DEFAULT_WEATHER: WeatherData = {
    tempF: 70,
    condition: 'Unknown',
    humidity: 50,
    realFeelF: 70,
};

export const HikeDetailView = ({ session, profile, onDismiss, onAnalysisGenerated, weather }: any) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    let isMounted = true;
    
    const fetchAnalysis = async () => {
      if (session.aiAnalysis) return; 

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
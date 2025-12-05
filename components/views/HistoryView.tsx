import React from 'react';
import { FileText, ChevronRight, CheckCircle2, Sparkles } from 'lucide-react';
import { Card } from '../ui/Card';
import { CompletedHike } from '../../types';

export const HistoryView = ({ history, onViewDetails }: { history: CompletedHike[], onViewDetails: (hike: CompletedHike) => void }) => {
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
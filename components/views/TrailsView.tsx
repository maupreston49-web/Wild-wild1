import React from 'react';
import { Map as MapIcon, Navigation, Mountain } from 'lucide-react';
import { Card } from '../ui/Card';

export const TrailsView = ({ trails, isLoading }: any) => {
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
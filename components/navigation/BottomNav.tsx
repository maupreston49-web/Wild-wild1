import React from 'react';
import { LayoutDashboard, FileText, Map as MapIcon } from 'lucide-react';

export const BottomNav = ({ activeTab, onTabChange }: { activeTab: string, onTabChange: (tab: string) => void }) => {
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
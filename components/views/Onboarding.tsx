import React, { useState } from 'react';
import { Dog, ChevronRight, X } from 'lucide-react';
import { Button } from '../ui/Button';
import { Gender, MedicalCondition } from '../../types';

const MEDICAL_CONDITIONS: MedicalCondition[] = [
  { id: 'arthritis', name: 'Arthritis / Joint Issues', impact: 'joint' },
  { id: 'heart', name: 'Heart Condition', impact: 'cardio' },
  { id: 'anxiety', name: 'Anxiety / Reactive', impact: 'anxiety' },
  { id: 'surgery', name: 'Recent Surgery', impact: 'general' },
];

export const Onboarding = ({ onComplete, isLoading, hasExistingProfile, onCancel }: any) => {
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
    <div className="p-4 pt-12 max-w-md mx-auto relative">
      {hasExistingProfile && (
          <button onClick={onCancel} className="absolute top-4 right-4 p-2 bg-slate-900 rounded-full text-slate-400 hover:text-white">
              <X className="w-6 h-6" />
          </button>
      )}

      <div className="mb-8 text-center">
        <div className="w-16 h-16 bg-emerald-500 rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-xl shadow-emerald-500/20">
          <Dog className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">
            {hasExistingProfile ? 'Add Another Dog' : 'Create Dog Profile'}
        </h1>
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
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check } from 'lucide-react';
import { Team } from '../types';

interface AddTeamModalProps {
  onClose: () => void;
  onAddTeam: (team: Team) => void;
  teams: Team[];
}

export default function AddTeamModal({ onClose, onAddTeam, teams }: AddTeamModalProps) {
  const [name, setName] = useState('');
  const [parentId, setParentId] = useState<string>('');

  const handleSubmit = () => {
    if (!name.trim()) return;
    
    const newTeam: Team = {
      id: `t-${Date.now()}`,
      name: name.trim(),
      description: '',
      parentId: parentId || null
    };

    onAddTeam(newTeam);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-full"
      >
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h2 className="text-lg font-black text-slate-800 tracking-tight flex items-center gap-2">
              Add New Team
            </h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400 hover:text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Team Name *</label>
              <input 
                type="text" 
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Platform Team"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Parent Team (Group)</label>
              <select
                value={parentId}
                onChange={e => setParentId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                <option value="">No Parent (Root Team)</option>
                {teams.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="p-6 bg-slate-50/80 flex gap-3 border-t border-slate-100 mt-auto">
          <button 
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleSubmit}
            disabled={!name.trim()}
            className="flex-1 px-4 py-2.5 rounded-xl bg-indigo-600 text-sm font-bold text-white hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4" />
            Add Team
          </button>
        </div>
      </motion.div>
    </div>
  );
}

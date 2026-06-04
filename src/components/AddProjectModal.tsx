import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check } from 'lucide-react';
import { Project, ProjectGroup, ProjectType } from '../types';

interface AddProjectModalProps {
  onClose: () => void;
  onAddProject: (project: Project) => void;
  onBulkAdd: (names: string[]) => void;
  projectGroups: ProjectGroup[];
}

export default function AddProjectModal({ onClose, onAddProject, onBulkAdd, projectGroups }: AddProjectModalProps) {
  const [activeTab, setActiveTab] = useState<'single' | 'bulk'>('single');
  
  // Single Project State
  const [name, setName] = useState('');
  const [client, setClient] = useState('');
  const [color, setColor] = useState('#4F46E5');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [type, setType] = useState<ProjectType>('T&M');
  const [code, setCode] = useState('');
  const [pm, setPm] = useState('');
  const [pc, setPc] = useState('');
  const [groupId, setGroupId] = useState('');
  const [upcoming, setUpcoming] = useState(false);
  const [probability, setProbability] = useState<number>(50);
  
  // Bulk State
  const [bulkNames, setBulkNames] = useState('');

  const handleSingleSubmit = () => {
    if (!name.trim()) return;
    
    const newProject: Project = {
      id: `p-${Date.now()}`,
      name: name.trim(),
      client: client.trim() || 'Internal',
      color,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      type,
      code: code.trim(),
      pm: pm.trim(),
      pc: pc.trim(),
      groupId: groupId || null,
      upcoming: upcoming || undefined,
      probability: upcoming ? probability : undefined
    };

    onAddProject(newProject);
  };

  const handleBulkSubmit = () => {
    const names = bulkNames.split('\n').map(n => n.trim()).filter(Boolean);
    if (names.length === 0) return;
    onBulkAdd(names);
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
              Add New Project
            </h2>
            <p className="text-xs font-bold text-slate-400 mt-1">Add a new engagement.</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400 hover:text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 bg-slate-50 border-b border-slate-100 flex gap-2">
          <button
            onClick={() => setActiveTab('single')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'single'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-500 hover:bg-slate-100'
            }`}
          >
            Single Project
          </button>
          <button
            onClick={() => setActiveTab('bulk')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'bulk'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-500 hover:bg-slate-100'
            }`}
          >
            Bulk Add
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          {activeTab === 'single' ? (
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Project Name *</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Website Redesign"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Client</label>
                  <input 
                    type="text" 
                    value={client}
                    onChange={e => setClient(e.target.value)}
                    placeholder="e.g. Acme Corp"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Theme Color</label>
                  <div className="flex gap-2 items-center">
                    <input 
                      type="color" 
                      value={color}
                      onChange={e => setColor(e.target.value)}
                      className="w-10 h-10 rounded border-0 p-0 bg-transparent cursor-pointer"
                    />
                    <span className="text-xs font-mono text-slate-500">{color}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Project Code</label>
                  <input 
                    type="text" 
                    value={code}
                    onChange={e => setCode(e.target.value)}
                    placeholder="PRJ-001"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Project Type</label>
                  <select 
                    value={type}
                    onChange={e => setType(e.target.value as ProjectType)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  >
                    <option value="T&M">T&M</option>
                    <option value="Fixed Bid">Fixed Bid</option>
                    <option value="Milestone based">Milestone based</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">PM (Project Manager)</label>
                  <input 
                    type="text" 
                    value={pm}
                    onChange={e => setPm(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">PC (Project Coordinator)</label>
                  <input 
                    type="text" 
                    value={pc}
                    onChange={e => setPc(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Project Group</label>
                <select 
                  value={groupId}
                  onChange={e => setGroupId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                >
                  <option value="">No Group</option>
                  {projectGroups.map(g => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={upcoming} onChange={e => setUpcoming(e.target.checked)} className="w-4 h-4" />
                  <span className="text-sm font-semibold text-slate-700">Mark as upcoming (not signed)</span>
                </label>

                {upcoming && (
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-slate-500">Probability</label>
                    <input type="number" min={0} max={100} value={probability} onChange={e => setProbability(Number(e.target.value))} className="w-20 px-2 py-1 bg-slate-50 border border-slate-200 rounded" />
                    <span className="text-xs text-slate-500">%</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Start Date</label>
                  <input 
                    type="date" 
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">End Date</label>
                  <input 
                    type="date" 
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm font-medium text-slate-500">
                Enter one project name per line. Generates random theme colors.
              </p>
              <textarea
                value={bulkNames}
                onChange={e => setBulkNames(e.target.value)}
                rows={10}
                placeholder={"Project Apollo\nProject Phoenix\nAcme Redesign"}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none font-mono"
              />
            </div>
          )}
        </div>

        <div className="p-6 bg-slate-50/80 flex gap-3 border-t border-slate-100 mt-auto">
          <button 
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={activeTab === 'single' ? handleSingleSubmit : handleBulkSubmit}
            disabled={activeTab === 'single' ? !name.trim() : !bulkNames.trim()}
            className="flex-1 px-4 py-2.5 rounded-xl bg-indigo-600 text-sm font-bold text-white hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4" />
            {activeTab === 'single' ? 'Add Project' : 'Add Projects'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

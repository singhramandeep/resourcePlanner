import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check } from 'lucide-react';
import { Project, ProjectGroup, ProjectType, Comment, Todo, TeamMember } from '../types';
import CommentHistory from './CommentHistory';
import { cn } from '../lib/utils';

interface EditProjectModalProps {
  project: Project;
  onClose: () => void;
  onUpdate: (id: string, updates: Partial<Project>) => void;
  projectGroups: ProjectGroup[];
  comments: Comment[];
  todos: Todo[];
  onAddComment: (comment: Omit<Comment, 'id' | 'createdAt' | 'authorId' | 'authorName'>) => Comment;
  onAddTodo: (todo: Omit<Todo, 'id' | 'createdAt'>) => Todo;
  members: TeamMember[];
  projects: Project[];
  privacyMode: boolean;
}

export default function EditProjectModal({ 
  project, 
  onClose, 
  onUpdate, 
  projectGroups,
  comments,
  todos,
  onAddComment,
  onAddTodo,
  members,
  projects,
  privacyMode
}: EditProjectModalProps) {
  const [name, setName] = useState(project.name);
  const [client, setClient] = useState(project.client);
  const [color, setColor] = useState(project.color);
  const [startDate, setStartDate] = useState(project.startDate || '');
  const [endDate, setEndDate] = useState(project.endDate || '');
  const [type, setType] = useState<ProjectType>(project.type || 'T&M');
  const [code, setCode] = useState(project.code || '');
  const [pm, setPm] = useState(project.pm || '');
  const [pc, setPc] = useState(project.pc || '');
  const [groupId, setGroupId] = useState(project.groupId || '');

  const handleSubmit = () => {
    if (!name.trim()) return;
    
    onUpdate(project.id, {
      name: name.trim(),
      client: client.trim() || 'Internal',
      color,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      type,
      code: code.trim(),
      pm: pm.trim(),
      pc: pc.trim(),
      groupId: groupId || null
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-xl w-full max-w-5xl overflow-hidden flex flex-col h-[85vh]"
      >
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white relative z-10">
          <div>
            <h2 className="text-lg font-black text-slate-800 tracking-tight flex items-center gap-2 uppercase">
              Project Explorer
            </h2>
            <p className="text-[10px] font-bold text-slate-500 mt-0.5 tracking-wider uppercase opacity-60">General Settings & Activity Log</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          <div className="flex-1 p-8 overflow-y-auto bg-white border-r border-slate-100">
            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Project Label</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Client Participant</label>
                  <input 
                    type="text" 
                    value={client}
                    onChange={e => setClient(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Visual ID Color</label>
                  <div className="flex gap-4 items-center p-1 bg-slate-50 border border-slate-200 rounded-xl">
                    <input 
                      type="color" 
                      value={color}
                      onChange={e => setColor(e.target.value)}
                      className="w-10 h-10 rounded-lg border-0 p-0 bg-transparent cursor-pointer"
                    />
                    <span className="text-xs font-black text-slate-500 uppercase tracking-tighter">{color}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Operational Code</label>
                  <input 
                    type="text" 
                    value={code}
                    onChange={e => setCode(e.target.value)}
                    placeholder="PRJ-001"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Billing Modal</label>
                  <select 
                    value={type}
                    onChange={e => setType(e.target.value as ProjectType)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all appearance-none"
                  >
                    <option value="T&M">Time & Material</option>
                    <option value="Fixed Bid">Fixed Bid</option>
                    <option value="Milestone based">Milestone Based</option>
                    <option value="Other">Custom/Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Owner (PM)</label>
                  <input 
                    type="text" 
                    value={pm}
                    onChange={e => setPm(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Facilitator (PC)</label>
                  <input 
                    type="text" 
                    value={pc}
                    onChange={e => setPc(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Project Classification</label>
                <select 
                  value={groupId}
                  onChange={e => setGroupId(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all appearance-none"
                >
                  <option value="">Ungrouped</option>
                  {projectGroups.map(g => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Kickoff Date</label>
                  <input 
                    type="date" 
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Estimated Completion</label>
                  <input 
                    type="date" 
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="w-full md:w-96 flex flex-col p-8 bg-slate-50">
            <CommentHistory 
              entityId={project.id}
              comments={comments}
              todos={todos}
              members={members}
              projects={projects}
              onAddComment={onAddComment}
              onAddTodo={onAddTodo}
              privacyMode={privacyMode}
            />

            <div className="mt-8 flex gap-3">
              <button 
                onClick={onClose}
                className="flex-1 px-4 py-3 rounded-xl bg-white border border-slate-200 text-xs font-black uppercase tracking-widest text-slate-500 hover:bg-slate-100 transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={handleSubmit}
                disabled={!name.trim()}
                className="flex-[2] px-4 py-3 rounded-xl bg-indigo-600 text-xs font-black uppercase tracking-widest text-white hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 disabled:opacity-50 disabled:grayscale flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                Update Project
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

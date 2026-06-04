/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check, Trash2, Plus, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { obfuscate } from '../lib/utils';

import { AssignmentStatus, Project, Assignment } from '../types';

interface AllocationBatch {
  id?: string;
  projectId: string;
  hours: number;
  status: AssignmentStatus;
  startDate: string;
  endDate: string;
}

interface AllocationModalProps {
  memberId: string;
  memberName: string;
  month: Date;
  projects: Project[];
  initialAssignments?: Assignment[];
  onClose: () => void;
  onSave: (batch: AllocationBatch[]) => void;
  onRemove?: (id: string) => void;
  onHardDelete?: (id: string) => void;
  onAddProject?: () => void;
  onEditResource?: (memberId: string) => void;
  privacyMode: boolean;
}

export default function AllocationModal({ memberId, memberName, month, projects, initialAssignments, onClose, onSave, onRemove, onHardDelete, onAddProject, onEditResource, privacyMode }: AllocationModalProps) {
  const [batch, setBatch] = useState<AllocationBatch[]>([]);

  useEffect(() => {
    if (initialAssignments && initialAssignments.length > 0) {
      setBatch(initialAssignments.map(asg => ({
        id: asg.id,
        projectId: asg.projectId,
        hours: asg.hoursPerWeek,
        status: asg.status,
        startDate: asg.startDate,
        endDate: asg.endDate
      })));
    } else {
      const dateStr = format(month, 'yyyy-MM-dd');
      setBatch([{
        projectId: projects[0]?.id || '',
        hours: 40,
        status: 'Hard',
        startDate: dateStr,
        endDate: dateStr
      }]);
    }
  }, [initialAssignments, month, projects]);

  const statuses: AssignmentStatus[] = ['Hard', 'Soft', 'Pending', 'Planned'];

  const addRow = () => {
    const dateStr = format(month, 'yyyy-MM-dd');
    const availableProject = projects.find(p => !batch.some(b => b.projectId === p.id));
    
    if (!availableProject) {
      // If no projects left to add, maybe don't add or add with empty?
      // For now, let's just use the first project if all are taken, though it will be disabled.
      return;
    }

    setBatch([...batch, {
      projectId: availableProject.id,
      hours: 40,
      status: 'Hard',
      startDate: dateStr,
      endDate: dateStr
    }]);
  };

  const removeRow = (index: number) => {
    if (batch.length > 1) {
      setBatch(batch.filter((_, i) => i !== index));
    }
  };

  const updateRow = (index: number, updates: Partial<AllocationBatch>) => {
    setBatch(batch.map((row, i) => i === index ? { ...row, ...updates } : row));
  };

  const totalHours = batch.reduce((sum, row) => sum + row.hours, 0);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="p-6 border-b border-slate-100 flex justify-between items-start bg-slate-50/50">
          <div>
            <h2 className="text-lg font-bold text-slate-800">{(initialAssignments && initialAssignments.length > 0) ? 'Edit Allocations' : 'Assign Project'}</h2>
            <div className="flex items-center gap-2 mt-0.5">
              <p className="text-xs text-slate-500 font-medium">
                {obfuscate(memberName, privacyMode)} • {month.getDate() === 1 && month.getHours() === 0 && month.getMinutes() === 0 ? format(month, 'MMMM yyyy') : `Period of ${format(month, 'MMM d, yyyy')}`}
              </p>
              {onEditResource && (
                <>
                  <span className="text-slate-300">|</span>
                  <button 
                    onClick={() => onEditResource(memberId)}
                    className="text-[10px] font-black text-indigo-600 hover:text-indigo-800 uppercase tracking-widest"
                  >
                    View details
                  </button>
                </>
              )}
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-8 overflow-y-auto">
          <div className="space-y-4">
            {batch.map((row, index) => (
              <div key={index} className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-4 relative group">
                {batch.length > 1 && (
                  <button 
                    onClick={() => removeRow(index)}
                    className="absolute -top-2 -right-2 p-1.5 bg-white border border-rose-100 rounded-full text-rose-500 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Select Project</label>
                      <div className="flex items-center gap-2">
                        {row.id && (
                          <div className="flex items-center gap-2">
                             {onRemove && (
                              <button 
                                onClick={() => onRemove(row.id!)}
                                className="text-[10px] font-bold text-slate-500 hover:text-indigo-600 uppercase tracking-tighter"
                                title="Remove from this month/week only"
                              >
                                Clear Period
                              </button>
                            )}
                            <div className="w-[1px] h-2 bg-slate-200" />
                            {onHardDelete && (
                              <button 
                                onClick={() => onHardDelete(row.id!)}
                                className="text-[10px] font-bold text-rose-500 hover:text-rose-700 uppercase tracking-tighter"
                                title="Delete entire allocation record"
                              >
                                Hard Delete
                              </button>
                            )}
                          </div>
                        )}
                        {onAddProject && (
                          <button 
                            onClick={onAddProject}
                            className="text-[10px] font-bold text-indigo-600 hover:underline"
                          >
                            + New Project
                          </button>
                        )}
                      </div>
                    </div>
                    <select
                      value={row.projectId}
                      onChange={(e) => updateRow(index, { projectId: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    >
                      {projects.map(p => {
                        const isAlreadySelected = batch.some((b, i) => b.projectId === p.id && i !== index);
                        return (
                          <option key={p.id} value={p.id} disabled={isAlreadySelected}>
                            {obfuscate(p.name, privacyMode)} {isAlreadySelected ? '(Already added)' : ''}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Assignment Status</label>
                    <div className="flex bg-slate-200/50 p-1 rounded-lg">
                      {statuses.map(s => (
                        <button
                          key={s}
                          onClick={() => updateRow(index, { status: s })}
                          className={`flex-1 py-1 text-[10px] font-bold rounded transition-all ${
                            row.status === s 
                              ? 'bg-white text-indigo-600 shadow-sm' 
                              : 'text-slate-500 hover:text-slate-700'
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Start Date</label>
                    <input 
                      type="date"
                      value={row.startDate}
                      onChange={(e) => updateRow(index, { startDate: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">End Date</label>
                    <input 
                      type="date"
                      value={row.endDate}
                      onChange={(e) => updateRow(index, { endDate: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Allocation (h)</label>
                      <span className="text-xs font-black text-indigo-600">{row.hours}h</span>
                    </div>
                    <input 
                      type="range" 
                      min="1" 
                      max="40" 
                      value={row.hours} 
                      onChange={(e) => updateRow(index, { hours: parseInt(e.target.value) })}
                      className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    />
                  </div>
                </div>
              </div>
            ))}

            <button 
                onClick={addRow}
                className="w-full py-3 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 hover:border-indigo-300 hover:text-indigo-500 transition-all flex items-center justify-center gap-2 font-bold text-sm"
              >
                <Plus className="w-4 h-4" />
                Add Another Assignment
              </button>
            </div>

          {totalHours > 40 && (
            <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-100 rounded-lg text-rose-600">
              <AlertCircle className="w-4 h-4" />
              <p className="text-xs font-bold uppercase tracking-wider">Over-allocated: {totalHours}h total</p>
            </div>
          )}
        </div>

        <div className="p-6 bg-slate-50/80 flex gap-3 border-t border-slate-100">
          <button 
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-white transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={() => onSave(batch)}
            className="flex-[2] px-4 py-2.5 rounded-xl bg-indigo-600 text-sm font-bold text-white hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
          >
            {(initialAssignments && initialAssignments.length > 0) ? `Save ${batch.length} Changes` : `Confirm ${batch.length} Assignment${batch.length > 1 ? 's' : ''}`}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

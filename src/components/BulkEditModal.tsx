import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Users, Edit2, Plus, Trash2 } from 'lucide-react';
import { TeamMember, SkillRating, EmploymentType, Team } from '../types';

interface BulkEditModalProps {
  onClose: () => void;
  onUpdate: (updates: {
    avatarGender?: 'boy' | 'girl';
    addedSkills: { name: string; rating: SkillRating }[];
    employmentType?: EmploymentType;
    teamId?: string;
  }) => void;
  teams: Team[];
}

export default function BulkEditModal({ onClose, onUpdate, teams }: BulkEditModalProps) {
  const [avatarGender, setAvatarGender] = useState<'boy' | 'girl' | ''>('');
  const [employmentType, setEmploymentType] = useState<EmploymentType | ''>('');
  const [teamId, setTeamId] = useState<string>('');
  
  const [skills, setSkills] = useState<{ name: string; rating: SkillRating }[]>([]);
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillRating, setNewSkillRating] = useState<SkillRating>(1);

  const handleAddSkill = () => {
    if (!newSkillName.trim()) return;
    setSkills([...skills, { name: newSkillName.trim(), rating: newSkillRating }]);
    setNewSkillName('');
    setNewSkillRating(1);
  };

  const handleRemoveSkill = (index: number) => {
    setSkills(skills.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    onUpdate({
      avatarGender: avatarGender || undefined,
      addedSkills: skills,
      employmentType: employmentType || undefined,
      teamId: teamId || undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h2 className="text-lg font-black text-slate-800 tracking-tight flex items-center gap-2">
              <Edit2 className="w-5 h-5 text-indigo-500" />
              Bulk Edit Members
            </h2>
            <p className="text-xs font-semibold text-slate-500 mt-1">Apply changes to all selected members</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400 hover:text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6">
          
          {/* Team Assignment */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Assign to Team</h3>
            <select 
              value={teamId} 
              onChange={e => setTeamId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="">Don't Change</option>
              {teams.map(team => (
                <option key={team.id} value={team.id}>{team.name}</option>
              ))}
            </select>
          </div>

          {/* Avatar gender map */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Avatar Settings (M/F)</h3>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="gender" checked={avatarGender === ''} onChange={() => setAvatarGender('')} className="text-indigo-600" />
                <span className="text-sm font-medium text-slate-700">Don't Change</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="gender" checked={avatarGender === 'boy'} onChange={() => setAvatarGender('boy')} className="text-indigo-600" />
                <span className="text-sm font-medium text-slate-700">Male (Boy)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="gender" checked={avatarGender === 'girl'} onChange={() => setAvatarGender('girl')} className="text-indigo-600" />
                <span className="text-sm font-medium text-slate-700">Female (Girl)</span>
              </label>
            </div>
            <p className="text-[10px] text-slate-400 font-medium">Update avatars to use selected gender style.</p>
          </div>

          {/* Employment Type */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Employment Type</h3>
            <select 
              value={employmentType} 
              onChange={e => setEmploymentType(e.target.value as any)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="">Don't Change</option>
              <option value="employee">Employee</option>
              <option value="contractor">Contractor</option>
              <option value="intern">Intern</option>
            </select>
          </div>

          {/* Add Skills */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Add Skills</h3>
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Skill Name</label>
                <input 
                  type="text" 
                  value={newSkillName}
                  onChange={e => setNewSkillName(e.target.value)}
                  placeholder="e.g. React"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold focus:outline-none"
                />
              </div>
              <div className="w-24">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Rating</label>
                <select 
                  value={newSkillRating} 
                  onChange={e => setNewSkillRating(Number(e.target.value) as SkillRating)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold focus:outline-none"
                >
                  <option value={1}>1 - Basic</option>
                  <option value={2}>2 - Intermediate</option>
                  <option value={3}>3 - Expert</option>
                </select>
              </div>
              <button 
                onClick={handleAddSkill}
                className="px-3 py-2 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors shrink-0"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
            
            {skills.length > 0 && (
              <div className="flex flex-col gap-2 mt-3">
                {skills.map((skill, index) => (
                  <div key={index} className="flex items-center justify-between px-3 py-2 border border-slate-200 rounded-lg bg-slate-50">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-700">{skill.name}</span>
                      <div className="text-slate-400 flex items-center">
                        {Array.from({ length: 3 }).map((_, i) => (
                          <span key={i} className={i < skill.rating ? "text-indigo-500" : "text-slate-300"}>•</span>
                        ))}
                      </div>
                    </div>
                    <button 
                      onClick={() => handleRemoveSkill(index)}
                      className="p-1 text-slate-400 hover:text-rose-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <p className="text-[10px] text-slate-400 font-medium">These skills will be added to all selected members. Existing skills with the same name will be overwritten.</p>
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
            className="flex-1 px-4 py-2.5 rounded-xl bg-indigo-600 text-sm font-bold text-white hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4" />
            Apply Changes
          </button>
        </div>
      </motion.div>
    </div>
  );
}

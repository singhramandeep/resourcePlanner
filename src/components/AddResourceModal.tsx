import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Plus, Trash2, Star } from 'lucide-react';
import { TeamMember, Assignment, Team, Skill, SkillRating, EmploymentType, Project } from '../types';

interface AddResourceModalProps {
  onClose: () => void;
  onAddResource: (resource: TeamMember, initialAssignment?: Assignment) => void;
  onBulkAdd: (
    membersData: {
      name: string;
      role: string;
      gender: string;
      employmentType: string;
      skills: { name: string; rating: number }[];
      isPlaceholder?: boolean;
      isFutureJoiner?: boolean;
    }[],
    options?: {
      assignProject: boolean;
      projectId?: string;
      startDate?: string;
      endDate?: string;
      hoursPerWeek?: number;
      isPlaceholder?: boolean;
      isFutureJoiner?: boolean;
    }
  ) => void;
  teams: Team[];
  teamMembers: TeamMember[];
  projects: Project[];
  defaultProjectId?: string;
}

export default function AddResourceModal({ onClose, onAddResource, onBulkAdd, teams, teamMembers, projects, defaultProjectId }: AddResourceModalProps) {
  const [activeTab, setActiveTab] = useState<'single' | 'bulk'>('single');
  
  // Single Resource State
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [skills, setSkills] = useState<Skill[]>([]);
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillRating, setNewSkillRating] = useState<SkillRating>(1);
  const [teamId, setTeamId] = useState(teams.length > 0 ? teams[0].id : '');
  const [managerId, setManagerId] = useState('');
  const [isManager, setIsManager] = useState(false);
  const [employmentType, setEmploymentType] = useState<EmploymentType>('employee');
  const [companyStartDate, setCompanyStartDate] = useState('');
  const [isPlaceholder, setIsPlaceholder] = useState(false);
  const [isFutureJoiner, setIsFutureJoiner] = useState(false);

  const existingRoles = useMemo(() => {
    return Array.from(new Set(teamMembers.map(m => m.role))).sort();
  }, [teamMembers]);

  const existingSkills = useMemo(() => {
    const skillSet = new Set<string>();
    teamMembers.forEach(m => {
      m.skills.forEach(s => skillSet.add(s.name));
    });
    return Array.from(skillSet).sort();
  }, [teamMembers]);
  
  // Initial Project Assignment State
  const [assignProject, setAssignProject] = useState(false);
  const [projectId, setProjectId] = useState(defaultProjectId || projects[0]?.id || '');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [hours, setHours] = useState(40);

  // Bulk add state
  const [bulkNames, setBulkNames] = useState('');
  const [bulkAssignProject, setBulkAssignProject] = useState(false);
  const [bulkProjectId, setBulkProjectId] = useState(defaultProjectId || projects[0]?.id || '');
  const [bulkStartDate, setBulkStartDate] = useState('');
  const [bulkEndDate, setBulkEndDate] = useState('');
  const [bulkHours, setBulkHours] = useState(40);
  const [bulkMemberKind, setBulkMemberKind] = useState<'standard' | 'future' | 'placeholder'>('standard');
  const bulkIsPlaceholder = bulkMemberKind === 'placeholder';
  const bulkIsFutureJoiner = bulkMemberKind === 'future';

  useEffect(() => {
    if (defaultProjectId) {
      setAssignProject(true);
      setBulkAssignProject(true);
    }
  }, [defaultProjectId]);

  useEffect(() => {
    if (isPlaceholder) {
      const upcomingProject = projects.find(p => p.upcoming);
      if (upcomingProject) {
        setProjectId(upcomingProject.id);
      } else if (!projects.some(p => p.id === projectId)) {
        setProjectId('');
      }
      return;
    }

    if (!projects.some(p => p.id === projectId)) {
      setProjectId(projects[0]?.id || '');
    }
  }, [isPlaceholder, projects, projectId]);

  useEffect(() => {
    if (bulkIsPlaceholder) {
      const upcomingProject = projects.find(p => p.upcoming);
      if (upcomingProject) {
        setBulkProjectId(upcomingProject.id);
      } else if (!projects.some(p => p.id === bulkProjectId)) {
        setBulkProjectId('');
      }
      return;
    }

    if (!projects.some(p => p.id === bulkProjectId)) {
      setBulkProjectId(projects[0]?.id || '');
    }
  }, [bulkMemberKind, bulkProjectId, projects]);

  const handleAddSkill = () => {
    if (!newSkillName.trim()) return;
    const existing = skills.find(s => s.name.toLowerCase() === newSkillName.trim().toLowerCase());
    if (existing) {
      setSkills(skills.map(s => s.name === existing.name ? { ...s, rating: newSkillRating } : s));
    } else {
      setSkills([...skills, { name: newSkillName.trim(), rating: newSkillRating }]);
    }
    setNewSkillName('');
    setNewSkillRating(1);
  };

  const handleRemoveSkill = (index: number) => {
    setSkills(skills.filter((_, i) => i !== index));
  };

  const handleUpdateSkillRating = (index: number, rating: SkillRating) => {
    setSkills(prev => prev.map((s, i) => i === index ? { ...s, rating } : s));
  };

  const handleSingleSubmit = () => {
    if (!name.trim() && !isPlaceholder) return;
    
    const resourceName = name.trim() || 'Unidentified Resource';
    const newMember: TeamMember = {
      id: `m-${Date.now()}`,
      name: resourceName,
      role: role.trim() || 'Team Member',
      skills: skills,
      teamId,
      managerId: managerId || undefined,
      isManager,
      companyStartDate: companyStartDate || undefined,
      capacity: 40,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(resourceName)}`,
      employmentType: employmentType,
      isPlaceholder,
      isFutureJoiner
    };

    let newAssignment: Assignment | undefined;
    if (assignProject && projectId && startDate && endDate) {
      newAssignment = {
        id: `a-${Date.now()}`,
        memberId: newMember.id,
        projectId,
        startDate,
        endDate,
        hoursPerWeek: hours,
        status: isPlaceholder || isFutureJoiner ? 'Planned' : 'Hard',
        lastUpdated: new Date().toISOString()
      };
    }

    onAddResource(newMember, newAssignment);
  };

  const handleBulkSubmit = () => {
    const lines = bulkNames.split('\n').map(n => n.trim()).filter(Boolean);
    if (lines.length === 0) return;
    
    const parsedData = lines.map(line => {
      const parts = line.split(',').map(p => p.trim());
      const name = parts[0] || 'Unidentified Resource';
      const role = parts[1] || 'Team Member';
      
      const genderRaw = (parts[2] || '').toLowerCase();
      let gender = '';
      if (genderRaw === 'm' || genderRaw === 'male' || genderRaw === 'boy') gender = 'boy';
      else if (genderRaw === 'f' || genderRaw === 'female' || genderRaw === 'girl') gender = 'girl';
      
      const typeRaw = (parts[3] || '').toLowerCase();
      let employmentType = 'employee';
      if (typeRaw === 'contractor') employmentType = 'contractor';
      else if (typeRaw === 'intern') employmentType = 'intern';
      
      const skillsRaw = parts[4] || '';
      const skills = skillsRaw ? skillsRaw.split('|').map(s => {
        const [sName, sRating] = s.split(':');
        return {
          name: (sName || '').trim(),
          rating: (parseInt((sRating || '').trim(), 10) || 1)
        };
      }).filter(s => s.name) : [];
      
      return {
        name,
        role,
        gender,
        employmentType,
        skills,
        isPlaceholder: bulkIsPlaceholder,
        isFutureJoiner: bulkIsFutureJoiner
      };
    });

    onBulkAdd(parsedData, {
      assignProject: bulkAssignProject,
      projectId: bulkProjectId,
      startDate: bulkStartDate,
      endDate: bulkEndDate,
      hoursPerWeek: bulkHours,
      isPlaceholder: bulkIsPlaceholder,
      isFutureJoiner: bulkIsFutureJoiner
    });
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
              Add New Resource
            </h2>
            <p className="text-xs font-bold text-slate-400 mt-1">Add to your team's capacity.</p>
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
            Single Resource
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
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Full Name *</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Role</label>
                  <input 
                    type="text" 
                    list="existing-roles"
                    value={role}
                    onChange={e => setRole(e.target.value)}
                    placeholder="e.g. Frontend Developer"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                  <datalist id="existing-roles">
                    {existingRoles.map(r => (
                      <option key={r} value={r} />
                    ))}
                  </datalist>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Company Start Date</label>
                  <input 
                    type="date" 
                    value={companyStartDate}
                    onChange={e => setCompanyStartDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Skills</label>
                <div className="flex items-end gap-2 mb-3">
                  <div className="flex-1">
                    <input 
                      type="text" 
                      list="existing-skills"
                      value={newSkillName}
                      onChange={e => setNewSkillName(e.target.value)}
                      placeholder="e.g. React"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddSkill();
                        }
                      }}
                    />
                    <datalist id="existing-skills">
                      {existingSkills.map(s => (
                        <option key={s} value={s} />
                      ))}
                    </datalist>
                  </div>
                  <div className="w-24">
                    <select 
                      value={newSkillRating} 
                      onChange={e => setNewSkillRating(Number(e.target.value) as SkillRating)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    >
                      <option value={1}>1 - Basic</option>
                      <option value={2}>2 - Intermediate</option>
                      <option value={3}>3 - Expert</option>
                    </select>
                  </div>
                  <button 
                    type="button"
                    onClick={handleAddSkill}
                    className="px-3 py-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors shrink-0"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>

                {skills.length > 0 && (
                  <div className="flex flex-col gap-2">
                    {skills.map((skill, index) => (
                      <div key={index} className="flex items-center justify-between p-2.5 border border-slate-100 rounded-lg bg-slate-50/50 hover:bg-white transition-colors group">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-slate-700">{skill.name}</span>
                          <div className="flex items-center gap-1 mt-1">
                            {Array.from({ length: 3 }).map((_, i) => (
                              <button
                                key={i}
                                type="button"
                                onClick={() => handleUpdateSkillRating(index, (i + 1) as SkillRating)}
                                className={`transition-colors ${i < skill.rating ? "text-amber-400" : "text-slate-200 hover:text-amber-200"}`}
                              >
                                <Star className={`w-3 h-3 ${i < skill.rating ? "fill-current" : ""}`} />
                              </button>
                            ))}
                          </div>
                        </div>
                        <button 
                          type="button"
                          onClick={() => handleRemoveSkill(index)}
                          className="p-1 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded transition-all opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Team</label>
                  <select 
                    value={teamId}
                    onChange={e => setTeamId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  >
                    {teams.map(team => (
                      <option key={team.id} value={team.id}>{team.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Employment Type</label>
                  <select 
                    value={employmentType}
                    onChange={e => setEmploymentType(e.target.value as EmploymentType)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  >
                    <option value="employee">Employee</option>
                    <option value="contractor">Contractor</option>
                    <option value="intern">Intern</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-end pb-1">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <div className={`w-10 h-6 rounded-full transition-colors relative ${isManager ? 'bg-indigo-600' : 'bg-slate-200'}`}>
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${isManager ? 'left-5' : 'left-1'}`} />
                      <input 
                        type="checkbox" 
                        className="sr-only" 
                        checked={isManager}
                        onChange={e => setIsManager(e.target.checked)}
                      />
                    </div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Tagged as Manager</span>
                  </label>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={isPlaceholder}
                      onChange={e => setIsPlaceholder(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                    />
                    <span className="text-sm font-bold text-slate-700">Unidentified / placeholder resource</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={isFutureJoiner}
                      onChange={e => setIsFutureJoiner(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                    />
                    <span className="text-sm font-bold text-slate-700">Future joiner</span>
                  </label>
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Placeholder or future joiner allocations will be created as <span className="font-black uppercase">Planned</span>.
              </p>

              <div className="pt-4 border-t border-slate-100">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={assignProject}
                    onChange={e => setAssignProject(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                  />
                  <span className="text-sm font-bold text-slate-700">Assign to project initially</span>
                </label>
              </div>

              {assignProject && (
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Project *</label>
                    <select 
                      value={projectId}
                      onChange={e => setProjectId(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    >
                      {projects
                        .filter(p => !isPlaceholder || p.upcoming)
                        .map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                    </select>
                    {isPlaceholder && projects.every(p => !p.upcoming) && (
                      <p className="mt-2 text-xs text-rose-500">There are no upcoming projects available for placeholder resources.</p>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Start Date *</label>
                      <input 
                        type="date" 
                        value={startDate}
                        onChange={e => setStartDate(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">End Date *</label>
                      <input 
                        type="date" 
                        value={endDate}
                        onChange={e => setEndDate(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Hours Per Week</label>
                    <input 
                      type="number" 
                      value={hours}
                      onChange={e => setHours(parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid gap-3">
                <div className="flex flex-col gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <label className="inline-flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={bulkAssignProject}
                      onChange={e => setBulkAssignProject(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                    />
                    <span className="text-sm font-semibold text-slate-700">Assign all bulk resources to a project</span>
                  </label>

                  <div className={bulkAssignProject ? 'grid grid-cols-1 gap-4 md:grid-cols-2' : 'hidden'}>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Project</label>
                      <select
                        value={bulkProjectId}
                        onChange={e => setBulkProjectId(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                      >
                        {projects
                          .filter(p => !bulkIsPlaceholder || p.upcoming)
                          .map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                      </select>
                      {bulkIsPlaceholder && projects.every(p => !p.upcoming) && (
                        <p className="mt-2 text-xs text-rose-500">Placeholder resources can only be assigned to upcoming projects.</p>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Start Date</label>
                        <input
                          type="date"
                          value={bulkStartDate}
                          onChange={e => setBulkStartDate(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">End Date</label>
                        <input
                          type="date"
                          value={bulkEndDate}
                          onChange={e => setBulkEndDate(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Hours Per Week</label>
                      <input
                        type="number"
                        value={bulkHours}
                        onChange={e => setBulkHours(parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <p className="text-sm font-semibold text-slate-700">Bulk member type</p>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                      <label className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${bulkMemberKind === 'standard' ? 'border-indigo-500 bg-indigo-50 text-slate-900' : 'border-slate-200 bg-white text-slate-700'} cursor-pointer`}>
                        <input
                          type="radio"
                          name="bulk-member-type"
                          value="standard"
                          checked={bulkMemberKind === 'standard'}
                          onChange={() => setBulkMemberKind('standard')}
                          className="h-4 w-4 text-indigo-600 border-slate-300"
                        />
                        <span>Standard resources</span>
                      </label>
                      <label className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${bulkMemberKind === 'future' ? 'border-indigo-500 bg-indigo-50 text-slate-900' : 'border-slate-200 bg-white text-slate-700'} cursor-pointer`}>
                        <input
                          type="radio"
                          name="bulk-member-type"
                          value="future"
                          checked={bulkMemberKind === 'future'}
                          onChange={() => setBulkMemberKind('future')}
                          className="h-4 w-4 text-indigo-600 border-slate-300"
                        />
                        <span>New joinees / future joiners</span>
                      </label>
                      <label className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${bulkMemberKind === 'placeholder' ? 'border-indigo-500 bg-indigo-50 text-slate-900' : 'border-slate-200 bg-white text-slate-700'} cursor-pointer`}>
                        <input
                          type="radio"
                          name="bulk-member-type"
                          value="placeholder"
                          checked={bulkMemberKind === 'placeholder'}
                          onChange={() => setBulkMemberKind('placeholder')}
                          className="h-4 w-4 text-indigo-600 border-slate-300"
                        />
                        <span>Unknown / placeholder resources</span>
                      </label>
                    </div>
                  </div>

                  <p className="text-xs text-slate-500">
                    When assigned, future joiner and placeholder allocations are created as <span className="font-black uppercase">Planned</span>.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-500 leading-relaxed">
                  Enter one resource per line using the comma-separated format below. Only name is required.
                </p>
                <div className="bg-slate-100 p-3 rounded-lg border border-slate-200">
                  <p className="text-[10px] font-mono text-slate-600 font-medium">Format: Name, Role, Gender (M/F), Type (Employee/Contractor/Intern), Skill1:Rating|Skill2:Rating</p>
                </div>
              </div>
              <textarea
                value={bulkNames}
                onChange={e => setBulkNames(e.target.value)}
                rows={10}
                placeholder={"John Doe, Frontend Dev, M, Contractor, React:3|Node:2\nJane Smith, UX Designer, F, Employee, Figma:3\nAlice Johnson"}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none font-mono placeholder:text-slate-400/70 leading-relaxed"
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
            disabled={activeTab === 'single'
              ? (!name.trim() && !isPlaceholder) || (assignProject && (!projectId || !startDate || !endDate))
              : !bulkNames.trim() || (bulkAssignProject && (!bulkProjectId || !bulkStartDate || !bulkEndDate))}
            className="flex-1 px-4 py-2.5 rounded-xl bg-indigo-600 text-sm font-bold text-white hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4" />
            {activeTab === 'single' ? 'Add Resource' : 'Add Resources'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

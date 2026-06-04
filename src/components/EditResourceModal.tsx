import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Plus, Trash2, Camera, UploadCloud, Star } from 'lucide-react';
import { TeamMember, Team, SkillRating, EmploymentType, Comment, Todo, Project } from '../types';
import { Assignment } from '../types';
import Cropper from 'react-easy-crop';
import getCroppedImg from '../lib/cropImage';
import CommentHistory from './CommentHistory';
import { cn } from '../lib/utils';

interface EditResourceModalProps {
  resource: TeamMember;
  onClose: () => void;
  onUpdate: (id: string, updates: Partial<TeamMember>) => void;
  teams: Team[];
  teamMembers: TeamMember[];
  comments: Comment[];
  todos: Todo[];
  onAddComment: (comment: Omit<Comment, 'id' | 'createdAt' | 'authorId' | 'authorName'>) => Comment;
  onAddTodo: (todo: Omit<Todo, 'id' | 'createdAt'>) => Todo;
  projects: Project[];
  assignments?: Assignment[];
  privacyMode: boolean;
}

export default function EditResourceModal({ 
  resource, 
  onClose, 
  onUpdate, 
  teams, 
  teamMembers,
  comments,
  todos,
  onAddComment,
  onAddTodo,
  projects,
  assignments,
  privacyMode
}: EditResourceModalProps) {
  const [name, setName] = useState(resource.name);
  const [role, setRole] = useState(resource.role);
  const [teamId, setTeamId] = useState(resource.teamId);
  const [managerId, setManagerId] = useState(resource.managerId || '');
  const [isManager, setIsManager] = useState(resource.isManager || false);
  const [companyStartDate, setCompanyStartDate] = useState(resource.companyStartDate || '');
  const [lastWorkingDay, setLastWorkingDay] = useState(resource.lastWorkingDay || '');
  
  const [skills, setSkills] = useState<{name: string; rating: SkillRating}[]>(resource.skills || []);
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillRating, setNewSkillRating] = useState<SkillRating>(1);

  const existingRoles = useMemo(() => {
    return Array.from(new Set(teamMembers.map(m => m.role))).sort();
  }, [teamMembers]);

  const existingSkillsList = useMemo(() => {
    const skillSet = new Set<string>();
    teamMembers.forEach(m => {
      m.skills.forEach(s => skillSet.add(s.name));
    });
    return Array.from(skillSet).sort();
  }, [teamMembers]);
  
  const [gender, setGender] = useState<'boy' | 'girl' | ''>('');
  const [employmentType, setEmploymentType] = useState<EmploymentType>(resource.employmentType || 'employee');
  const [avatar, setAvatar] = useState(resource.avatar);
  const [reportSearchQuery, setReportSearchQuery] = useState('');
  
  const directReports = useMemo(() => {
    return teamMembers.filter(m => m.managerId === resource.id);
  }, [teamMembers, resource.id]);

  const potentialReports = useMemo(() => {
    if (!reportSearchQuery.trim()) return [];
    const query = reportSearchQuery.toLowerCase();
    return teamMembers.filter(m => 
      m.id !== resource.id && 
      m.managerId !== resource.id &&
      (m.name.toLowerCase().includes(query) || m.role.toLowerCase().includes(query))
    ).slice(0, 5);
  }, [teamMembers, resource.id, reportSearchQuery]);
  
  // Crop state
  const [pastedImage, setPastedImage] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const handleUpdateSkillRating = (index: number, rating: SkillRating) => {
    setSkills(prev => prev.map((s, i) => i === index ? { ...s, rating } : s));
  };

  const handleAddSkill = () => {
    if (!newSkillName.trim()) return;
    const existing = skills.find(s => s.name.toLowerCase() === newSkillName.trim().toLowerCase());
    if (existing) {
      setSkills(skills.map(s => s.name.toLowerCase() === existing.name.toLowerCase() ? { ...s, rating: newSkillRating } : s));
    } else {
      setSkills([...skills, { name: newSkillName.trim(), rating: newSkillRating }]);
    }
    setNewSkillName('');
    setNewSkillRating(1);
  };

  const handleRemoveSkill = (index: number) => {
    setSkills(skills.filter((_, i) => i !== index));
  };

  const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleSaveCrop = async () => {
    try {
      if (pastedImage && croppedAreaPixels) {
        const croppedImage = await getCroppedImg(pastedImage, croppedAreaPixels);
        setAvatar(croppedImage);
        setPastedImage(null);
        setGender(''); // override gender if custom image
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const blob = items[i].getAsFile();
        if (blob) {
          const url = URL.createObjectURL(blob);
          setPastedImage(url);
        }
      }
    }
  };

  const handleSubmit = () => {
    if (!name.trim()) return;

    let finalAvatar = avatar;
    if (gender === 'boy') {
      finalAvatar = `https://avatar.iran.liara.run/public/boy?username=${encodeURIComponent(name.trim())}`;
    } else if (gender === 'girl') {
      finalAvatar = `https://avatar.iran.liara.run/public/girl?username=${encodeURIComponent(name.trim())}`;
    }

    onUpdate(resource.id, {
      name: name.trim(),
      role: role.trim() || 'Team Member',
      skills: skills,
      teamId,
      managerId: managerId || undefined,
      isManager,
      companyStartDate: companyStartDate || undefined,
      lastWorkingDay: lastWorkingDay || undefined,
      employmentType,
      avatar: finalAvatar
    });
    
    onClose();
  };

  const handleAddReport = (memberId: string) => {
    onUpdate(memberId, { managerId: resource.id });
    setReportSearchQuery('');
  };

  const handleRemoveReport = (memberId: string) => {
    onUpdate(memberId, { managerId: undefined });
  };

  const memberAssignments = useMemo(() => {
    return (assignments || []).filter(a => a.memberId === resource.id).map(a => ({
      ...a,
      projectName: projects.find(p => p.id === a.projectId)?.name || a.projectId
    }));
  }, [assignments, resource.id, projects]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm" onPaste={handlePaste}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-xl w-full max-w-6xl overflow-hidden flex flex-col h-[90vh]"
      >
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white relative z-10">
          <div>
            <h2 className="text-lg font-black text-slate-800 tracking-tight flex items-center gap-2 uppercase">
              Resource Explorer
            </h2>
            <p className="text-[10px] font-bold text-slate-500 mt-0.5 tracking-wider uppercase opacity-60">Manage details, see activity & track tasks</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          {/* Main Info Form */}
          <div className="flex-1 overflow-y-auto p-8 border-r border-slate-100 bg-white">
            <div className="flex flex-col md:flex-row gap-10">
              <div className="w-full md:w-48 flex flex-col items-center gap-6">
                <div className="w-40 h-40 rounded-3xl overflow-hidden bg-slate-100 border-4 border-white shadow-2xl shadow-indigo-100/50 relative group">
                  <img 
                    src={gender === 'boy' ? `https://avatar.iran.liara.run/public/boy?username=${encodeURIComponent(name.trim() || 'user')}` : gender === 'girl' ? `https://avatar.iran.liara.run/public/girl?username=${encodeURIComponent(name.trim() || 'user')}` : avatar} 
                    alt="" 
                    className="w-full h-full object-cover" 
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all backdrop-blur-[2px]">
                    <span className="text-white text-[10px] font-black uppercase tracking-widest text-center px-4 leading-relaxed">Paste to Change<br/>(Ctrl+V)</span>
                  </div>
                </div>

                <div className="w-full space-y-4">
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Identity Mask</label>
                    <div className="flex justify-center gap-1 p-1 bg-slate-100 rounded-xl">
                      <button onClick={() => setGender('boy')} className={cn("flex-1 px-2 py-1.5 text-[10px] font-black uppercase rounded-lg transition-all", gender === 'boy' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-400 hover:text-slate-600')}>Male</button>
                      <button onClick={() => setGender('girl')} className={cn("flex-1 px-2 py-1.5 text-[10px] font-black uppercase rounded-lg transition-all", gender === 'girl' ? 'bg-white text-rose-700 shadow-sm' : 'text-slate-400 hover:text-slate-600')}>Female</button>
                      <button onClick={() => setGender('')} className={cn("flex-1 px-2 py-1.5 text-[10px] font-black uppercase rounded-lg transition-all", gender === '' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-600')}>Off</button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex-1 space-y-8">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Display Name</label>
                  <input 
                    type="text" 
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                  />
                </div>
                
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Job Role</label>
                    <input 
                      type="text" 
                      list="edit-existing-roles"
                      value={role}
                      onChange={e => setRole(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                    />
                    <datalist id="edit-existing-roles">
                      {existingRoles.map(r => (
                        <option key={r} value={r} />
                      ))}
                    </datalist>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Assigned Unit</label>
                    <select 
                      value={teamId}
                      onChange={e => setTeamId(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all appearance-none"
                    >
                      {teams.map(team => (
                        <option key={team.id} value={team.id}>{team.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Start Date</label>
                    <input 
                      type="date" 
                      value={companyStartDate}
                      onChange={e => setCompanyStartDate(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Contract End</label>
                    <input 
                      type="date" 
                      value={lastWorkingDay}
                      onChange={e => setLastWorkingDay(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Employment</label>
                    <div className="flex p-1 bg-slate-100 rounded-xl">
                      {['employee', 'contractor', 'intern'].map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setEmploymentType(type as EmploymentType)}
                          className={cn(
                            "flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-tight transition-all",
                            employmentType === type ? "bg-white text-indigo-700 shadow-sm" : "text-slate-400 hover:text-slate-600"
                          )}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-end pb-1">
                    <label className="flex items-center gap-3 cursor-pointer group bg-slate-50 p-2 rounded-xl border border-slate-200 w-full">
                      <div className={cn("w-10 h-6 rounded-full transition-all relative shrink-0", isManager ? 'bg-indigo-600' : 'bg-slate-300')}>
                        <div className={cn("absolute top-1 w-4 h-4 bg-white rounded-full transition-all", isManager ? 'left-5' : 'left-1')} />
                        <input 
                          type="checkbox" 
                          className="sr-only" 
                          checked={isManager}
                          onChange={e => setIsManager(e.target.checked)}
                        />
                      </div>
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Manager Permissions</span>
                    </label>
                  </div>
                </div>

                <div className="space-y-6 pt-6 border-t border-slate-100">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Direct Supervisor</label>
                    <select 
                      value={managerId}
                      onChange={e => setManagerId(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                    >
                      <option value="">Ungoverned</option>
                      {teamMembers.filter(m => m.id !== resource.id && m.isManager).map(m => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                      ))}
                    </select>
                  </div>

                  {isManager && (
                    <div className="space-y-4 p-5 bg-indigo-50/30 rounded-2xl border border-indigo-100/50">
                      <div className="flex items-center justify-between">
                        <label className="block text-[10px] font-black text-indigo-600 uppercase tracking-widest">Team Composition ({directReports.length})</label>
                      </div>
                      
                      <div className="relative">
                        <div className="flex items-center bg-white border border-indigo-200/50 rounded-xl px-4 py-2 focus-within:ring-4 focus-within:ring-indigo-500/10 transition-all">
                          <Plus className="w-4 h-4 text-indigo-400 mr-2" />
                          <input 
                            type="text" 
                            placeholder="Add person to this reporting line..." 
                            className="bg-transparent border-none outline-none text-xs w-full py-1 font-bold text-slate-700"
                            value={reportSearchQuery}
                            onChange={(e) => setReportSearchQuery(e.target.value)}
                          />
                        </div>
                        
                        <AnimatePresence>
                          {potentialReports.length > 0 && (
                            <motion.div 
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              className="absolute left-0 right-0 top-full mt-2 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 overflow-hidden p-1"
                            >
                              {potentialReports.map(m => (
                                <button
                                  key={m.id}
                                  onClick={() => handleAddReport(m.id)}
                                  className="w-full px-3 py-2 flex items-center gap-3 hover:bg-indigo-50 transition-all text-left rounded-lg group"
                                >
                                  <img src={m.avatar} alt="" className="w-8 h-8 rounded-full bg-slate-100" />
                                  <div>
                                    <p className="text-xs font-black text-slate-900 group-hover:text-indigo-700">{m.name}</p>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase">{m.role}</p>
                                  </div>
                                </button>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {directReports.map(report => (
                          <div key={report.id} className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-white border border-indigo-100/50 group hover:border-indigo-300 transition-all">
                            <div className="flex items-center gap-2 min-w-0">
                              <img src={report.avatar} alt="" className="w-7 h-7 rounded-full shrink-0" />
                              <div className="min-w-0">
                                <p className="text-[11px] font-black text-slate-700 truncate">{report.name}</p>
                                <p className="text-[9px] font-bold text-slate-400 uppercase truncate">{report.role}</p>
                              </div>
                            </div>
                            <button 
                              onClick={() => handleRemoveReport(report.id)}
                              className="p-1 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-4 pt-6 border-t border-slate-100">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Skill Inventory</label>
                  <div className="mt-6">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Allocations</label>
                    <div className="space-y-2">
                      {memberAssignments.length === 0 && (
                        <div className="text-[10px] text-slate-500">No allocations found for this resource.</div>
                      )}
                      {memberAssignments.map(a => (
                        <div key={a.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                          <div>
                            <div className="text-sm font-black text-slate-800">{a.projectName}</div>
                            <div className="text-[10px] text-slate-500">{a.startDate} → {a.endDate}</div>
                          </div>
                          <div className="text-[10px] text-slate-500">
                            Last updated: {a.lastUpdated ? new Date(a.lastUpdated).toLocaleString() : '—'}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex items-end gap-3">
                    <div className="flex-1">
                      <input 
                        type="text" 
                        list="edit-existing-skills"
                        value={newSkillName}
                        onChange={e => setNewSkillName(e.target.value)}
                        placeholder="Expertise..."
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddSkill();
                          }
                        }}
                      />
                      <datalist id="edit-existing-skills">
                        {existingSkillsList.map(s => (
                          <option key={s} value={s} />
                        ))}
                      </datalist>
                    </div>
                    <div className="w-32">
                      <select 
                        value={newSkillRating} 
                        onChange={e => setNewSkillRating(Number(e.target.value) as SkillRating)}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all appearance-none"
                      >
                        <option value={1}>Basic</option>
                        <option value={2}>Mid</option>
                        <option value={3}>Expert</option>
                      </select>
                    </div>
                    <button 
                      onClick={handleAddSkill}
                      className="p-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all shrink-0 shadow-lg shadow-indigo-100"
                    >
                      <Plus className="w-5 h-5 font-black" />
                    </button>
                  </div>

                  {skills.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {skills.map((skill, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border border-slate-100 rounded-xl bg-slate-50/50 hover:bg-white hover:border-indigo-200 transition-all group">
                          <div className="flex flex-col">
                            <span className="text-[11px] font-black text-slate-700 uppercase tracking-tight">{skill.name}</span>
                            <div className="flex items-center gap-1 mt-1">
                              {Array.from({ length: 3 }).map((_, i) => (
                                <button
                                  key={i}
                                  onClick={() => handleUpdateSkillRating(index, (i + 1) as SkillRating)}
                                  className={`transition-colors ${i < skill.rating ? "text-amber-400" : "text-slate-200 hover:text-amber-200"}`}
                                >
                                  <Star className={`w-3 h-3 ${i < skill.rating ? "fill-current" : ""}`} />
                                </button>
                              ))}
                            </div>
                          </div>
                          <button 
                            onClick={() => handleRemoveSkill(index)}
                            className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Sidebar - Comments & Activity */}
          <div className="w-full md:w-96 flex flex-col p-8 bg-slate-50">
            <CommentHistory 
              entityId={resource.id}
              comments={comments}
              todos={todos}
              members={teamMembers}
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
                Commit Changes
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {pastedImage && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] bg-black/90 flex flex-col items-center justify-center p-4 md:p-12"
          >
            <div className="relative w-full max-w-lg aspect-square bg-slate-800 rounded-xl overflow-hidden shadow-2xl">
              <Cropper
                image={pastedImage}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
              />
            </div>
            
            <div className="mt-6 flex items-center gap-4 w-full max-w-lg bg-slate-800 p-4 rounded-xl">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest shrink-0">Zoom</span>
              <input
                type="range"
                value={zoom}
                min={1}
                max={3}
                step={0.1}
                aria-labelledby="Zoom"
                onChange={(e) => setZoom(Number(e.target.value))}
                className="flex-1 accent-indigo-500"
              />
            </div>
            
            <div className="flex gap-4 mt-8 w-full max-w-lg">
              <button 
                onClick={() => setPastedImage(null)}
                className="flex-1 px-4 py-3 rounded-xl bg-slate-800 text-sm font-bold text-white hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveCrop}
                className="flex-1 px-4 py-3 rounded-xl bg-indigo-600 text-sm font-bold text-white hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/20"
              >
                Crop & Save
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

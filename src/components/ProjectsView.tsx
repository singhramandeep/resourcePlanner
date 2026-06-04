/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState, useEffect } from 'react';
import { MOCK_PROJECTS, MOCK_TEAM_MEMBERS } from '../mockData';
import { Assignment, Project, TeamMember, ProjectGroup, AssignmentStatus, EmploymentType } from '../types';
import { 
  format, 
  parseISO, 
  isAfter, 
  isBefore, 
  eachMonthOfInterval, 
  eachWeekOfInterval,
  startOfWeek,
  endOfWeek,
  startOfYear, 
  endOfYear,
  isWithinInterval,
  startOfMonth,
  endOfMonth,
  differenceInDays,
  isSameDay,
  areIntervalsOverlapping,
  isSameMonth,
  isSameWeek
} from 'date-fns';
import { Briefcase, Calendar, Users, ChevronLeft, ChevronRight, Info, Trash2, ArrowUp, ArrowDown, Edit2, FolderPlus, X, Filter, ArrowRight, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import AllocationModal from './AllocationModal';
import { obfuscate } from '../lib/utils';

interface ProjectsViewProps {
  members: TeamMember[];
  projects: Project[];
  assignments: Assignment[];
  projectGroups: ProjectGroup[];
  selectedProjectId: string | null;
  selectedProjectGroupId: string | null;
  onAddProjectGroup: (name: string) => void;
  onDeleteProject: (id: string) => void;
  onUpdateProject: (id: string, updates: Partial<Project>) => void;
  onBulkDelete?: (ids: string[]) => void;
  onEditProject: (project: Project) => void;
  currentYear: number;
  setCurrentYear: React.Dispatch<React.SetStateAction<number>>;
  viewMode: 'monthly' | 'weekly';
  setViewMode: React.Dispatch<React.SetStateAction<'monthly' | 'weekly'>>;
  onAddAssignment: (memberId: string, projectId: string, hours: number, date: Date, mode: 'month' | 'week', status?: AssignmentStatus, startDate?: string, endDate?: string) => void;
  onUpdateAssignment: (id: string, updates: Partial<Assignment>) => void;
  onBulkUpdateAssignments?: (ids: string[], updates: Partial<Assignment>) => void;
  onDeleteAssignment: (id: string, date: Date, mode: 'month' | 'week') => void;
  onRemoveAssignmentEntirely: (id: string) => void;
  onSwapAssignmentMember: (assignmentId: string, newMemberId: string) => void;
  onUnassignAssignment: (assignmentId: string) => void;
  onSwapAssignmentToNewJoiner: (assignmentId: string) => void;
  onAddProject: () => void;
  onOpenAddResourceModal: (projectId?: string) => void;
  onEditMember: (member: TeamMember) => void;
  privacyMode: boolean;
  searchQuery: string;
}

type SortOption = 'name' | 'startDate' | 'utilization';

export default function ProjectsView({ 
  members, 
  projects, 
  assignments, 
  projectGroups,
  selectedProjectId,
  selectedProjectGroupId,
  onAddProjectGroup,
  onDeleteProject, 
  onUpdateProject, 
  onBulkDelete, 
  onEditProject,
  currentYear,
  setCurrentYear,
  viewMode,
  setViewMode,
  onAddAssignment,
  onUpdateAssignment,
  onBulkUpdateAssignments,
  onDeleteAssignment,
  onRemoveAssignmentEntirely,
  onSwapAssignmentMember,
  onUnassignAssignment,
  onSwapAssignmentToNewJoiner,
  onAddProject,
  onOpenAddResourceModal,
  onEditMember,
  privacyMode,
  searchQuery
}: ProjectsViewProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<SortOption>('name');
  const [sortParam, setSortParam] = useState<'asc'|'desc'>('asc');
  const [isAddingGroup, setIsAddingGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [groupByGroup, setGroupByGroup] = useState(() => {
    const saved = localStorage.getItem('projects_groupByGroup');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [collapsedMetadata, setCollapsedMetadata] = useState(() => {
    const saved = localStorage.getItem('projects_collapsedMetadata');
    return saved !== null ? JSON.parse(saved) : false;
  });
  const [showBulkAddMembers, setShowBulkAddMembers] = useState<string | null>(null);
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [bulkMemberTypes, setBulkMemberTypes] = useState<EmploymentType[]>(['employee', 'contractor', 'intern']);
  const [statusFilter, setStatusFilter] = useState<AssignmentStatus>(() => {
    const saved = localStorage.getItem('projects_statusFilter');
    return (saved as AssignmentStatus) || 'Planned';
  });

  useEffect(() => {
    localStorage.setItem('projects_groupByGroup', JSON.stringify(groupByGroup));
  }, [groupByGroup]);

  useEffect(() => {
    localStorage.setItem('projects_collapsedMetadata', JSON.stringify(collapsedMetadata));
  }, [collapsedMetadata]);

  useEffect(() => {
    localStorage.setItem('projects_statusFilter', statusFilter);
  }, [statusFilter]);
  const [allocationModal, setAllocationModal] = useState<{ memberId: string, memberName: string, date: Date, assignmentIds?: string[] } | null>(null);
  const [dragInfo, setDragInfo] = useState<{ id?: string; projectId?: string; type: 'start' | 'end' | 'bulk-end' } | null>(null);
  const [selectedCell, setSelectedCell] = useState<{ projectId: string, date: string } | null>(null);

  useEffect(() => {
    const handleMouseUp = () => {
      setDragInfo(null);
    };
    if (dragInfo) {
      window.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'ew-resize';
      document.body.style.userSelect = 'none';
    } else {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }
    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, [dragInfo]);

  const statusOrder: AssignmentStatus[] = ['Hard', 'Soft', 'Pending', 'Planned'];

  const filteredAssignments = useMemo(() => {
    const filterIdx = statusOrder.indexOf(statusFilter);
    const allowedStatuses = statusOrder.slice(0, filterIdx + 1);
    return assignments.filter(a => allowedStatuses.includes(a.status));
  }, [assignments, statusFilter]);

  const handleAddGroup = () => {
    if (!newGroupName.trim()) return;
    onAddProjectGroup(newGroupName.trim());
    setNewGroupName('');
    setIsAddingGroup(false);
  };

  const months = useMemo(() => {
    return eachMonthOfInterval({
      start: startOfYear(new Date(currentYear, 0, 1)),
      end: endOfYear(new Date(currentYear, 0, 1))
    });
  }, [currentYear]);

  const weeks = useMemo(() => {
    return eachWeekOfInterval({
      start: startOfYear(new Date(currentYear, 0, 1)),
      end: endOfYear(new Date(currentYear, 0, 1))
    });
  }, [currentYear]);

  const intervals = viewMode === 'monthly' ? months : weeks;

  const toggleSelectAll = () => {
    if (selectedIds.size === projects.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(projects.map(m => m.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const handleBulkDelete = () => {
    if (onBulkDelete && selectedIds.size > 0) {
      onBulkDelete(Array.from(selectedIds));
      setSelectedIds(new Set());
    }
  };

  const groupedProjects = useMemo(() => {
    let list = [...projects];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      list = list.filter(p => 
        p.name.toLowerCase().includes(query) || 
        p.client?.toLowerCase().includes(query) ||
        p.code?.toLowerCase().includes(query)
      );
    }

    if (selectedProjectId) {
      list = list.filter(p => p.id === selectedProjectId);
    } else if (selectedProjectGroupId) {
      list = list.filter(p => p.groupId === selectedProjectGroupId);
    }

    list.sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else if (sortBy === 'startDate') {
        const dateA = a.startDate ? new Date(a.startDate).getTime() : Infinity;
        const dateB = b.startDate ? new Date(b.startDate).getTime() : Infinity;
        comparison = dateA - dateB;
      } else if (sortBy === 'utilization') {
        const utilA = assignments.filter(asg => asg.projectId === a.id).reduce((acc, asg) => acc + asg.hoursPerWeek, 0);
        const utilB = assignments.filter(asg => asg.projectId === b.id).reduce((acc, asg) => acc + asg.hoursPerWeek, 0);
        comparison = utilA - utilB;
      }
      return sortParam === 'asc' ? comparison : -comparison;
    });

    if (!groupByGroup && !selectedProjectGroupId) return [{ id: 'none', name: 'All Projects', projects: list }];

    const groups: { [key: string]: { id: string, name: string, projects: Project[] } } = {};
    
    // Add known groups
    projectGroups.forEach(g => {
      groups[g.id] = { ...g, projects: [] };
    });
    // Upcoming projects group
    const upcomingId = 'upcoming';
    groups[upcomingId] = { id: upcomingId, name: 'Upcoming Projects', projects: [] };
    
    // Unassigned group
    const unassignedId = 'unassigned';
    groups[unassignedId] = { id: unassignedId, name: 'Unassigned', projects: [] };

    list.forEach(p => {
      if (p.upcoming) {
        groups[upcomingId].projects.push(p);
        return;
      }

      const gId = p.groupId || unassignedId;
      if (groups[gId]) {
        groups[gId].projects.push(p);
      } else {
        groups[unassignedId].projects.push(p);
      }
    });

    return Object.values(groups).filter(g => g.projects.length > 0);
  }, [projects, sortBy, sortParam, assignments, groupByGroup, projectGroups, selectedProjectId, selectedProjectGroupId, searchQuery]);

  const today = useMemo(() => new Date(), []);
  const todayMarker = useMemo(() => {
    const todayIndex = intervals.findIndex(p => {
      const start = viewMode === 'monthly' ? startOfMonth(p) : startOfWeek(p);
      const end = viewMode === 'monthly' ? endOfMonth(p) : endOfWeek(p);
      return isWithinInterval(today, { start, end });
    });

    if (todayIndex === -1) return null;

    const period = intervals[todayIndex];
    const periodStart = viewMode === 'monthly' ? startOfMonth(period) : startOfWeek(period);
    const periodEnd = viewMode === 'monthly' ? endOfMonth(period) : endOfWeek(period);
    
    const days = differenceInDays(periodEnd, periodStart) + 1;
    const progress = differenceInDays(today, periodStart);
    const subProgress = (progress / days) * 100;

    return { todayIndex, subProgress };
  }, [intervals, today, viewMode]);

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-4 border-b border-slate-100 flex flex-col gap-4 bg-slate-50/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-start gap-0.5 border-r border-slate-200 pr-4 mr-2">
              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest leading-none">Today</span>
              <span className="text-xs font-black text-indigo-600 leading-none">{format(today, 'MMM d, yyyy')}</span>
            </div>
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-widest">Project Roadmap & Allocation</h2>
            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-2 py-1">
              <button onClick={() => setCurrentYear(y => y - 1)} className="hover:bg-slate-50 p-0.5 rounded transition-colors">
                <ChevronLeft className="w-4 h-4 text-slate-400" />
              </button>
              <span className="text-xs font-bold text-slate-700 min-w-[32px] text-center">{currentYear}</span>
              <button onClick={() => setCurrentYear(y => y + 1)} className="hover:bg-slate-50 p-0.5 rounded transition-colors">
                <ChevronLeft className="w-4 h-4 text-slate-400 rotate-180" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500">View:</span>
              <div className="flex items-center p-0.5 bg-slate-100 rounded-lg">
                <button 
                  onClick={() => setViewMode('monthly')}
                  className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${viewMode === 'monthly' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  MONTH
                </button>
                <button 
                  onClick={() => setViewMode('weekly')}
                  className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${viewMode === 'weekly' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  WEEK
                </button>
              </div>
            </div>

            <div className="h-4 w-[1px] bg-slate-200 mx-1" />

            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-500 flex items-center gap-1.5 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={collapsedMetadata}
                  onChange={e => setCollapsedMetadata(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 w-3 h-3"
                />
                Compact View
              </label>
            </div>

            <div className="h-4 w-[1px] bg-slate-200 mx-1" />
            
            <div className="flex items-center gap-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 mr-1 ml-2">Bookings:</span>
              <div className="flex bg-slate-100 p-1 rounded-lg">
                {statusOrder.map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    className={`px-3 py-1 rounded-md transition-all text-[10px] font-bold ${
                      statusFilter === s 
                        ? 'bg-white text-indigo-600 shadow-sm' 
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="h-4 w-[1px] bg-slate-200 mx-1" />

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500">Sort by:</span>
              <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="text-xs border border-slate-200 rounded p-1 text-slate-700 font-medium"
              >
                <option value="name">Name</option>
                <option value="startDate">Start Date</option>
                <option value="utilization">Total Allocated Hours</option>
              </select>
              <button 
                onClick={() => setSortParam(p => p === 'asc' ? 'desc' : 'asc')}
                className="p-1 border border-slate-200 rounded text-slate-500 hover:bg-slate-100"
              >
                {sortParam === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
              </button>
            </div>

            <div className="h-4 w-[1px] bg-slate-200 mx-1" />

            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-500 flex items-center gap-1.5 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={groupByGroup}
                  onChange={e => setGroupByGroup(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 w-3 h-3"
                />
                Group by Project Group
              </label>
            </div>

            <div className="h-4 w-[1px] bg-slate-200 mx-1" />

            <div className="flex items-center gap-2">
              <AnimatePresence mode="wait">
                {isAddingGroup ? (
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <input 
                      autoFocus
                      type="text" 
                      placeholder="Group Name..."
                      value={newGroupName}
                      onChange={e => setNewGroupName(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleAddGroup()}
                      className="text-xs border border-slate-200 rounded px-2 py-1 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none w-32"
                    />
                    <button 
                      onClick={handleAddGroup}
                      className="px-2 py-1 bg-indigo-600 text-white text-[10px] font-bold rounded hover:bg-indigo-700 transition-colors"
                    >
                      Save
                    </button>
                    <button 
                      onClick={() => setIsAddingGroup(false)}
                      className="px-2 py-1 bg-slate-100 text-slate-500 text-[10px] font-bold rounded hover:bg-slate-200 transition-colors"
                    >
                      Cancel
                    </button>
                  </motion.div>
                ) : (
                  <button 
                    onClick={() => setIsAddingGroup(true)}
                    className="flex items-center gap-1.5 text-[10px] font-bold text-indigo-600 hover:text-indigo-700 uppercase tracking-wider"
                  >
                    <FolderPlus className="w-3.5 h-3.5" />
                    New Group
                  </button>
                )}
              </AnimatePresence>
            </div>
            
            {selectedIds.size > 0 && (
              <div className="flex items-center gap-3 border-l border-slate-200 pl-4">
                <span className="text-xs font-bold text-indigo-600">{selectedIds.size} selected</span>
                <button 
                  onClick={handleBulkDelete}
                  className="flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold text-white bg-rose-500 hover:bg-rose-600 px-2 py-1.5 rounded transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div 
        className="flex-1 overflow-auto relative"
        onMouseUp={() => {
          // This will be caught by bubbling if not prevented, but we can also use window event listener
        }}
      >
        {todayMarker && (
          <div 
            className="absolute top-0 bottom-0 w-[2px] bg-indigo-500/30 z-[15] pointer-events-none flex flex-col items-center shadow-[0_0_8px_rgba(79,70,229,0.2)]"
            style={{ 
              left: `${304 + todayMarker.todayIndex * 96 + (todayMarker.subProgress / 100 * 96)}px` 
            }}
          >
            <div className="bg-indigo-600 text-white text-[7px] font-black px-1.5 py-0.5 rounded-b-[3px] shadow-sm whitespace-nowrap tracking-tighter mt-[38px]">
              TODAY
            </div>
            <div className="flex-1 w-[2px] bg-indigo-500/50" />
          </div>
        )}
        <table className="w-full border-separate border-spacing-0 min-w-[max-content]">
          <thead>
            <tr className="text-left bg-white">
              <th className="p-4 w-12 text-center sticky top-0 left-0 bg-white z-50 border-b border-slate-200">
                <input 
                  type="checkbox" 
                  checked={projects.length > 0 && selectedIds.size === projects.length}
                  onChange={toggleSelectAll}
                  className="rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                />
              </th>
              <th className="p-4 pl-0 w-64 text-[10px] font-bold text-slate-500 uppercase tracking-widest sticky top-0 left-12 bg-white z-50 border-r border-b border-slate-200">Project & Metadata</th>
              {intervals.map(p => {
                const isCurrent = viewMode === 'monthly' 
                  ? isSameMonth(p, today) 
                  : isSameWeek(p, today, { weekStartsOn: 0 });
                
                return (
                  <th key={p.toISOString()} className={`p-2 w-24 text-center text-[10px] font-bold uppercase tracking-tighter border-r border-b border-slate-100 sticky top-0 z-40 ${
                    isCurrent ? 'text-indigo-600 bg-indigo-50 shadow-[inset_0_-2px_0_0_#4f46e5]' : 'text-slate-500 bg-slate-50'
                  }`}>
                    {viewMode === 'monthly' ? format(p, 'MMM') : `${format(p, 'MMM d')}`}
                    {isCurrent && (
                      <div className="text-[7px] font-black text-indigo-400 mt-0.5 leading-none">PRESENT</div>
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {groupedProjects.map(group => (
              <React.Fragment key={group.id}>
                {groupByGroup && (
                  <tr className="bg-slate-50/80">
                    <td 
                      colSpan={intervals.length + 2} 
                      className="p-2 border-y border-slate-200 sticky left-0 z-10"
                    >
                      <div className="flex items-center gap-2 pl-4">
                        <Briefcase className="w-3.5 h-3.5 text-indigo-500" />
                        <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">
                          {group.name}
                        </span>
                        <span className="text-[9px] font-bold text-slate-400 bg-white border border-slate-200 px-1.5 py-0.5 rounded-full">
                          {group.projects.length}
                        </span>
                      </div>
                    </td>
                  </tr>
                )}
                {group.projects.map(project => (
                  <ProjectRow 
                    key={project.id} 
                    project={project} 
                    assignments={assignments} 
                    intervals={intervals} 
                    viewMode={viewMode}
                    collapsedMetadata={collapsedMetadata}
                    onDelete={onDeleteProject} 
                    onUpdate={onUpdateProject}
                    members={members}
                    selected={selectedIds.has(project.id)}
                    onToggleSelect={() => toggleSelect(project.id)}
                    onEditProject={() => onEditProject(project)}
                    onEditMember={onEditMember}
                    onBulkAddMembers={() => setShowBulkAddMembers(project.id)}
                    onUpdateAssignment={onUpdateAssignment}
                    onBulkUpdateAssignments={onBulkUpdateAssignments}
                    onSetAllocationModal={setAllocationModal}
                    statusFilter={statusFilter}
                    dragInfo={dragInfo}
                    setDragInfo={setDragInfo}
                    selectedCell={selectedCell}
                    setSelectedCell={setSelectedCell}
                    privacyMode={privacyMode}
                  />
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
      {/* Bulk Add Members Modal */}
      <AnimatePresence>
        {showBulkAddMembers && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div>
                  <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Bulk Add Members</h3>
                  <p className="text-xs font-bold text-slate-500">Project: {obfuscate(projects.find(p => p.id === showBulkAddMembers)?.name || '', privacyMode)}</p>
                </div>
                <button onClick={() => { setShowBulkAddMembers(null); setMemberSearchQuery(''); }} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>
              <div className="p-4 bg-slate-50 border-b border-slate-100 flex flex-col gap-3">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2">
                    <Users className="w-4 h-4 text-slate-400" />
                  </span>
                  <input 
                    type="text"
                    placeholder="Search resources by name or role..."
                    value={memberSearchQuery}
                    onChange={(e) => setMemberSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium"
                  />
                </div>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <button
                      onClick={() => onOpenAddResourceModal(showBulkAddMembers || undefined)}
                      className="px-3 py-2 rounded-xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all"
                    >
                      Add new joinee / placeholder
                    </button>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mr-1">Show:</span>
                  {(['employee', 'contractor', 'intern'] as EmploymentType[]).map(type => (
                    <button
                      key={type}
                      onClick={() => {
                        setBulkMemberTypes(prev => 
                          prev.includes(type) 
                            ? prev.filter(t => t !== type) 
                            : [...prev, type]
                        );
                      }}
                      className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-all border ${
                        bulkMemberTypes.includes(type)
                          ? type === 'contractor' ? 'bg-rose-100 text-rose-700 border-rose-200'
                            : type === 'intern' ? 'bg-amber-100 text-amber-700 border-amber-200'
                            : 'bg-indigo-100 text-indigo-700 border-indigo-200'
                          : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {type}s
                    </button>
                  ))}
                </div>
              </div>
              <div className="p-6 max-h-[50vh] overflow-auto">
                <div className="space-y-3">
                  {members
                    .filter(m => 
                      (m.name.toLowerCase().includes(memberSearchQuery.toLowerCase()) || 
                      m.role.toLowerCase().includes(memberSearchQuery.toLowerCase())) &&
                      bulkMemberTypes.includes(m.employmentType || 'employee')
                    )
                    .map(member => {
                    const project = projects.find(p => p.id === showBulkAddMembers);
                    const isAssigned = assignments.some(a => a.projectId === showBulkAddMembers && a.memberId === member.id);
                    
                    const getTypeStyles = (type?: EmploymentType) => {
                      switch (type) {
                        case 'contractor': return 'text-rose-600';
                        case 'intern': return 'text-amber-500';
                        default: return 'text-indigo-600';
                      }
                    };

                    const getTypeBadge = (type?: EmploymentType) => {
                      switch (type) {
                        case 'contractor': return 'bg-rose-100 text-rose-700 border-rose-200';
                        case 'intern': return 'bg-amber-100 text-amber-700 border-amber-200';
                        default: return 'bg-slate-100 text-slate-600 border-slate-200';
                      }
                    };

                    return (
                      <div 
                        key={member.id}
                        className={`flex items-center justify-between p-3 rounded-xl border transition-all ${isAssigned ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-slate-200 hover:border-slate-300'}`}
                      >
                        <div className="flex items-center gap-3">
                          <img src={member.avatar} alt="" className="w-8 h-8 rounded-full bg-slate-100" />
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-black text-slate-900">{obfuscate(member.name, privacyMode)}</p>
                              {member.employmentType && member.employmentType !== 'employee' && (
                                <span className={`px-1.5 py-[1px] rounded text-[8px] font-black border tracking-wider uppercase ${getTypeBadge(member.employmentType)}`}>
                                  {member.employmentType}
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{member.role}</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => {
                            if (isAssigned) return;
                            onAddAssignment(
                              member.id,
                              showBulkAddMembers,
                              40,
                              new Date(currentYear, 0, 1),
                              viewMode === 'monthly' ? 'month' : 'week',
                              'Hard',
                              project?.startDate,
                              project?.endDate
                            );
                          }}
                          disabled={isAssigned}
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${isAssigned ? 'bg-green-100 text-green-600 cursor-default' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
                        >
                          {isAssigned ? 'Assigned' : 'Add'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end">
                <button 
                  onClick={() => { setShowBulkAddMembers(null); setMemberSearchQuery(''); }}
                  className="px-6 py-2.5 bg-slate-900 text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-slate-800 transition-all active:scale-95"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {allocationModal && (
        <AllocationModal 
          memberId={allocationModal.memberId}
          memberName={allocationModal.memberName}
          month={allocationModal.date}
          projects={projects}
          members={members}
          initialAssignments={allocationModal.assignmentIds ? assignments.filter(a => allocationModal.assignmentIds!.includes(a.id)) : undefined}
          onClose={() => setAllocationModal(null)}
          onRemove={(id) => {
            onDeleteAssignment(id, allocationModal.date, viewMode === 'monthly' ? 'month' : 'week');
            if (allocationModal.assignmentIds?.length === 1) {
              setAllocationModal(null);
            } else {
              setAllocationModal({
                ...allocationModal,
                assignmentIds: allocationModal.assignmentIds?.filter(asgId => asgId !== id)
              });
            }
          }}
          onHardDelete={(id) => {
            onRemoveAssignmentEntirely(id);
            if (allocationModal.assignmentIds?.length === 1) {
              setAllocationModal(null);
            } else {
              setAllocationModal({
                ...allocationModal,
                assignmentIds: allocationModal.assignmentIds?.filter(asgId => asgId !== id)
              });
            }
          }}
          onAddProject={onAddProject}
          onEditResource={(id) => {
            const member = members.find(m => m.id === id);
            if (member) onEditMember(member);
          }}
          onSwapMember={onSwapAssignmentMember}
          onUnassign={onUnassignAssignment}
          onSwapToNewJoiner={onSwapAssignmentToNewJoiner}
          privacyMode={privacyMode}
          onSave={(batch) => {
            batch.forEach(item => {
              if (item.id) {
                onUpdateAssignment(item.id, { 
                  projectId: item.projectId, 
                  hoursPerWeek: item.hours, 
                  status: item.status,
                  startDate: item.startDate,
                  endDate: item.endDate
                });
              } else {
                onAddAssignment(
                  allocationModal.memberId, 
                  item.projectId, 
                  item.hours, 
                  allocationModal.date, 
                  viewMode === 'monthly' ? 'month' : 'week', 
                  item.status,
                  item.startDate,
                  item.endDate
                );
              }
            });
            setAllocationModal(null);
          }}
        />
      )}
    </div>
  );
}

interface ProjectRowProps {
  key?: string;
  project: Project;
  assignments: Assignment[];
  intervals: Date[];
  viewMode: 'monthly' | 'weekly';
  collapsedMetadata: boolean;
  onDelete: (id: string) => void;
  onUpdate: (id: string, updates: Partial<Project>) => void;
  members: TeamMember[];
  selected: boolean;
  onToggleSelect: () => void;
  onEditProject: () => void;
  onBulkAddMembers: () => void;
  onUpdateAssignment: (id: string, updates: Partial<Assignment>) => void;
  onBulkUpdateAssignments?: (ids: string[], updates: Partial<Assignment>) => void;
  onSetAllocationModal: (config: { memberId: string, memberName: string, date: Date, assignmentIds?: string[] } | null) => void;
  onEditMember: (member: TeamMember) => void;
  statusFilter: AssignmentStatus;
  dragInfo: { id?: string; projectId?: string; type: 'start' | 'end' | 'bulk-end' } | null;
  setDragInfo: (info: { id?: string; projectId?: string; type: 'start' | 'end' | 'bulk-end' } | null) => void;
  selectedCell: { projectId: string, date: string } | null;
  setSelectedCell: (cell: { projectId: string, date: string } | null) => void;
  privacyMode: boolean;
}

const ProjectRow = React.memo(({ 
  project, 
  assignments, 
  intervals, 
  viewMode,
  collapsedMetadata,
  onDelete, 
  onUpdate, 
  members, 
  selected, 
  onToggleSelect, 
  onEditProject,
  onBulkAddMembers,
  onUpdateAssignment,
  onBulkUpdateAssignments,
  onSetAllocationModal,
  onEditMember,
  statusFilter,
  dragInfo,
  setDragInfo,
  selectedCell,
  setSelectedCell,
  privacyMode
}: ProjectRowProps) => {
  const statusOrder: AssignmentStatus[] = ['Hard', 'Soft', 'Pending', 'Planned'];

  const projectAssignments = useMemo(() => {
    const filterIdx = statusOrder.indexOf(statusFilter);
    const allowedStatuses = statusOrder.slice(0, filterIdx + 1);
    return assignments.filter(a => a.projectId === project.id && allowedStatuses.includes(a.status));
  }, [assignments, project.id, statusFilter]);
  
  const assignedMemberIds = useMemo(() => {
    const ids = Array.from(new Set(projectAssignments.map(a => a.memberId)));
    return ids.sort((a, b) => {
      const mA = members.find(m => m.id === a);
      const mB = members.find(m => m.id === b);
      return (mA?.name || '').localeCompare(mB?.name || '');
    });
  }, [projectAssignments, members]);

  const dates = useMemo(() => {
    // Prefer explicit project dates, otherwise derive
    const explicitStart = project.startDate ? parseISO(project.startDate) : null;
    const explicitEnd = project.endDate ? parseISO(project.endDate) : null;

    if (explicitStart && explicitEnd) return { start: explicitStart, end: explicitEnd };

    if (projectAssignments.length === 0) return { start: explicitStart, end: explicitEnd };
    let start = explicitStart || parseISO(projectAssignments[0].startDate);
    let end = explicitEnd || parseISO(projectAssignments[0].endDate);
    
    projectAssignments.forEach(a => {
      const s = parseISO(a.startDate);
      const e = parseISO(a.endDate);
      if (!explicitStart && isBefore(s, start)) start = s;
      if (!explicitEnd && isAfter(e, end)) end = e;
    });
    
    return { start, end };
  }, [projectAssignments, project.startDate, project.endDate]);

  const getResourcesForInterval = (period: Date) => {
    const periodStart = viewMode === 'monthly' ? startOfMonth(period) : startOfWeek(period);
    const periodEnd = viewMode === 'monthly' ? endOfMonth(period) : endOfWeek(period);
    
    return projectAssignments.filter(a => {
      const start = parseISO(a.startDate);
      const end = parseISO(a.endDate);
      return areIntervalsOverlapping(
        { start, end },
        { start: periodStart, end: periodEnd }
      );
    });
  };

  return (
    <tr className={`group hover:bg-slate-50/10 transition-colors ${selected ? 'bg-indigo-50/20' : ''}`}>
      <td className="p-4 border-slate-200 sticky left-0 bg-white group-hover:bg-slate-50/50 transition-colors z-10 w-12 text-center shadow-[1px_0_0_0_#e2e8f0]">
        <input 
          type="checkbox" 
          checked={selected}
          onChange={onToggleSelect}
          className="rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
        />
      </td>
      <td className="p-3 pl-0 border-r border-slate-200 sticky left-12 bg-white group-hover:bg-slate-50/50 transition-colors z-10 shadow-[1px_0_0_0_#e2e8f0] min-w-[240px]">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2.5 min-w-0">
            <div className="w-2.5 h-2.5 rounded-full mt-1 shrink-0" style={{ backgroundColor: project.color }} />
            <div 
              className="min-w-0 cursor-pointer group/name" 
              onClick={(e) => {
                e.stopPropagation();
                onBulkAddMembers();
              }}
            >
              <div className="flex items-center gap-1.5 mb-0.5">
                <h3 className="text-sm font-black text-slate-900 truncate leading-tight group-hover/name:text-indigo-600 transition-colors uppercase tracking-tight">
                  {obfuscate(project.name, privacyMode)}
                </h3>
                  {project.upcoming && (
                    <span className="text-[10px] font-black px-2 py-0.5 bg-amber-50 text-amber-700 rounded border border-amber-100 uppercase tracking-tighter">
                      Upcoming{typeof project.probability === 'number' ? ` • ${project.probability}%` : ''}
                    </span>
                  )}
                {project.code && !collapsedMetadata && (
                  <span className="text-[9px] font-black px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded border border-slate-200 uppercase tracking-tighter shrink-0">
                    {obfuscate(project.code, privacyMode)}
                  </span>
                )}
              </div>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight truncate mb-2">
                {obfuscate(project.client || '', privacyMode)} • <span className="text-indigo-600 font-black">{project.type || 'T&M'}</span>
              </p>
              
              {!collapsedMetadata && (
                <>
                  <div className="grid grid-cols-2 gap-x-3 gap-y-1 mt-2 pt-2 border-t border-slate-100">
                    <div className="flex flex-col">
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">PM</span>
                      <span className="text-[10px] font-bold text-slate-700 truncate">{obfuscate(project.pm || '-', privacyMode)}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">PC</span>
                      <span className="text-[10px] font-bold text-slate-700 truncate">{obfuscate(project.pc || '-', privacyMode)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 mt-2">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-2.5 h-2.5 text-slate-400" />
                      <span className="text-[9px] font-bold text-slate-500">
                        {project.startDate ? format(parseISO(project.startDate), 'MMM yy') : 'TBD'} - {project.endDate ? format(parseISO(project.endDate), 'MMM yy') : 'TBD'}
                      </span>
                    </div>
                  </div>
                  <div className="mt-3 pt-2 border-t border-slate-100 flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">Bulk Action</span>
                    </div>
                    <button
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        setDragInfo({ projectId: project.id, type: 'bulk-end' });
                      }}
                      className="w-full flex items-center justify-center gap-2 px-2 py-1.5 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all cursor-ew-resize group/bulk"
                    >
                      <ArrowRight className="w-3 h-3 transition-transform group-hover/bulk:translate-x-0.5" />
                      Extend All Resources
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
            <button 
              onClick={onBulkAddMembers}
              title="Add Members"
              className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-indigo-600 transition-colors"
            >
              <Users className="w-3.5 h-3.5" />
            </button>
            <button 
              onClick={onEditProject}
              className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-indigo-600 transition-colors"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button 
              onClick={() => onDelete(project.id)}
              className="p-1 hover:bg-rose-50 rounded text-slate-400 hover:text-rose-500 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </td>
      {intervals.map((period, periodIdx) => {
        const today = new Date();
        const resources = getResourcesForInterval(period);
        const isSelected = selectedCell?.projectId === project.id && selectedCell?.date === period.toISOString();
        const isCurrent = viewMode === 'monthly' 
          ? isSameMonth(period, today) 
          : isSameWeek(period, today, { weekStartsOn: 0 });

        const prevPeriod = periodIdx > 0 ? intervals[periodIdx - 1] : null;
        const nextPeriod = periodIdx < intervals.length - 1 ? intervals[periodIdx + 1] : null;

        return (
          <td 
            key={period.toISOString()} 
            className={`p-1 w-24 border-r border-slate-100 align-top relative group/cell transition-colors
              ${isSelected ? 'bg-indigo-50/50 outline outline-2 outline-indigo-500 z-10' : (isCurrent ? 'bg-indigo-50/20' : 'hover:bg-slate-50')}`}
            onMouseEnter={() => {
              if (dragInfo) {
                if (dragInfo.type === 'bulk-end' && dragInfo.projectId === project.id) {
                  const newEndDateStr = format(viewMode === 'monthly' ? endOfMonth(period) : endOfWeek(period), 'yyyy-MM-dd');
                  const validIds = projectAssignments
                    .filter(a => !isBefore(parseISO(newEndDateStr), parseISO(a.startDate)))
                    .map(a => a.id);
                  
                  if (onBulkUpdateAssignments && validIds.length > 0) {
                    onBulkUpdateAssignments(validIds, { endDate: newEndDateStr });
                  }
                  return;
                }

                if (dragInfo.id) {
                  const assignment = assignments.find(a => a.id === dragInfo.id);
                  if (!assignment) return;

                  const dateStr = format(dragInfo.type === 'start' ? period : (viewMode === 'monthly' ? endOfMonth(period) : endOfWeek(period)), 'yyyy-MM-dd');

                  if (dragInfo.type === 'end') {
                    if (isBefore(parseISO(dateStr), parseISO(assignment.startDate))) return;
                    onUpdateAssignment(dragInfo.id, { endDate: dateStr });
                  } else {
                    if (isAfter(parseISO(dateStr), parseISO(assignment.endDate))) return;
                    onUpdateAssignment(dragInfo.id, { startDate: dateStr });
                  }
                }
              }
            }}
            onClick={(e) => {
              e.stopPropagation();
              setSelectedCell({ projectId: project.id, date: period.toISOString() });
            }}
          >
            <div className="flex flex-col gap-1 overflow-visible min-h-[80px]">
              {assignedMemberIds.map(mId => {
                const memberAsgs = resources.filter(r => r.memberId === mId);
                return (
                  <div key={mId} className="min-h-[38px] flex flex-col gap-1">
                    {memberAsgs.map(res => {
                      const member = members.find(m => m.id === res.memberId);
                      const isStart = areIntervalsOverlapping({ start: parseISO(res.startDate), end: parseISO(res.startDate) }, { start: period, end: viewMode === 'monthly' ? endOfMonth(period) : endOfWeek(period) });
                      const isEnd = areIntervalsOverlapping({ start: parseISO(res.endDate), end: parseISO(res.endDate) }, { start: period, end: viewMode === 'monthly' ? endOfMonth(period) : endOfWeek(period) });

                      const continuesLeft = prevPeriod ? getResourcesForInterval(prevPeriod).some(pa => pa.id === res.id) : false;
                      const continuesRight = nextPeriod ? getResourcesForInterval(nextPeriod).some(na => na.id === res.id) : false;

                      const getStatusStyles = (status: string) => {
                        switch (status) {
                          case 'Hard': return 'bg-blue-800 border-blue-900 text-white';
                          case 'Soft': return 'bg-blue-400 border-blue-500 text-white';
                          case 'Pending': return 'bg-slate-400 border-slate-500 text-white';
                          case 'Planned': return 'bg-slate-400 border-slate-500 text-white opacity-80';
                          default: return 'bg-white border-slate-200 text-slate-900';
                        }
                      };

                      const getJoinStyles = () => {
                        const style: React.CSSProperties = {
                          zIndex: (continuesLeft || continuesRight) ? 10 : 5,
                        };
                        if (continuesLeft) {
                          style.marginLeft = '-8px';
                          style.borderLeft = 'none';
                          style.borderTopLeftRadius = '0';
                          style.borderBottomLeftRadius = '0';
                        }
                        if (continuesRight) {
                          style.marginRight = '-9px';
                          style.borderRight = 'none';
                          style.borderTopRightRadius = '0';
                          style.borderBottomRightRadius = '0';
                        }
                        if (continuesLeft && continuesRight) {
                          style.width = 'calc(100% + 17px)';
                        } else if (continuesLeft) {
                          style.width = 'calc(100% + 8px)';
                        } else if (continuesRight) {
                          style.width = 'calc(100% + 9px)';
                        } else {
                          style.marginLeft = '2px';
                          style.marginRight = '2px';
                          style.width = 'calc(100% - 4px)';
                        }
                        return style;
                      };

                      return (
                        <motion.div 
                          key={res.id}
                          initial={{ opacity: 0, x: -5 }}
                          animate={{ opacity: 1, x: 0 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            onSetAllocationModal({
                              memberId: res.memberId,
                              memberName: member?.name || 'Resource',
                              date: period,
                              assignmentIds: [res.id]
                            });
                          }}
                          className={`flex flex-col px-1.5 py-1 border transition-all cursor-pointer overflow-visible shrink-0 relative ${getStatusStyles(res.status)} 
                            ${dragInfo?.id === res.id ? 'ring-2 ring-white/50 z-20' : 'hover:scale-[1.02] hover:z-10'}
                            ${continuesLeft || continuesRight ? 'shadow-none' : 'shadow-sm'}`}
                          style={getJoinStyles()}
                        >
                          {isStart && !continuesLeft && (
                            <div 
                              onMouseDown={(e) => {
                                e.stopPropagation();
                                setDragInfo({ id: res.id, type: 'start' });
                              }}
                              className="absolute left-0 top-0 bottom-0 w-2.5 bg-white/20 cursor-ew-resize hover:bg-white/40 transition-all rounded-l z-20"
                              title="Drag to extend start"
                            />
                          )}
                          {isEnd && !continuesRight && (
                            <div 
                              onMouseDown={(e) => {
                                e.stopPropagation();
                                setDragInfo({ id: res.id, type: 'end' });
                              }}
                              className="absolute right-0 top-0 bottom-0 w-2.5 bg-white/20 cursor-ew-resize hover:bg-white/40 transition-all rounded-r z-20"
                              title="Drag to extend end"
                            />
                          )}
                          
                          <div className={`flex items-center gap-1 mb-0.5 ${continuesLeft ? 'pl-2' : ''}`}>
                            <img 
                              src={member?.avatar} 
                              alt="" 
                              className="w-3.5 h-3.5 rounded-full bg-white/20 shrink-0 cursor-pointer hover:ring-1 hover:ring-white transition-all" 
                              onClick={(e) => {
                                e.stopPropagation();
                                if (member) onEditMember(member);
                              }}
                            />
                            <span className="text-[9px] font-black truncate leading-none pointer-events-none">
                              {member?.name.split(' ')[0]}
                            </span>
                          </div>
                          <div className={`flex items-center justify-between pointer-events-none ${continuesLeft ? 'pl-2' : ''}`}>
                            <span className="text-[8px] font-bold uppercase tracking-tighter opacity-80">
                              {res.status}
                            </span>
                            {res.hoursPerWeek !== 40 && (
                              <span className="text-[9px] font-black tabular-nums">
                                {res.hoursPerWeek}h
                              </span>
                            )}
                          </div>
                            {res.lastUpdated && (
                              <div className="text-[9px] text-slate-700 mt-1 opacity-80 pointer-events-none flex items-center gap-1">
                                <Clock className="w-3 h-3 text-slate-400" />
                                <span>{format(parseISO(res.lastUpdated), 'MMM d, HH:mm')}</span>
                              </div>
                            )}
                        </motion.div>
                      );
                    })}
                  </div>
                );
              })}
              {assignedMemberIds.length === 0 && (
                <div className="flex-1 rounded border border-dashed border-slate-200 opacity-20 m-1" />
              )}
            </div>
          </td>
        );
      })}
    </tr>
  );
});

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState, useEffect } from 'react';
import { MOCK_TEAM_MEMBERS, MOCK_PROJECTS } from '../mockData';
import { TeamMember, Project, Assignment, AssignmentStatus, Team } from '../types';
import AssignmentCard from './AssignmentCard';
import ContextMenu from './ContextMenu';
import AllocationModal from './AllocationModal';
import { 
  eachMonthOfInterval, 
  eachWeekOfInterval,
  addDays,
  startOfYear, 
  endOfYear, 
  format, 
  isSameMonth, 
  isSameWeek,
  parseISO,
  isWithinInterval,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  differenceInDays,
  isAfter,
  isBefore
} from 'date-fns';
import { Search, Plus, Filter, MoreHorizontal, ChevronLeft, ChevronRight, CalendarDays, CalendarRange, ArrowUp, ArrowDown, GitGraph } from 'lucide-react';
import { obfuscate } from '../lib/utils';

interface ResourceGridProps {
  searchQuery: string;
  members: TeamMember[];
  projects: Project[];
  assignments: Assignment[];
  onDeleteAssignment: (id: string, date: Date, mode: 'month' | 'week') => void;
  onAddAssignment: (memberId: string, projectId: string, hours: number, date: Date, mode: 'month' | 'week', status?: AssignmentStatus, startDate?: string, endDate?: string) => void;
  onEditAssignment: (id: string, updates: Partial<Assignment>) => void;
  onRemoveAssignmentEntirely: (id: string) => void;
  onSwapAssignmentMember: (assignmentId: string, newMemberId: string) => void;
  onUnassignAssignment: (assignmentId: string) => void;
  onSwapAssignmentToNewJoiner: (assignmentId: string) => void;
  onAddProject: () => void;
  selectedTeamId: string | null;
  teams: Team[];
  currentYear: number;
  setCurrentYear: React.Dispatch<React.SetStateAction<number>>;
  viewMode: 'monthly' | 'weekly';
  setViewMode: React.Dispatch<React.SetStateAction<'monthly' | 'weekly'>>;
  onEditMember: (member: TeamMember) => void;
  privacyMode: boolean;
}

type ViewMode = 'monthly' | 'weekly';
type SortOption = 'name' | 'role' | 'companyStartDate' | 'rollOffDate' | 'manager';

export default function ResourceGrid({ 
  searchQuery, 
  members, 
  projects,
  assignments, 
  onDeleteAssignment, 
  onAddAssignment, 
  onEditAssignment,
  onRemoveAssignmentEntirely,
  onSwapAssignmentMember,
  onUnassignAssignment,
  onSwapAssignmentToNewJoiner,
  onAddProject,
  selectedTeamId,
  teams,
  currentYear,
  setCurrentYear,
  viewMode,
  setViewMode,
  onEditMember,
  privacyMode
}: ResourceGridProps) {
  const [statusFilter, setStatusFilter] = useState<AssignmentStatus>(() => {
    const saved = localStorage.getItem('resource_statusFilter');
    return (saved as AssignmentStatus) || 'Planned';
  });
  const [sortBy, setSortBy] = useState<SortOption>(() => {
    const saved = localStorage.getItem('resource_sortBy');
    return (saved as SortOption) || 'name';
  });
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(() => {
    const saved = localStorage.getItem('resource_sortOrder');
    return (saved as 'asc' | 'desc') || 'asc';
  });
  const [isGroupedByTeam, setIsGroupedByTeam] = useState(() => {
    return localStorage.getItem('resource_isGroupedByTeam') === 'true';
  });
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [managerFilter, setManagerFilter] = useState<string>('all');

  useEffect(() => {
    localStorage.setItem('resource_isGroupedByTeam', isGroupedByTeam.toString());
  }, [isGroupedByTeam]);

  useEffect(() => {
    localStorage.setItem('resource_statusFilter', statusFilter);
  }, [statusFilter]);

  useEffect(() => {
    localStorage.setItem('resource_sortBy', sortBy);
  }, [sortBy]);

  useEffect(() => {
    localStorage.setItem('resource_sortOrder', sortOrder);
  }, [sortOrder]);
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, assignmentId: string, date: Date } | null>(null);
  const [allocationModal, setAllocationModal] = useState<{ memberId: string, memberName: string, date: Date, assignmentIds?: string[] } | null>(null);
  const [draggedAssignment, setDraggedAssignment] = useState<string | null>(null);
  const [dragInfo, setDragInfo] = useState<{ id: string; type: 'start' | 'end' } | null>(null);
  const [selectedCell, setSelectedCell] = useState<{ memberId: string, date: string } | null>(null);

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

  const timePeriods = useMemo(() => {
    const start = startOfYear(new Date(currentYear, 0, 1));
    const end = endOfYear(new Date(currentYear, 0, 1));
    
    if (viewMode === 'monthly') {
      return eachMonthOfInterval({ start, end });
    } else {
      return eachWeekOfInterval({ start, end });
    }
  }, [currentYear, viewMode]);

  const filteredMembersList = useMemo(() => {
    let list = members.filter(m => {
      const matchesSearch = searchQuery.toLowerCase() === '' || 
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.role.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesRole = roleFilter === 'all' || m.role === roleFilter;
      const matchesManager = managerFilter === 'all' || m.managerId === managerFilter;
      const matchesTeam = !selectedTeamId || m.teamId === selectedTeamId;

      return matchesSearch && matchesRole && matchesManager && matchesTeam;
    });
    
    list.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'role':
          comparison = a.role.localeCompare(b.role);
          break;
        case 'companyStartDate':
          const dateA = a.companyStartDate ? new Date(a.companyStartDate).getTime() : 0;
          const dateB = b.companyStartDate ? new Date(b.companyStartDate).getTime() : 0;
          comparison = dateA - dateB;
          break;
        case 'rollOffDate':
          const getLatestEndDate = (memberId: string) => {
            const memberAsgs = assignments.filter(asg => asg.memberId === memberId);
            if (memberAsgs.length === 0) return 0;
            return Math.max(...memberAsgs.map(asg => parseISO(asg.endDate).getTime()));
          };
          comparison = getLatestEndDate(a.id) - getLatestEndDate(b.id);
          break;
        case 'manager':
          const managerA = members.find(m => m.id === a.managerId)?.name || '';
          const managerB = members.find(m => m.id === b.managerId)?.name || '';
          comparison = managerA.localeCompare(managerB);
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return list;
  }, [searchQuery, selectedTeamId, members, sortBy, sortOrder, assignments, projects, roleFilter, managerFilter]);

  const groupedMembers = useMemo(() => {
    if (!isGroupedByTeam) return null;
    
    // Sort teams by hierarchy if possible, or just use teams list
    return teams.map(team => {
      const teamMembers = filteredMembersList.filter(m => m.teamId === team.id);
      return {
        team,
        members: teamMembers
      };
    }).filter(g => g.members.length > 0);
  }, [isGroupedByTeam, filteredMembersList, teams]);

  const getAssignmentsForPeriod = (memberId: string, date: Date) => {
    return filteredAssignments.filter(a => {
      if (a.memberId !== memberId) return false;
      const start = parseISO(a.startDate);
      const end = parseISO(a.endDate);
      const periodStart = viewMode === 'monthly' ? startOfMonth(date) : startOfWeek(date);
      const periodEnd = viewMode === 'monthly' ? endOfMonth(date) : endOfWeek(date);
      
      return (
        isWithinInterval(start, { start: periodStart, end: periodEnd }) ||
        isWithinInterval(end, { start: periodStart, end: periodEnd }) ||
        (start <= periodStart && end >= periodEnd)
      );
    });
  };

  const handleContextMenu = (e: React.MouseEvent, assignmentId: string, date: Date) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, assignmentId, date });
  };

  const handleDrop = (memberId: string, period: Date) => {
    if (!draggedAssignment) return;
    const assignment = filteredAssignments.find(a => a.id === draggedAssignment);
    if (!assignment || assignment.memberId !== memberId) {
      setDraggedAssignment(null);
      return; 
    }
    
    // Extend or shrink dates based on where it's dropped. For simplicity, adjust endDate to cover dropped period.
    const assignStart = parseISO(assignment.startDate);
    const assignEnd = parseISO(assignment.endDate);
    const periodStart = viewMode === 'monthly' ? startOfMonth(period) : startOfWeek(period);
    const periodEnd = viewMode === 'monthly' ? endOfMonth(period) : endOfWeek(period);

    // If dropped period is after end date, extend end date
    if (isAfter(periodEnd, assignEnd)) {
      onEditAssignment(draggedAssignment, { endDate: format(periodEnd, 'yyyy-MM-dd') });
    } else if (isBefore(periodStart, assignStart)) {
      onEditAssignment(draggedAssignment, { startDate: format(periodStart, 'yyyy-MM-dd') });
    }
    
    setDraggedAssignment(null);
  };

  const renderMemberRow = (member: TeamMember) => {
    const today = new Date();
    const memberAssignments = filteredAssignments.filter(a => a.memberId === member.id);
    const rollOffDate = memberAssignments.length > 0 
      ? memberAssignments.reduce((latest, a) => {
          const current = parseISO(a.endDate);
          return isAfter(current, latest) ? current : latest;
        }, parseISO(memberAssignments[0].endDate))
      : null;
    
    const daysToBench = rollOffDate ? differenceInDays(rollOffDate, new Date()) : null;
    const isPlaceholder = member.isPlaceholder;
    const isFutureJoiner = member.isFutureJoiner || (member.companyStartDate ? isAfter(parseISO(member.companyStartDate), new Date()) : false);
    
    const getDaysToBenchColor = (days: number | null) => {
      if (days === null) return 'bg-slate-100 text-slate-400';
      if (days < 0) return 'bg-rose-100 text-rose-600';
      if (days < 30) return 'bg-yellow-100 text-yellow-600';
      return 'bg-emerald-100 text-emerald-600';
    };

    return (
      <tr key={member.id} className="group transition-colors bg-white">
        {/* Resource Column */}
        <td 
          className="p-2 border-b-4 border-r border-slate-200 sticky left-0 bg-white z-20 group-hover:bg-slate-50 transition-colors shadow-[1px_0_0_0_#e2e8f0] cursor-pointer"
          onClick={() => {
            const allAsgs = assignments.filter(a => a.memberId === member.id);
            setAllocationModal({ 
              memberId: member.id, 
              memberName: member.name, 
              date: new Date(currentYear, 0, 1), 
              assignmentIds: allAsgs.map(a => a.id) 
            });
          }}
        >
          <div className="flex items-center gap-2">
             <img 
               src={member.avatar} 
               alt="" 
               className="w-5 h-5 rounded-full border border-slate-200 shrink-0 cursor-pointer hover:ring-2 hover:ring-indigo-500 transition-all" 
               onClick={(e) => {
                 e.stopPropagation();
                 onEditMember(member);
               }}
             />
             <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <p className={`text-[11px] font-black truncate leading-none ${member.lastWorkingDay ? 'text-rose-600' : 'text-slate-900'}`}>
                  {obfuscate(member.name, privacyMode)}
                </p>
                {isPlaceholder && (
                  <span className="px-1 py-[0.5px] rounded-[2px] text-[7px] font-black bg-slate-200 text-slate-700 border border-slate-300 tracking-tighter uppercase shrink-0">Placeholder</span>
                )}
                {isFutureJoiner && !isPlaceholder && (
                  <span className="px-1 py-[0.5px] rounded-[2px] text-[7px] font-black bg-indigo-100 text-indigo-700 border border-indigo-200 tracking-tighter uppercase shrink-0">Future joiner</span>
                )}
                {member.employmentType === 'contractor' && (
                  <span className="px-1 py-[0.5px] rounded-[2px] text-[7px] font-black bg-rose-100 text-rose-700 border border-rose-200 tracking-tighter uppercase shrink-0">C</span>
                )}
                {member.employmentType === 'intern' && (
                  <span className="px-1 py-[0.5px] rounded-[2px] text-[7px] font-black bg-amber-100 text-amber-700 border border-amber-200 tracking-tighter uppercase shrink-0">I</span>
                )}
              </div>
              <p className="text-[9px] font-bold text-slate-500 truncate uppercase tracking-tighter hover:text-indigo-600 transition-colors leading-none mt-0.5">{member.role}</p>
              {isFutureJoiner && member.companyStartDate && !isPlaceholder && (
                <p className="text-[7px] font-black text-indigo-600 uppercase tracking-tighter mt-0.5">Starts {format(parseISO(member.companyStartDate), 'd MMM')}</p>
              )}
              {member.lastWorkingDay && (
                <p className="text-[7px] font-black text-rose-500 uppercase tracking-tighter mt-0.5">LWD: {format(parseISO(member.lastWorkingDay), 'd MMM')}</p>
              )}
             </div>
          </div>
        </td>

        {/* Roll Off Column */}
        <td className="p-2 border-b-4 border-r border-slate-200 text-center group-hover:bg-slate-50 transition-colors">
          <span className="text-[9px] font-bold text-slate-600">
            {rollOffDate ? format(rollOffDate, 'd-MMM-yy') : '—'}
          </span>
        </td>

        {/* Days to Bench Column */}
        <td className={`p-2 border-b-4 border-r border-slate-200 text-center group-hover:bg-slate-50 transition-colors`}>
          <div className={`inline-flex items-center justify-center min-w-[24px] px-1.5 py-0.5 rounded-[2px] text-[9px] font-black ${getDaysToBenchColor(daysToBench)}`}>
            {daysToBench !== null ? daysToBench : '—'}
          </div>
        </td>

        {/* Period Cells */}
        {timePeriods.map((period, periodIdx) => {
          const isCurrent = viewMode === 'monthly' 
            ? isSameMonth(period, today) 
            : isSameWeek(period, today, { weekStartsOn: 0 });
          const prevPeriod = periodIdx > 0 ? timePeriods[periodIdx - 1] : null;
          const nextPeriod = periodIdx < timePeriods.length - 1 ? timePeriods[periodIdx + 1] : null;
          
          const periodAssignments = getAssignmentsForPeriod(member.id, period).sort((a, b) => a.id.localeCompare(b.id));
          const totalHours = periodAssignments.reduce((acc, a) => acc + a.hoursPerWeek, 0);
          const isEmpty = periodAssignments.length === 0;

          const isSelected = selectedCell?.memberId === member.id && selectedCell?.date === period.toISOString();

          return (
            <td 
              key={period.toISOString()} 
              className={`p-0 border-b-4 border-r border-slate-200 h-10 align-top transition-colors relative group/cell cursor-pointer 
                ${isSelected ? 'bg-indigo-50/50 outline outline-2 outline-indigo-500 z-10' : (isCurrent ? 'bg-indigo-50/20' : 'hover:bg-slate-50')}`}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedCell({ memberId: member.id, date: period.toISOString() });
                const periodAsgs = getAssignmentsForPeriod(member.id, period);
                setAllocationModal({ 
                  memberId: member.id, 
                  memberName: member.name, 
                  date: period,
                  assignmentIds: periodAsgs.map(a => a.id)
                });
              }}
              onMouseEnter={() => {
                if (dragInfo) {
                  const assignment = assignments.find(asg => asg.id === dragInfo.id);
                  if (!assignment) return;
                  
                  const dateStr = format(dragInfo.type === 'start' ? period : (viewMode === 'monthly' ? endOfMonth(period) : endOfWeek(period)), 'yyyy-MM-dd');
                  
                  if (dragInfo.type === 'end') {
                    if (isBefore(parseISO(dateStr), parseISO(assignment.startDate))) return;
                    onEditAssignment(dragInfo.id, { endDate: dateStr });
                  } else {
                    if (isAfter(parseISO(dateStr), parseISO(assignment.endDate))) return;
                    onEditAssignment(dragInfo.id, { startDate: dateStr });
                  }
                }
              }}
              onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; }}
              onDrop={() => handleDrop(member.id, period)}
            >
              <div className="flex flex-col h-full overflow-visible">
                {periodAssignments.map(a => {
                  const project = projects.find(p => p.id === a.projectId);
                  const continuesLeft = prevPeriod ? getAssignmentsForPeriod(member.id, prevPeriod).some(pa => pa.id === a.id) : false;
                  const continuesRight = nextPeriod ? getAssignmentsForPeriod(member.id, nextPeriod).some(na => na.id === a.id) : false;
                  
                  const highlightType = isPlaceholder && a.status === 'Planned'
                    ? 'placeholder'
                    : !isPlaceholder && isFutureJoiner && a.status === 'Planned'
                      ? 'futureJoiner'
                      : undefined;

                  return (
                    <AssignmentCard 
                      key={a.id} 
                      assignment={a} 
                      projectColor={project?.color || '#CBD5E1'}
                      projects={projects}
                      compact
                      continuesLeft={continuesLeft}
                      continuesRight={continuesRight}
                      draggable
                      privacyMode={privacyMode}
                      highlightType={highlightType}
                      onDragStart={(e) => {
                        e.dataTransfer.setData('text/plain', '');
                        setDraggedAssignment(a.id);
                      }}
                      onDragEnd={() => setDraggedAssignment(null)}
                      onExtendStart={(id) => setDragInfo({ id, type: 'start' })}
                      onExtendEnd={(id) => setDragInfo({ id, type: 'end' })}
                      onClick={(e) => {
                        e.stopPropagation();
                        setAllocationModal({ 
                          memberId: member.id, 
                          memberName: member.name, 
                          date: period, 
                          assignmentIds: [a.id] 
                        });
                      }}
                      onContextMenu={(e) => handleContextMenu(e, a.id, period)}
                    />
                  );
                })}
                
                {isEmpty && (
                  <div className="flex-1 rounded border border-dashed border-transparent group-hover/cell:border-slate-200 flex items-center justify-center transition-all">
                    <Plus className="w-2 h-2 text-slate-300 opacity-0 group-hover/cell:opacity-100" />
                  </div>
                )}
              </div>
              
              {/* total indicator */}
              {totalHours > 0 && (
                <div className={`absolute bottom-0.5 right-0.5 px-0.5 rounded-[1px] shadow-sm text-[6px] font-black bg-white/90 ${totalHours > member.capacity ? 'text-rose-600' : 'text-slate-500'} z-10`}>
                  {totalHours}h
                </div>
              )}
            </td>
          );
        })}
      </tr>
    );
  };

  const today = useMemo(() => new Date(), []);

  const roles = useMemo(() => {
    const uniqueRoles = Array.from(new Set(members.map(m => m.role)));
    return uniqueRoles.sort();
  }, [members]);

  const managers = useMemo(() => {
    const managerIds = Array.from(new Set(members.map(m => m.managerId).filter((id): id is string => !!id)));
    return managerIds.map(id => members.find(m => m.id === id)).filter((m): m is TeamMember => !!m).sort((a, b) => a.name.localeCompare(b.name));
  }, [members]);

  const todayMarker = useMemo(() => {
    const todayIndex = timePeriods.findIndex(p => {
      const start = viewMode === 'monthly' ? startOfMonth(p) : startOfWeek(p);
      const end = viewMode === 'monthly' ? endOfMonth(p) : endOfWeek(p);
      return isWithinInterval(today, { start, end });
    });

    if (todayIndex === -1) return null;

    let subProgress = 0;
    const period = timePeriods[todayIndex];
    if (viewMode === 'monthly') {
      const days = differenceInDays(endOfMonth(period), startOfMonth(period)) + 1;
      const progress = differenceInDays(today, startOfMonth(period));
      subProgress = (progress / days) * 100;
    } else {
      const progress = differenceInDays(today, startOfWeek(period));
      subProgress = (progress / 7) * 100;
    }

    return { todayIndex, subProgress };
  }, [timePeriods, viewMode, today]);

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Grid Toolbar */}
      <div className="p-3 border-b border-slate-100 flex items-center justify-between bg-white text-xs font-semibold text-slate-500">
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-start gap-0.5 border-r border-slate-200 pr-4 mr-2">
            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest leading-none">Today</span>
            <span className="text-xs font-black text-indigo-600 leading-none">{format(today, 'MMM d, yyyy')}</span>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setCurrentYear(y => y - 1)}
              className="p-1 hover:bg-slate-100 rounded transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-slate-900 font-bold min-w-[40px] text-center">{currentYear}</span>
            <button 
              onClick={() => setCurrentYear(y => y + 1)}
              className="p-1 hover:bg-slate-100 rounded transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="h-4 w-px bg-slate-200" />
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
            <button
              onClick={() => setViewMode('monthly')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-all ${
                viewMode === 'monthly' 
                  ? 'bg-white text-indigo-600 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <CalendarRange className="w-3.5 h-3.5" />
              <span>Monthly</span>
            </button>
            <button
              onClick={() => setViewMode('weekly')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-all ${
                viewMode === 'weekly' 
                  ? 'bg-white text-indigo-600 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>Weekly</span>
            </button>
          </div>
          
          <div className="h-4 w-px bg-slate-200" />
          <div className="flex items-center gap-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 mr-1 ml-2">Bookings:</span>
            <div className="flex bg-slate-100 p-1 rounded-lg">
              {statusOrder.map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-3 py-1 rounded-md transition-all ${
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
          <div className="h-4 w-px bg-slate-200" />
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-bold text-slate-400 mr-1 ml-2">Role:</span>
            <select 
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="text-[10px] font-bold text-slate-600 bg-slate-100 border-none rounded px-2 py-1 focus:ring-0 cursor-pointer max-w-[120px]"
            >
              <option value="all">All Roles</option>
              {roles.map(role => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
          </div>
          <div className="h-4 w-px bg-slate-200" />
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-bold text-slate-400 mr-1 ml-2">Manager:</span>
            <select 
              value={managerFilter}
              onChange={(e) => setManagerFilter(e.target.value)}
              className="text-[10px] font-bold text-slate-600 bg-slate-100 border-none rounded px-2 py-1 focus:ring-0 cursor-pointer max-w-[120px]"
            >
              <option value="all">All Managers</option>
              {managers.map(manager => (
                <option key={manager.id} value={manager.id}>{obfuscate(manager.name, privacyMode)}</option>
              ))}
            </select>
          </div>
          <div className="h-4 w-px bg-slate-200" />
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-bold text-slate-400 mr-1 ml-2">Sort:</span>
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="text-[10px] font-bold text-slate-600 bg-slate-100 border-none rounded px-2 py-1 focus:ring-0 cursor-pointer"
            >
              <option value="name">Name</option>
              <option value="role">Title</option>
              <option value="manager">Manager</option>
              <option value="companyStartDate">Start Date</option>
              <option value="rollOffDate">Roll-off</option>
            </select>
            <button 
              onClick={() => setSortOrder(o => o === 'asc' ? 'desc' : 'asc')}
              className="p-1 hover:bg-slate-100 rounded text-slate-400 transition-colors"
            >
              {sortOrder === 'asc' ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />}
            </button>
          </div>
          <div className="h-4 w-px bg-slate-200" />
          <button 
            onClick={() => setIsGroupedByTeam(!isGroupedByTeam)}
            className={`flex items-center gap-1.5 px-2 py-1 rounded transition-colors border ${
              isGroupedByTeam 
                ? 'bg-indigo-50 border-indigo-200 text-indigo-600' 
                : 'hover:bg-slate-50 border-slate-200 text-slate-500'
            }`}
          >
            <GitGraph className="w-3.5 h-3.5" />
            <span className="text-[10px] uppercase font-bold">Groups</span>
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 px-2 py-1 hover:bg-slate-50 rounded transition-colors border border-slate-200">
            <Filter className="w-3 h-3" />
            <span>Filter</span>
          </button>
          <button className="flex items-center gap-1.5 px-2 py-1 bg-indigo-600 text-white rounded transition-colors hover:bg-indigo-700">
            <Plus className="w-3 h-3" />
            <span>Project</span>
          </button>
        </div>
      </div>

      {/* Grid Table */}
      <div className="flex-1 overflow-auto bg-slate-50 relative">
        {todayMarker && (
          <div 
            className="absolute top-0 bottom-0 w-[2px] bg-indigo-500/30 z-[35] pointer-events-none flex flex-col items-center shadow-[0_0_8px_rgba(79,70,229,0.2)]"
            style={{ 
              left: `${336 + todayMarker.todayIndex * (viewMode === 'monthly' ? 128 : 80) + (todayMarker.subProgress / 100 * (viewMode === 'monthly' ? 128 : 80))}px` 
            }}
          >
            <div className="bg-indigo-600 text-white text-[7px] font-black px-1.5 py-0.5 rounded-b-[3px] shadow-sm whitespace-nowrap tracking-tighter mt-[34px]">
              TODAY
            </div>
            <div className="flex-1 w-[2px] bg-indigo-500/50" />
          </div>
        )}
        <table className="w-full border-separate border-spacing-0 table-fixed min-w-[max-content]">
          <thead>
            <tr className="z-30">
              <th className="w-40 p-2 text-left border-b border-r border-slate-200 sticky top-0 left-0 bg-[#F1F5F9] z-40 outline outline-1 outline-slate-200">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Resource</span>
              </th>
              <th className="w-24 p-2 text-center border-b border-r border-slate-200 sticky top-0 bg-[#F1F5F9] z-30">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Roll Off</span>
              </th>
              <th className="w-20 p-2 text-center border-b border-r border-slate-200 sticky top-0 bg-[#F1F5F9] z-30">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-tight">Days to Bench</span>
              </th>
              {timePeriods.map((period) => {
                const today = new Date();
                const isCurrent = viewMode === 'monthly' 
                  ? isSameMonth(period, today) 
                  : isSameWeek(period, today, { weekStartsOn: 0 });

                return (
                  <th key={period.toISOString()} className={`${viewMode === 'monthly' ? 'w-32' : 'w-20'} p-2 text-center border-b border-r border-slate-200 sticky top-0 z-30 ${isCurrent ? 'bg-indigo-50 shadow-[inset_0_-2px_0_0_#4f46e5]' : 'bg-[#F1F5F9]'}`}>
                    <div className="flex flex-col items-center">
                      <span className={`text-[10px] font-bold uppercase tracking-tight ${isCurrent ? 'text-indigo-600' : 'text-slate-700'}`}>
                        {viewMode === 'monthly' ? format(period, 'MMM') : format(period, 'MMM d')}
                      </span>
                      <span className={`text-[9px] font-medium leading-none ${isCurrent ? 'text-indigo-400' : 'text-slate-400'}`}>
                        {viewMode === 'monthly' ? format(period, 'yy') : format(period, 'yy')}
                      </span>
                      {isCurrent && (
                        <div className="text-[6px] font-black text-indigo-400 mt-1 uppercase tracking-tighter">NOW</div>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody className="">
            {groupedMembers ? (
              groupedMembers.map(group => (
                <React.Fragment key={group.team.id}>
                  <tr className="bg-slate-100/50 sticky top-[69px] z-20">
                    <td colSpan={3 + timePeriods.length} className="p-2 border-b border-t border-slate-200">
                      <div className="flex items-center gap-2 pl-2">
                        <GitGraph className="w-3 h-3 text-indigo-500" />
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{group.team.name}</span>
                        <span className="text-[9px] font-bold text-slate-300 bg-white px-1.5 py-0.5 rounded-full border border-slate-100">{group.members.length}</span>
                      </div>
                    </td>
                  </tr>
                  {group.members.map(member => renderMemberRow(member))}
                </React.Fragment>
              ))
            ) : (
              filteredMembersList.map((member) => renderMemberRow(member))
            )}
          </tbody>
        </table>
      </div>
      {/* Context Menu Overlay */}
      {contextMenu && (
        <ContextMenu 
          x={contextMenu.x}
          y={contextMenu.y}
          title="Allocation Options"
          onClose={() => setContextMenu(null)}
          onDelete={() => onDeleteAssignment(contextMenu.assignmentId, contextMenu.date, viewMode === 'monthly' ? 'month' : 'week')}
          onDeleteEntirely={() => onRemoveAssignmentEntirely(contextMenu.assignmentId)}
        />
      )}
      {/* Allocation Modal */}
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
            // If it was the only one, close modal
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
                onEditAssignment(item.id, { 
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

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import { TeamMember, Assignment, Team, Project } from '../types';
import { format, parseISO, isAfter } from 'date-fns';
import { Search, Filter, MoreHorizontal, Mail, Calendar, Clock, ChevronRight, Trash2, CalendarDays, ArrowUp, ArrowDown, Edit2, GitGraph, AlertCircle } from 'lucide-react';
import { obfuscate } from '../lib/utils';

interface TeamMembersViewProps {
  members: TeamMember[];
  assignments: Assignment[];
  searchQuery: string;
  selectedTeamId: string | null;
  onUpdateMember: (id: string, updates: Partial<TeamMember>) => void;
  onDeleteMember: (id: string) => void;
  onBulkDelete?: (ids: string[]) => void;
  onBulkEdit?: (ids: string[]) => void;
  onEditMember: (member: TeamMember) => void;
  teams: Team[];
  projects: Project[];
  onDeleteTeam: (id: string) => void;
  onEditTeam?: (team: Team) => void;
  privacyMode: boolean;
  onSwitchView: (view: any) => void;
}

type SortOption = 'name' | 'role' | 'startDate' | 'rollOffDate' | 'utilization';

export default function TeamMembersView({ members, assignments, searchQuery, selectedTeamId, onUpdateMember, onDeleteMember, onBulkDelete, onBulkEdit, onEditMember, teams, projects, onDeleteTeam, onEditTeam, privacyMode, onSwitchView }: TeamMembersViewProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<SortOption>('name');
  const [groupBy, setGroupBy] = useState<'team' | 'employmentType'>('team');
  const [sortParam, setSortParam] = useState<'asc'|'desc'>('asc');

  const filteredMembers = useMemo(() => {
    let result = [...members];
    
    result.sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else if (sortBy === 'role') {
        comparison = a.role.localeCompare(b.role);
      } else if (sortBy === 'startDate') {
        const dateA = a.companyStartDate ? new Date(a.companyStartDate).getTime() : 0;
        const dateB = b.companyStartDate ? new Date(b.companyStartDate).getTime() : 0;
        comparison = dateA - dateB;
      } else if (sortBy === 'rollOffDate') {
        const getLatestEndDate = (memberId: string) => {
          const memberAsgs = assignments.filter(asg => asg.memberId === memberId);
          if (memberAsgs.length === 0) return 0;
          return Math.max(...memberAsgs.map(asg => parseISO(asg.endDate).getTime()));
        };
        comparison = getLatestEndDate(a.id) - getLatestEndDate(b.id);
      } else if (sortBy === 'utilization') {
        const utilA = assignments.filter(asg => asg.memberId === a.id).reduce((acc, asg) => acc + asg.hoursPerWeek, 0) / a.capacity;
        const utilB = assignments.filter(asg => asg.memberId === b.id).reduce((acc, asg) => acc + asg.hoursPerWeek, 0) / b.capacity;
        comparison = utilA - utilB;
      }
      return sortParam === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [searchQuery, selectedTeamId, members, sortBy, sortParam, assignments]);

  const groupedMembers = useMemo(() => {
    if (sortBy !== 'name') return null; // Don't group if sorted by date/utilization to keep list flat
    
    if (groupBy === 'employmentType') {
      const types = [
        { id: 'employee', name: 'Employees' },
        { id: 'contractor', name: 'Contractors' },
        { id: 'intern', name: 'Interns' }
      ];
      return types.map(t => ({
        team: t as Team, // Just using it for id/name
        isEmploymentTypeGroup: true,
        members: filteredMembers.filter(m => (m.employmentType || 'employee') === t.id)
      })).filter(group => group.members.length > 0);
    }

    if (selectedTeamId) return null; // If viewing a specific team, don't group by team (already filtered)

    return teams.map(team => ({
      team: team as Team,
      isEmploymentTypeGroup: false,
      members: filteredMembers.filter(m => m.teamId === team.id)
    })).filter(group => group.members.length > 0);
  }, [filteredMembers, selectedTeamId, sortBy, teams, groupBy]);

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredMembers.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredMembers.map(m => m.id)));
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

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full">
      <div className="p-4 border-b border-slate-100 flex flex-col gap-4 bg-slate-50/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-widest">Team Management</h2>
            <button 
              onClick={() => onSwitchView('Org')}
              className="flex items-center gap-1.5 px-2 py-1 bg-white border border-indigo-100 text-indigo-600 rounded text-[10px] font-bold uppercase tracking-wider hover:bg-indigo-50 transition-colors shadow-sm"
            >
              <GitGraph className="w-3 h-3" />
              View Org Chart
            </button>
            {members.filter(m => !m.managerId).length > 0 && (
              <div className="flex items-center gap-1.5 text-amber-600 bg-amber-50 px-2 py-1 rounded text-[10px] font-medium border border-amber-100">
                <AlertCircle className="w-3 h-3 text-amber-500" />
                {members.filter(m => !m.managerId).length} people missing manager
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
             <span className="text-[10px] font-bold text-slate-400 bg-slate-200/50 px-2 py-0.5 rounded uppercase tracking-wider">
              {filteredMembers.length} Members
            </span>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 border-r border-slate-200 pr-4">
              <span className="text-xs font-bold text-slate-500">Group by:</span>
              <select 
                value={groupBy}
                onChange={(e) => setGroupBy(e.target.value as any)}
                className="text-xs border border-slate-200 rounded p-1 text-slate-700 font-medium"
              >
                <option value="team">Team</option>
                <option value="employmentType">Role / Type</option>
              </select>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500">Sort by:</span>
              <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="text-xs border border-slate-200 rounded p-1 text-slate-700 font-medium"
              >
                <option value="name">Name</option>
                <option value="role">Title</option>
                <option value="startDate">Start Date</option>
                <option value="rollOffDate">Roll-off Date</option>
                <option value="utilization">Utilization</option>
              </select>
              <button 
                onClick={() => setSortParam(p => p === 'asc' ? 'desc' : 'asc')}
                className="p-1 border border-slate-200 rounded text-slate-500 hover:bg-slate-100"
              >
                {sortParam === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
              </button>
            </div>
            
            {selectedIds.size > 0 && (
              <div className="flex items-center gap-2 border-l border-slate-200 pl-4">
                <span className="text-xs font-bold text-indigo-600 px-2">{selectedIds.size} selected</span>
                <button 
                  onClick={() => onBulkEdit?.(Array.from(selectedIds))}
                  className="flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 px-2 py-1.5 rounded transition-colors"
                >
                  <Edit2 className="w-3 h-3" />
                  Edit
                </button>
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

      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse">
          <thead className="sticky top-0 z-10 bg-white">
            <tr className="text-left border-b border-slate-200">
              <th className="p-4 w-12 text-center">
                <input 
                  type="checkbox" 
                  checked={filteredMembers.length > 0 && selectedIds.size === filteredMembers.length}
                  onChange={toggleSelectAll}
                  className="rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                />
              </th>
              <th className="p-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-0">Member</th>
              <th className="p-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Dates</th>
              <th className="p-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest w-48">Skills & Projects</th>
              <th className="p-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Allocated</th>
              <th className="p-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Roll-off</th>
              <th className="p-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {groupedMembers ? (
              groupedMembers.map(group => (
                <React.Fragment key={group.team.id}>
                  <tr className="bg-slate-50/50">
                    <td colSpan={7} className="px-4 py-2 border-b border-slate-100">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <ChevronRight className="w-3 h-3 text-slate-400" />
                          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{group.team.name}</span>
                          <span className="text-[9px] font-bold text-slate-300 bg-slate-100 px-1.5 py-0.5 rounded-full">{group.members.length}</span>
                        </div>
                        {!group.isEmploymentTypeGroup && (
                          <div className="flex items-center gap-1">
                            <button 
                              onClick={() => onEditTeam?.(group.team)}
                              className="p-1 hover:bg-slate-200 rounded text-slate-400 hover:text-indigo-600 transition-colors"
                              title={`Edit ${group.team.name}`}
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button 
                              onClick={() => onDeleteTeam(group.team.id)}
                              className="p-1 hover:bg-rose-100 rounded text-slate-400 hover:text-rose-500 transition-colors"
                              title={`Delete ${group.team.name}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                  {group.members.map((member) => (
                    <MemberRow 
                      key={member.id} 
                      member={member} 
                      assignments={assignments} 
                      onUpdateMember={onUpdateMember}
                      onDeleteMember={onDeleteMember}
                      selected={selectedIds.has(member.id)}
                      onToggleSelect={() => toggleSelect(member.id)}
                      onEditMember={() => onEditMember(member)}
                      projects={projects}
                      allMembers={members}
                      privacyMode={privacyMode}
                    />
                  ))}
                </React.Fragment>
              ))
            ) : (
              filteredMembers.map((member) => (
                <MemberRow 
                  key={member.id} 
                  member={member} 
                  assignments={assignments} 
                  onUpdateMember={onUpdateMember}
                  onDeleteMember={onDeleteMember}
                  selected={selectedIds.has(member.id)}
                  onToggleSelect={() => toggleSelect(member.id)}
                  onEditMember={() => onEditMember(member)}
                  projects={projects}
                  allMembers={members}
                  privacyMode={privacyMode}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

interface MemberRowProps {
  key?: string;
  member: TeamMember;
  assignments: Assignment[];
  onUpdateMember: (id: string, updates: Partial<TeamMember>) => void;
  onDeleteMember: (id: string) => void;
  selected: boolean;
  onToggleSelect: () => void;
  onEditMember: () => void;
  projects: Project[];
  allMembers: TeamMember[];
  privacyMode: boolean;
}

function MemberRow({ member, assignments, onUpdateMember, onDeleteMember, selected, onToggleSelect, onEditMember, projects, allMembers, privacyMode }: MemberRowProps) {
  const memberAssignments = assignments.filter(a => a.memberId === member.id);
  const manager = allMembers.find(m => m.id === member.managerId);
  const reporteesCount = allMembers.filter(m => m.managerId === member.id).length;
  
  const currentProjects = useMemo(() => {
    const projectIds = Array.from(new Set(memberAssignments.map(a => a.projectId)));
    return projectIds.map(id => projects.find(p => p.id === id)).filter(Boolean);
  }, [memberAssignments, projects]);

  const totalWeeklyHours = memberAssignments.reduce((acc, a) => acc + a.hoursPerWeek, 0);
  
  const rollOffDate = useMemo(() => {
    if (memberAssignments.length === 0) return null;
    return memberAssignments.reduce((latest, a) => {
      const current = parseISO(a.endDate);
      return isAfter(current, latest) ? current : latest;
    }, parseISO(memberAssignments[0].endDate));
  }, [memberAssignments]);

  return (
    <tr className={`hover:bg-slate-50/50 transition-colors group ${selected ? 'bg-indigo-50/30' : ''}`}>
      <td className="p-4 w-12 text-center">
        <input 
          type="checkbox" 
          checked={selected}
          onChange={onToggleSelect}
          className="rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
        />
      </td>
      <td className="p-4 pl-0">
        <div className="flex items-center gap-3">
          <div 
            className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 overflow-hidden shrink-0 cursor-pointer hover:ring-2 hover:ring-indigo-500 transition-all"
            onClick={onEditMember}
          >
            <img src={member.avatar} alt="" className="w-full h-full object-cover" />
          </div>
          <div className="min-w-0 flex flex-col items-start gap-0.5">
            <div className="flex items-center gap-2">
              <p className={`text-sm font-bold group-hover:text-indigo-600 transition-colors ${member.lastWorkingDay ? 'text-rose-600' : 'text-slate-900'}`}>{obfuscate(member.name, privacyMode)}</p>
              {member.isManager && (
                <span className="px-1.5 py-[1px] rounded text-[8px] font-bold bg-indigo-100 text-indigo-700 border border-indigo-200 tracking-wider">MANAGER</span>
              )}
              {member.employmentType === 'contractor' && (
                <span className="px-1.5 py-[1px] rounded text-[8px] font-bold bg-rose-100 text-rose-700 border border-rose-200 tracking-wider">CONTRACTOR</span>
              )}
              {member.employmentType === 'intern' && (
                <span className="px-1.5 py-[1px] rounded text-[8px] font-bold bg-amber-100 text-amber-700 border border-amber-200 tracking-wider">INTERN</span>
              )}
            </div>
            <p className="text-xs text-slate-500 font-medium">{member.role}</p>
            {manager ? (
               <p className="text-[10px] text-slate-400 font-medium italic">Reports to: {obfuscate(manager.name, privacyMode)}</p>
            ) : (
               <div className="flex items-center gap-1 mt-0.5 text-rose-500 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-100/50">
                 <AlertCircle className="w-2.5 h-2.5" />
                 <span className="text-[9px] font-bold uppercase tracking-tight">Manager Unset</span>
               </div>
            )}
            {reporteesCount > 0 && (
               <p className="text-[10px] text-indigo-500 font-bold">{reporteesCount} Direct Reports</p>
            )}
          </div>
        </div>
      </td>
      <td className="p-4">
        <div className="flex flex-col gap-2 min-w-[140px]">
          {member.companyStartDate && (
            <div className="flex flex-col">
              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Joined</span>
              <span className="text-[10px] font-semibold text-slate-600 border-none p-0 bg-transparent">
                {format(parseISO(member.companyStartDate), 'MMM d, yyyy')}
              </span>
            </div>
          )}
          {member.lastWorkingDay && (
            <div className="flex flex-col">
              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Last Day</span>
              <span className="text-[10px] font-semibold text-rose-500 border-none p-0 bg-transparent">
                {format(parseISO(member.lastWorkingDay), 'MMM d, yyyy')}
              </span>
            </div>
          )}
        </div>
      </td>
      <td className="p-4">
        <div className="space-y-2">
          <div className="flex flex-wrap gap-1">
            {member.skills.map(skill => (
              <span key={skill.name} className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[9px] font-bold whitespace-nowrap flex items-center gap-1">
                {skill.name}
                <span className="text-slate-400">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <span key={i} className={i < skill.rating ? "text-indigo-500" : "text-slate-300"}>•</span>
                  ))}
                </span>
              </span>
            ))}
          </div>
          <div className="flex flex-wrap gap-1">
            {currentProjects.length > 0 ? (
              currentProjects.map(p => (
                <div key={p?.id} className="flex items-center gap-1 px-1.5 py-0.5 rounded border border-slate-200">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: p?.color }} />
                  <span className="text-[9px] font-bold text-slate-700 truncate max-w-[80px]">{obfuscate(p?.name || '', privacyMode)}</span>
                </div>
              ))
            ) : null}
          </div>
        </div>
      </td>
      <td className="p-4 text-center">
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3 text-slate-400" />
            <span className={`text-xs font-bold ${totalWeeklyHours > member.capacity ? 'text-rose-600' : 'text-slate-900'}`}>
              {totalWeeklyHours}h
            </span>
          </div>
          <div className="w-16 h-1 bg-slate-100 rounded-full mt-1.5 overflow-hidden">
            <div 
              className={`h-full ${totalWeeklyHours > member.capacity ? 'bg-rose-500' : 'bg-green-500'}`}
              style={{ width: `${Math.min((totalWeeklyHours / member.capacity) * 100, 100)}%` }}
            />
          </div>
        </div>
      </td>
      <td className="p-4">
        {rollOffDate ? (
          <div className="flex items-center gap-1.5 text-slate-600">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs font-semibold">{format(rollOffDate, 'MMM d, yy')}</span>
          </div>
        ) : (
          <span className="text-xs text-slate-300">—</span>
        )}
      </td>
      <td className="p-4 text-right">
        <div className="flex justify-end gap-1">
          <button 
            onClick={onEditMember}
            className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors text-slate-400 hover:text-indigo-600 shadow-sm"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button 
            onClick={() => onDeleteMember(member.id)}
            className="p-1.5 hover:bg-rose-50 rounded-lg transition-colors text-slate-400 hover:text-rose-600 shadow-sm"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}

import React, { useMemo } from 'react';
import { TeamMember, Assignment } from '../types';
import { obfuscate } from '../lib/utils';
import { Users, AlertCircle, Briefcase, Clock } from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface UnassignedReportViewProps {
  members: TeamMember[];
  assignments: Assignment[];
  onEditMember: (member: TeamMember) => void;
  privacyMode: boolean;
}

export default function UnassignedReportView({ members, assignments, onEditMember, privacyMode }: UnassignedReportViewProps) {
  const unassignedMembers = useMemo(() => {
    const assignedIds = new Set(assignments.map(a => a.memberId));
    return members.filter(member => !assignedIds.has(member.id));
  }, [members, assignments]);

  const roleSummary = useMemo(() => {
    const counts = new Map<string, number>();
    unassignedMembers.forEach(member => {
      counts.set(member.role, (counts.get(member.role) || 0) + 1);
    });
    return Array.from(counts.entries())
      .map(([role, count]) => ({ role, count }))
      .sort((a, b) => b.count - a.count || a.role.localeCompare(b.role));
  }, [unassignedMembers]);

  const typeSummary = useMemo(() => {
    const counts = { contractor: 0, intern: 0, employee: 0 };
    unassignedMembers.forEach(member => {
      const type = member.employmentType || 'employee';
      counts[type] = (counts[type] || 0) + 1;
    });
    return counts;
  }, [unassignedMembers]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Unassigned Roles</h2>
          <p className="text-sm text-slate-500 mt-1">All people without current project allocations are surfaced here with role and employment type visibility.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full sm:w-auto">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <p className="text-[10px] uppercase tracking-wider font-black text-slate-400">Unassigned people</p>
            <p className="text-3xl font-black text-slate-900 mt-2">{unassignedMembers.length}</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <p className="text-[10px] uppercase tracking-wider font-black text-slate-400">Roles uncovered</p>
            <p className="text-3xl font-black text-slate-900 mt-2">{roleSummary.length}</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <p className="text-[10px] uppercase tracking-wider font-black text-slate-400">Contingent on bench</p>
            <p className="text-3xl font-black text-slate-900 mt-2">{typeSummary.contractor + typeSummary.intern}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-4 text-slate-700">
            <Users className="w-4 h-4" />
            <h3 className="text-sm font-bold">Top unassigned roles</h3>
          </div>
          <div className="space-y-3">
            {roleSummary.length > 0 ? roleSummary.map(item => (
              <div key={item.role} className="flex items-center justify-between gap-3">
                <span className="text-sm font-semibold text-slate-800">{item.role}</span>
                <span className="text-sm font-black text-indigo-600">{item.count}</span>
              </div>
            )) : (
              <p className="text-sm text-slate-500">No unassigned roles found.</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-4 text-slate-700">
            <Briefcase className="w-4 h-4" />
            <h3 className="text-sm font-bold">Employment type mix</h3>
          </div>
          <div className="space-y-2">
            {(['employee', 'contractor', 'intern'] as const).map(type => (
              <div key={type} className="flex items-center justify-between gap-3">
                <span className="text-sm text-slate-700 capitalize">{type}</span>
                <span className="text-sm font-black text-slate-900">{typeSummary[type]}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-4 text-slate-700">
            <Clock className="w-4 h-4" />
            <h3 className="text-sm font-bold">Unassigned by contract type</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm text-slate-700">
              <span>Contractors</span>
              <span className="font-black text-rose-700">{typeSummary.contractor}</span>
            </div>
            <div className="flex items-center justify-between text-sm text-slate-700">
              <span>Interns</span>
              <span className="font-black text-amber-700">{typeSummary.intern}</span>
            </div>
            <div className="flex items-center justify-between text-sm text-slate-700">
              <span>Employees</span>
              <span className="font-black text-indigo-600">{typeSummary.employee}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Unassigned resources</h3>
            <p className="text-xs text-slate-500 mt-1">Tap any member to edit and assign them to a project.</p>
          </div>
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">{unassignedMembers.length} people</div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-200">
                <th className="p-4 text-[10px] font-bold uppercase tracking-wider text-slate-400">Name</th>
                <th className="p-4 text-[10px] font-bold uppercase tracking-wider text-slate-400">Role</th>
                <th className="p-4 text-[10px] font-bold uppercase tracking-wider text-slate-400">Type</th>
                <th className="p-4 text-[10px] font-bold uppercase tracking-wider text-slate-400">Capacity</th>
                <th className="p-4 text-[10px] font-bold uppercase tracking-wider text-slate-400">Start Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {unassignedMembers.map(member => (
                <tr key={member.id} className="hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => onEditMember(member)}>
                  <td className="p-4 text-sm font-bold text-slate-900">{obfuscate(member.name, privacyMode)}</td>
                  <td className="p-4 text-sm font-semibold text-amber-700">{member.role}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-tight ${member.employmentType === 'contractor' ? 'bg-rose-100 text-rose-700 border border-rose-100' : member.employmentType === 'intern' ? 'bg-amber-100 text-amber-700 border border-amber-100' : 'bg-indigo-100 text-indigo-700 border border-indigo-100'}`}>
                      {member.employmentType || 'Employee'}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-slate-600 font-semibold">{member.capacity}h</td>
                  <td className="p-4 text-sm text-slate-600">{member.companyStartDate ? format(parseISO(member.companyStartDate), 'MMM d, yyyy') : 'N/A'}</td>
                </tr>
              ))}
              {unassignedMembers.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-slate-400 italic">No unassigned roles are present right now.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

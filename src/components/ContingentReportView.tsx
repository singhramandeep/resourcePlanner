import React, { useMemo } from 'react';
import { TeamMember, Assignment } from '../types';
import { obfuscate } from '../lib/utils';
import { Users, Briefcase, AlertCircle, GraduationCap } from 'lucide-react';
import { format, parseISO, isAfter } from 'date-fns';

interface ContingentReportViewProps {
  members: TeamMember[];
  assignments: Assignment[];
  onEditMember: (member: TeamMember) => void;
  privacyMode: boolean;
}

export default function ContingentReportView({ members, assignments, onEditMember, privacyMode }: ContingentReportViewProps) {
  const contingentMembers = useMemo(() => {
    return members.filter(member => member.employmentType === 'contractor' || member.employmentType === 'intern');
  }, [members]);

  const assignmentLookup = useMemo(() => {
    const map = new Map<string, Assignment[]>();
    assignments.forEach(a => {
      const list = map.get(a.memberId) || [];
      list.push(a);
      map.set(a.memberId, list);
    });
    return map;
  }, [assignments]);

  const stats = useMemo(() => {
    const total = contingentMembers.length;
    const contractors = contingentMembers.filter(m => m.employmentType === 'contractor').length;
    const interns = contingentMembers.filter(m => m.employmentType === 'intern').length;
    const assigned = contingentMembers.filter(m => (assignmentLookup.get(m.id) || []).length > 0).length;
    const unassigned = total - assigned;
    return { total, contractors, interns, assigned, unassigned };
  }, [contingentMembers, assignmentLookup]);

  const rows = useMemo(() => {
    return contingentMembers.map(member => {
      const memberAssignments = assignmentLookup.get(member.id) || [];
      const latestEnd = memberAssignments.length > 0
        ? memberAssignments.reduce((latest, a) => {
            const current = parseISO(a.endDate);
            return isAfter(current, latest) ? current : latest;
          }, parseISO(memberAssignments[0].endDate))
        : null;

      return {
        member,
        allocated: memberAssignments.length > 0,
        hours: memberAssignments.reduce((sum, a) => sum + a.hoursPerWeek, 0),
        latestEnd,
      };
    });
  }, [contingentMembers, assignmentLookup]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Contingent Workforce</h2>
          <p className="text-sm text-slate-500 mt-1">A quick view of all interns and contractors, including who is currently unassigned.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full sm:w-auto">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <p className="text-[10px] uppercase tracking-wider font-black text-slate-400">Total contingent</p>
            <p className="text-3xl font-black text-slate-900 mt-2">{stats.total}</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <p className="text-[10px] uppercase tracking-wider font-black text-slate-400">Assigned</p>
            <p className="text-3xl font-black text-emerald-600 mt-2">{stats.assigned}</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <p className="text-[10px] uppercase tracking-wider font-black text-slate-400">Unassigned</p>
            <p className="text-3xl font-black text-amber-600 mt-2">{stats.unassigned}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-4 text-slate-700">
            <Users className="w-4 h-4" />
            <h3 className="text-sm font-bold">Contractors</h3>
          </div>
          <p className="text-3xl font-black text-rose-600">{stats.contractors}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-4 text-slate-700">
            <GraduationCap className="w-4 h-4" />
            <h3 className="text-sm font-bold">Interns</h3>
          </div>
          <p className="text-3xl font-black text-amber-600">{stats.interns}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-4 text-slate-700">
            <Briefcase className="w-4 h-4" />
            <h3 className="text-sm font-bold">Unassigned contingent</h3>
          </div>
          <p className="text-3xl font-black text-amber-600">{stats.unassigned}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Contingent resource details</h3>
            <p className="text-xs text-slate-500 mt-1">Click a row to edit the resource or update their assignment.</p>
          </div>
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">{rows.length} people</div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-200">
                <th className="p-4 text-[10px] font-bold uppercase tracking-wider text-slate-400">Name</th>
                <th className="p-4 text-[10px] font-bold uppercase tracking-wider text-slate-400">Role</th>
                <th className="p-4 text-[10px] font-bold uppercase tracking-wider text-slate-400">Type</th>
                <th className="p-4 text-[10px] font-bold uppercase tracking-wider text-slate-400">Hours</th>
                <th className="p-4 text-[10px] font-bold uppercase tracking-wider text-slate-400">Ends</th>
                <th className="p-4 text-[10px] font-bold uppercase tracking-wider text-slate-400">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map(row => (
                <tr key={row.member.id} className="hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => onEditMember(row.member)}>
                  <td className="p-4 text-sm font-bold text-slate-900">{obfuscate(row.member.name, privacyMode)}</td>
                  <td className={`p-4 text-sm font-semibold ${row.allocated ? 'text-slate-600' : 'text-amber-700'}`}>{row.member.role}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-tight ${row.member.employmentType === 'contractor' ? 'bg-rose-100 text-rose-700 border border-rose-100' : 'bg-amber-100 text-amber-700 border border-amber-100'}`}>
                      {row.member.employmentType === 'contractor' ? 'Contractor' : 'Intern'}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-slate-600 font-semibold">{row.hours}h</td>
                  <td className="p-4 text-sm text-slate-600 font-semibold">{row.latestEnd ? format(row.latestEnd, 'MMM d, yyyy') : '—'}</td>
                  <td className="p-4 text-sm font-bold uppercase tracking-wider">
                    {row.allocated ? (
                      <span className="text-emerald-700">Assigned</span>
                    ) : (
                      <span className="text-amber-700">Unassigned</span>
                    )}
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-slate-400 italic">No interns or contractors are in the current roster.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

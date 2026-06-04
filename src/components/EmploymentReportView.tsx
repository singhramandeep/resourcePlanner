/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import { TeamMember, Assignment } from '../types';
import { obfuscate, cn } from '../lib/utils';
import { Users, Briefcase, Calendar, Clock, AlertCircle } from 'lucide-react';
import { format, parseISO, isAfter } from 'date-fns';

interface EmploymentReportViewProps {
  type: 'contractor' | 'intern';
  members: TeamMember[];
  assignments: Assignment[];
  onEditMember: (member: TeamMember) => void;
  privacyMode: boolean;
}

export default function EmploymentReportView({ 
  type, 
  members, 
  assignments, 
  onEditMember, 
  privacyMode 
}: EmploymentReportViewProps) {
  const filteredMembers = useMemo(() => {
    return members.filter(m => m.employmentType === type);
  }, [members, type]);

  const stats = useMemo(() => {
    const totalCount = filteredMembers.length;
    const activeAllocations = assignments.filter(a => 
      filteredMembers.some(m => m.id === a.memberId)
    ).length;
    
    // People rolling off in next 30 days
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const rollingOff = filteredMembers.filter(m => {
      const memberAssignments = assignments.filter(a => a.memberId === m.id);
      if (memberAssignments.length === 0) return false;
      const latestEnd = memberAssignments.reduce((latest, a) => {
        const current = parseISO(a.endDate);
        return isAfter(current, latest) ? current : latest;
      }, parseISO(memberAssignments[0].endDate));
      return latestEnd <= thirtyDaysFromNow;
    }).length;

    return [
      { label: `Total ${type}s`, value: totalCount, icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50' },
      { label: 'Active Assignments', value: activeAllocations, icon: Briefcase, color: 'text-emerald-600', bg: 'bg-emerald-50' },
      { label: 'Rolling Off (30d)', value: rollingOff, icon: Clock, color: 'text-rose-600', bg: 'bg-rose-50' },
    ];
  }, [filteredMembers, assignments, type]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800 capitalize">
            {type === 'contractor' ? 'Contractors' : 'Interns'} Overview
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-1 uppercase tracking-wider">
            Management and tracking for non-full-time resources
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", stat.bg, stat.color)}>
              <stat.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
              <p className="text-2xl font-black text-slate-800">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-200">
                <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-6 text-center w-16">#</th>
                <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Resource</th>
                <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Role</th>
                <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Current Projects</th>
                <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Start Date</th>
                <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMembers.map((member, idx) => {
                const memberAssignments = assignments.filter(a => a.memberId === member.id);
                const totalHours = memberAssignments.reduce((sum, a) => sum + a.hoursPerWeek, 0);
                const isBench = totalHours === 0;

                return (
                  <tr key={member.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="p-4 text-xs font-bold text-slate-300 text-center pl-6">{idx + 1}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <img 
                          src={member.avatar} 
                          alt="" 
                          className="w-10 h-10 rounded-full border border-slate-200 shadow-sm cursor-pointer ring-0 hover:ring-2 hover:ring-indigo-500 transition-all"
                          onClick={() => onEditMember(member)}
                        />
                        <div>
                          <p onClick={() => onEditMember(member)} className="text-sm font-bold text-slate-800 cursor-pointer hover:text-indigo-600 transition-colors">
                            {obfuscate(member.name, privacyMode)}
                          </p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase">{member.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="text-[11px] font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded uppercase tracking-tight">
                        {member.role}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-wrap gap-1">
                        {memberAssignments.length > 0 ? (
                          memberAssignments.slice(0, 2).map((a, i) => (
                            <span key={i} className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                              PRJ-{a.projectId.slice(-3).toUpperCase()}
                            </span>
                          ))
                        ) : (
                          <span className="text-[10px] font-bold text-slate-400 italic">None</span>
                        )}
                        {memberAssignments.length > 2 && (
                          <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                            +{memberAssignments.length - 2} more
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-xs font-semibold text-slate-600">
                      {member.companyStartDate ? format(parseISO(member.companyStartDate), 'MMM d, yyyy') : 'N/A'}
                    </td>
                    <td className="p-4">
                      {isBench ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black bg-rose-50 text-rose-600 border border-rose-100 uppercase tracking-widest">
                          <AlertCircle className="w-3 h-3" /> Bench
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-600 border border-emerald-100 uppercase tracking-widest">
                          Allocated
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filteredMembers.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-slate-400 italic text-sm">
                    No {type}s found in the current selection.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

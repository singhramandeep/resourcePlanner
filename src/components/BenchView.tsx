/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import { MOCK_TEAM_MEMBERS } from '../mockData';
import { Assignment, TeamMember } from '../types';
import { 
  format, 
  parseISO, 
  eachMonthOfInterval, 
  startOfYear, 
  endOfYear,
  isWithinInterval,
  startOfMonth,
  endOfMonth
} from 'date-fns';
import { ChevronLeft, Info, Users, UserMinus } from 'lucide-react';
import { obfuscate } from '../lib/utils';

interface BenchViewProps {
  members: TeamMember[];
  assignments: Assignment[];
  onEditMember: (member: TeamMember) => void;
  privacyMode: boolean;
}

export default function BenchView({ members, assignments, onEditMember, privacyMode }: BenchViewProps) {
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  const months = useMemo(() => {
    return eachMonthOfInterval({
      start: startOfYear(new Date(currentYear, 0, 1)),
      end: endOfYear(new Date(currentYear, 0, 1))
    });
  }, [currentYear]);

  const benchData = useMemo(() => {
    return months.map(month => {
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);
      
      const onBench = members.filter(member => {
        const memberAssignments = assignments.filter(a => {
          if (a.memberId !== member.id) return false;
          const start = parseISO(a.startDate);
          const end = parseISO(a.endDate);
          return (
            isWithinInterval(start, { start: monthStart, end: monthEnd }) ||
            isWithinInterval(end, { start: monthStart, end: monthEnd }) ||
            (start <= monthStart && end >= monthEnd)
          );
        });
        
        const totalHours = memberAssignments.reduce((sum, a) => sum + a.hoursPerWeek, 0);
        return totalHours === 0;
      });

      return {
        month,
        count: onBench.length,
        members: onBench
      };
    });
  }, [months, assignments]);

  // Find the maximum number of people on bench in any month to determine row height
  const maxBenchCount = Math.max(...benchData.map(d => d.count), 1);

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden font-sans">
      <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white">
        <div className="flex items-center gap-4">
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-widest flex items-center gap-2">
             Bench Analytics
          </h2>
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1">
            <button onClick={() => setCurrentYear(y => y - 1)} className="hover:bg-white p-0.5 rounded transition-colors shadow-sm">
              <ChevronLeft className="w-4 h-4 text-slate-400" />
            </button>
            <span className="text-xs font-black text-slate-700 min-w-[32px] text-center">{currentYear}</span>
            <button onClick={() => setCurrentYear(y => y + 1)} className="hover:bg-white p-0.5 rounded transition-colors shadow-sm">
              <ChevronLeft className="w-4 h-4 text-slate-400 rotate-180" />
            </button>
          </div>
        </div>
        <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-tight">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-rose-500" />
             High Availability
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-[#F8FAFC]">
        <table className="w-full border-separate border-spacing-0 table-fixed">
          <thead className="sticky top-0 z-20">
            <tr className="bg-[#EF6C33] text-white">
              <th className="w-48 p-3 text-left border-b border-r border-white/20 sticky left-0 bg-[#EF6C33] z-30">
                <span className="text-[10px] font-black uppercase tracking-widest">Category</span>
              </th>
              {months.map(month => (
                <th key={month.toISOString()} className="p-3 text-center border-b border-r border-white/20">
                  <span className="text-[10px] font-black uppercase tracking-wider">{format(month, 'MMMM')}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="bg-slate-100/80">
              <td className="p-3 border-b border-r border-slate-200 sticky left-0 bg-[#F1F5F9] z-10 font-bold text-slate-600 text-xs">
                Bench Count
              </td>
              {benchData.map(data => (
                <td key={data.month.toISOString()} className="p-3 border-b border-r border-slate-200 text-center font-bold text-slate-700 text-xs">
                  ({data.count})
                </td>
              ))}
            </tr>
            <tr className="bg-[#EF6C33]">
              <td colSpan={months.length + 1} className="p-2 border-b border-white/20 text-white font-black text-[10px] uppercase tracking-widest px-4">
                Bench Details
              </td>
            </tr>
            {/* We will render names vertically in columns or as a list? 
                The reference image shows names listed under each month. 
                In a table, we can either have many rows or one row with a list.
                One row with a list seems closer to the image layout.
            */}
            <tr className="align-top">
              <td className="p-3 border-b border-r border-slate-200 sticky left-0 bg-white z-10 font-bold text-slate-400 text-xs italic">
                {/* empty spacer */}
              </td>
              {benchData.map(data => (
                <td key={data.month.toISOString()} className="p-3 border-b border-r border-slate-200 bg-white">
                  <div className="flex flex-col gap-1.5">
                    {data.members.map(member => (
                      <div 
                        key={member.id} 
                        className="flex flex-col cursor-pointer group/name"
                        onClick={() => onEditMember(member)}
                      >
                        <div className="flex items-center gap-1.5 leading-tight">
                          <span className="text-[10px] font-bold text-slate-700 group-hover/name:text-indigo-600 transition-colors">
                            {obfuscate(member.name, privacyMode)}
                          </span>
                          {member.employmentType === 'contractor' && (
                            <span className="px-1 py-0 rounded-[1px] text-[6px] font-black bg-rose-100 text-rose-700 border border-rose-200 tracking-tighter uppercase shrink-0">C</span>
                          )}
                          {member.employmentType === 'intern' && (
                            <span className="px-1 py-0 rounded-[1px] text-[6px] font-black bg-amber-100 text-amber-700 border border-amber-200 tracking-tighter uppercase shrink-0">I</span>
                          )}
                        </div>
                        <span className="text-[8px] font-medium text-slate-400 tracking-tighter uppercase">
                          ({member.role.split(' ').map(w => w[0]).join('')})
                        </span>
                      </div>
                    ))}
                    {data.count === 0 && (
                      <span className="text-[9px] font-bold text-slate-300 italic">— Full Utilization</span>
                    )}
                  </div>
                </td>
              ))}
            </tr>
            {/* Pad with empty rows to look more like a spreadsheet */}
            {[...Array(10)].map((_, i) => (
              <tr key={i}>
                <td className="p-3 border-b border-r border-slate-100 bg-white sticky left-0 z-10"></td>
                {months.map(m => (
                  <td key={m.toISOString()} className="p-3 border-b border-r border-slate-100 bg-white"></td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="p-4 bg-slate-50 border-t border-slate-200">
        <div className="flex items-center gap-2 text-slate-500">
          <Info className="w-4 h-4" />
          <span className="text-xs font-semibold">Assumptions: Bench is calculated as resources with 0 hours allocated in the given month.</span>
        </div>
      </div>
    </div>
  );
}

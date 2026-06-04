/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useMemo } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { format, parseISO, isAfter, isBefore, subMonths, addMonths, differenceInDays } from 'date-fns';
import { obfuscate } from '../lib/utils';
import { MOCK_TEAM_MEMBERS, MOCK_PROJECTS } from '../mockData';
import { TrendingUp, AlertCircle, CheckCircle2, Users, ArrowUpRight, ArrowDownRight, Briefcase } from 'lucide-react';
import { Assignment, TeamMember, Project } from '../types';

interface ReportingViewProps {
  members: TeamMember[];
  projects: Project[];
  assignments: Assignment[];
  onEditMember: (member: TeamMember) => void;
  privacyMode: boolean;
}

export default function ReportingView({ members, projects, assignments, onEditMember, privacyMode }: ReportingViewProps) {
  const capacityData = useMemo(() => {
    return members.map(member => {
      const memberAssignments = assignments.filter(a => a.memberId === member.id);
      const totalHours = memberAssignments.reduce((acc, a) => acc + a.hoursPerWeek, 0);
      const utilization = Math.round((totalHours / member.capacity) * 100);
      return {
        name: obfuscate(member.name, privacyMode),
        utilization,
        status: utilization > 100 ? 'Over' : utilization < 50 ? 'Under' : 'Optimal'
      };
    });
  }, [members, assignments]);

  const projectAllocation = useMemo(() => {
    return projects.map(project => {
      const hours = assignments
        .filter(a => a.projectId === project.id)
        .reduce((acc, a) => acc + a.hoursPerWeek, 0);
      return {
        name: obfuscate(project.name, privacyMode),
        hours,
        color: project.color
      };
    });
  }, [projects, assignments]);

  const mobilityReports = useMemo(() => {
    const now = new Date();
    const leaversList = members.filter(m => m.lastWorkingDay).map(member => {
      const lwd = parseISO(member.lastWorkingDay!);
      const memberAssignments = assignments.filter(a => a.memberId === member.id);
      const plannedProjects = Array.from(new Set(memberAssignments.map(a => projects.find(p => p.id === a.projectId)?.name))).filter(Boolean);
      
      const lastAssignmentEnd = memberAssignments.length > 0 
        ? memberAssignments.reduce((latest, a) => {
            const current = parseISO(a.endDate);
            return isAfter(current, latest) ? current : latest;
          }, parseISO(memberAssignments[0].endDate))
        : null;

      const benchDays = lastAssignmentEnd && isAfter(lwd, lastAssignmentEnd) 
        ? differenceInDays(lwd, lastAssignmentEnd) 
        : 0;

      return {
        ...member,
        date: member.lastWorkingDay,
        plannedProjects,
        benchDays: Math.max(0, benchDays),
        type: 'leaver'
      };
    }).sort((a, b) => parseISO(a.date!).getTime() - parseISO(b.date!).getTime());

    const joinersList = members
      .filter(m => {
        const start = parseISO(m.companyStartDate);
        const threeMonthsAgo = subMonths(now, 6);
        const threeMonthsFuture = addMonths(now, 6);
        return isAfter(start, threeMonthsAgo) && isBefore(start, threeMonthsFuture);
      })
      .map(member => {
        const memberAssignments = assignments.filter(a => a.memberId === member.id);
        const plannedProjects = Array.from(new Set(memberAssignments.map(a => projects.find(p => p.id === a.projectId)?.name))).filter(Boolean);
        
        const firstAssignmentStart = memberAssignments.length > 0
          ? memberAssignments.reduce((earliest, a) => {
              const current = parseISO(a.startDate);
              return isBefore(current, earliest) ? current : earliest;
            }, parseISO(memberAssignments[0].startDate))
          : null;

        const start = parseISO(member.companyStartDate);
        const benchDays = firstAssignmentStart && isAfter(firstAssignmentStart, start)
          ? differenceInDays(firstAssignmentStart, start)
          : 0;

        return {
          ...member,
          date: member.companyStartDate,
          plannedProjects,
          benchDays: Math.max(0, benchDays),
          type: 'joiner'
        };
      })
      .sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime());

    return { leavers: leaversList, joiners: joinersList };
  }, [members, assignments, projects]);

  const stats = useMemo(() => {
    const totalCapacity = members.reduce((acc, m) => acc + m.capacity, 0);
    const totalAllocated = assignments.reduce((acc, a) => acc + a.hoursPerWeek, 0);
    const avgUtilization = Math.round((totalAllocated / totalCapacity) * 100);
    const riskAlerts = capacityData.filter(d => d.status === 'Over').length;
    const activeProjects = new Set(assignments.map(a => a.projectId)).size;
    const totalResources = members.length;

    return [
      { label: 'Total Resources', value: `${totalResources}`, sub: 'Team members', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
      { label: 'Active Projects', value: `${activeProjects}`, sub: 'In progress', icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
      { label: 'Avg. Utilization', value: `${avgUtilization}%`, sub: 'Current load', icon: TrendingUp, color: 'text-indigo-600', bg: 'bg-indigo-50' },
      { label: 'Risk Alerts', value: `${riskAlerts}`, sub: 'High workload', icon: AlertCircle, color: 'text-rose-600', bg: 'bg-rose-50' },
    ];
  }, [assignments, capacityData]);

  return (
    <div className="space-y-6">
      {/* Stats Cards (Bento) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <div 
            key={stat.label} 
            className={`p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between relative overflow-hidden ${i === 1 ? 'bg-indigo-600 text-white border-transparent' : 'bg-white'}`}
          >
            {i === 1 && <div className="absolute right-[-20px] top-[-20px] w-32 h-32 bg-white/10 rounded-full blur-2xl" />}
            
            <div className="relative z-10 flex flex-col gap-1">
              <div className="flex justify-between items-center mb-1">
                <h3 className={`text-[10px] font-bold uppercase tracking-wider ${i === 1 ? 'opacity-80' : 'text-slate-500'}`}>
                  {stat.label}
                </h3>
                {i !== 1 && (
                  <span className={`${stat.bg} ${stat.color} text-[10px] font-bold px-1.5 rounded`}>
                    ACTIVE
                  </span>
                )}
              </div>
              <div className={`text-2xl font-bold ${i === 1 ? 'text-white' : 'text-slate-900'}`}>
                {stat.value}
              </div>
              <div className={`text-[10px] font-medium ${i === 1 ? 'opacity-90' : 'text-slate-400'}`}>
                {stat.sub}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-6">
        {/* Capacity Chart */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-slate-800 tracking-tight text-sm">Team Utilization Heatmap</h3>
            <div className="flex gap-3">
              <span className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
                <div className="w-2 h-2 rounded-full bg-rose-500" /> Overload
              </span>
              <span className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
                <div className="w-2 h-2 rounded-full bg-emerald-500" /> Optimal
              </span>
            </div>
          </div>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={capacityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 600, fill: '#94A3B8' }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 600, fill: '#94A3B8' }}
                  unit="%"
                />
                <Tooltip 
                  cursor={{ fill: '#F8FAFB' }}
                  contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', fontSize: '12px' }}
                />
                <Bar dataKey="utilization" radius={[4, 4, 0, 0]} barSize={32}>
                  {capacityData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.utilization > 100 ? '#F43F5E' : entry.utilization < 50 ? '#F59E0B' : '#10B981'} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Project Distribution */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-slate-800 tracking-tight text-sm">Resource Distribution</h3>
            <span className="text-slate-400 text-[10px] font-bold bg-slate-50 px-2 py-0.5 rounded border border-slate-100 uppercase tracking-wider">
              Allocation
            </span>
          </div>
          <div className="flex-1 flex gap-6 items-center">
            <div className="w-1/2 h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={projectAllocation}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={6}
                    dataKey="hours"
                  >
                    {projectAllocation.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', fontSize: '11px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-1/2 space-y-2.5">
              {projectAllocation.map((item) => (
                <div key={item.name} className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: item.color }} />
                    <span className="text-xs font-semibold text-slate-700">{item.name}</span>
                  </div>
                  <span className="text-xs font-bold text-slate-400">{item.hours}h</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Joiners & Leavers Reports */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-slate-800 tracking-tight text-sm">Joiners (Recent & Upcoming)</h3>
            <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded uppercase tracking-wider">
              <ArrowUpRight className="w-3 h-3" /> New Talent
            </span>
          </div>
          <div className="flex-1 space-y-3">
            {mobilityReports.joiners.length > 0 ? (
              mobilityReports.joiners.map(m => (
                <div key={m.id} className="p-3 bg-slate-50/50 rounded-xl border border-slate-100 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img 
                      src={m.avatar} 
                      className="w-8 h-8 rounded-full border border-slate-200 shadow-sm cursor-pointer hover:ring-2 hover:ring-emerald-500 transition-all" 
                      onClick={() => onEditMember(m)}
                      alt="" 
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-black text-slate-800 truncate">{obfuscate(m.name, privacyMode)}</p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter truncate">{m.role}</p>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-[10px] font-black text-slate-700">{format(parseISO(m.date), 'd MMM yyyy')}</p>
                    <div className="flex items-center gap-1 justify-end mt-0.5">
                      <Briefcase className="w-2.5 h-2.5 text-slate-300" />
                      <p className="text-[9px] font-bold text-slate-500 truncate max-w-[80px]">
                        {m.plannedProjects.length > 0 ? m.plannedProjects.map(p => obfuscate(p, privacyMode)).join(', ') : 'No projects'}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-slate-300 italic">
                <Users className="w-8 h-8 mb-2 opacity-20" />
                <span className="text-xs">No recent or upcoming joiners</span>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-slate-800 tracking-tight text-sm">Upcoming Leavers</h3>
            <span className="flex items-center gap-1 text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded uppercase tracking-wider">
              <ArrowDownRight className="w-3 h-3" /> Exit Impact
            </span>
          </div>
          <div className="flex-1 space-y-3">
            {mobilityReports.leavers.length > 0 ? (
              mobilityReports.leavers.map(m => (
                <div key={m.id} className="p-3 bg-slate-50/50 rounded-xl border border-slate-100 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img 
                      src={m.avatar} 
                      className="w-8 h-8 rounded-full border border-slate-200 shadow-sm cursor-pointer hover:ring-2 hover:ring-rose-500 transition-all" 
                      onClick={() => onEditMember(m)}
                      alt="" 
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-black text-rose-600 truncate">{obfuscate(m.name, privacyMode)}</p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter truncate">{m.role}</p>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-[10px] font-black text-slate-700">{format(parseISO(m.date!), 'd MMM yyyy')}</p>
                    <p className="text-[9px] font-black text-yellow-600 mt-0.5">
                      {m.benchDays > 0 ? `${m.benchDays}d Expected Bench` : 'Fully assigned'}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-slate-300 italic">
                <Users className="w-8 h-8 mb-2 opacity-20" />
                <span className="text-xs">No upcoming leavers detected</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

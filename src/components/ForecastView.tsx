/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import { 
  format, 
  addWeeks, 
  startOfWeek, 
  endOfWeek, 
  eachWeekOfInterval, 
  isWithinInterval, 
  parseISO 
} from 'date-fns';
import { 
  TrendingUp, 
  Users, 
  Briefcase, 
  AlertCircle,
  Calendar
} from 'lucide-react';
import { ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { TeamMember, Assignment, Project } from '../types';
import { obfuscate } from '../lib/utils';

interface ForecastViewProps {
  members: TeamMember[];
  projects: Project[];
  assignments: Assignment[];
  privacyMode: boolean;
}

type ForecastPeriod = 8 | 12 | 16;

export default function ForecastView({ members, projects, assignments, privacyMode }: ForecastViewProps) {
  const [weeksCount, setWeeksCount] = useState<ForecastPeriod>(8);

  const forecastData = useMemo(() => {
    const start = startOfWeek(new Date());
    const end = endOfWeek(addWeeks(start, weeksCount - 1));
    const weeks = eachWeekOfInterval({ start, end });

    return weeks.map(weekStart => {
      const weekEnd = endOfWeek(weekStart);
      
      let totalCapacity = 0;
      let totalAllocated = 0;
      
      const memberForecasts = members.map(member => {
        const memberAssignments = assignments.filter(a => {
          if (a.memberId !== member.id) return false;
          const aStart = parseISO(a.startDate);
          const aEnd = parseISO(a.endDate);
          return (
            isWithinInterval(aStart, { start: weekStart, end: weekEnd }) ||
            isWithinInterval(aEnd, { start: weekStart, end: weekEnd }) ||
            (aStart <= weekStart && aEnd >= weekEnd)
          );
        });

        const allocatedHours = memberAssignments.reduce((sum, a) => sum + a.hoursPerWeek, 0);
        totalCapacity += member.capacity;
        totalAllocated += allocatedHours;

        return {
          memberId: member.id,
          hours: allocatedHours,
          capacity: member.capacity
        };
      });

      return {
        week: format(weekStart, 'MMM d'),
        fullDate: weekStart,
        capacity: totalCapacity,
        allocated: totalAllocated,
        utilization: totalCapacity > 0 ? Math.round((totalAllocated / totalCapacity) * 100) : 0,
        benchCount: memberForecasts.filter(m => m.hours === 0).length,
        overloadCount: memberForecasts.filter(m => m.hours > m.capacity).length
      };
    });
  }, [members, assignments, weeksCount]);

  const stats = useMemo(() => {
    const totalBench = forecastData.reduce((sum, d) => sum + d.benchCount, 0) / forecastData.length;
    const avgUtil = forecastData.reduce((sum, d) => sum + d.utilization, 0) / forecastData.length;
    
    return [
      { label: 'Avg. Capacity', value: forecastData[0]?.capacity || 0, icon: Users, color: 'text-indigo-600' },
      { label: 'Avg. Utilization', value: `${Math.round(avgUtil)}%`, icon: TrendingUp, color: 'text-emerald-600' },
      { label: 'Avg. Bench', value: Math.round(totalBench), icon: AlertCircle, color: 'text-amber-600' },
    ];
  }, [forecastData]);

  return (
    <div className="space-y-6 fountain-animation">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-indigo-600" />
            Resource Forecast
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-1 uppercase tracking-wider">
            Predictive allocation and capacity planning
          </p>
        </div>

        <div className="flex items-center gap-2 bg-white p-1 rounded-xl shadow-sm border border-slate-200">
          {[8, 12, 16].map((p) => (
            <button
              key={p}
              onClick={() => setWeeksCount(p as ForecastPeriod)}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
                weeksCount === p
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100'
                  : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              {p} Weeks
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center ${stat.color}`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
              <p className="text-2xl font-black text-slate-800">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-8">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-400" />
            Capacity vs Allocation
          </h3>
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-indigo-600/20 border border-indigo-600/30" />
              <span className="text-[10px] font-bold text-slate-500 uppercase">Capacity</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-indigo-600 shadow-sm" />
              <span className="text-[10px] font-bold text-slate-500 uppercase">Allocated</span>
            </div>
          </div>
        </div>

        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={forecastData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="week" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
              />
              <Tooltip 
                cursor={{ fill: '#f8fafc' }}
                contentStyle={{ borderRadius: '16px', border: 'none', shadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
              />
              <Bar 
                dataKey="capacity" 
                fill="#e0e7ff" 
                radius={[4, 4, 0, 0]} 
                barSize={40} 
              />
              <Bar 
                dataKey="allocated" 
                fill="#4f46e5" 
                radius={[4, 4, 0, 0]} 
                barSize={40} 
              />
              <Line 
                type="monotone" 
                dataKey="utilization" 
                stroke="#10b981" 
                strokeWidth={3} 
                dot={{ fill: '#10b981', r: 4, strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 6, strokeWidth: 0 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-800 text-sm mb-4">Bench Forecast (Resources with 0h)</h3>
          <div className="space-y-3">
            {forecastData.map((d, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">{d.week}</span>
                <div className="flex-1 mx-4 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-amber-500 transition-all duration-500" 
                    style={{ width: `${(d.benchCount / members.length) * 100}%` }}
                  />
                </div>
                <span className="text-xs font-black text-slate-700">{d.benchCount}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-800 text-sm mb-4">Risk Forecast (Overloaded Resources)</h3>
          <div className="space-y-3">
            {forecastData.map((d, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">{d.week}</span>
                <div className="flex-1 mx-4 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-rose-500 transition-all duration-500" 
                    style={{ width: `${(d.overloadCount / members.length) * 100}%` }}
                  />
                </div>
                <span className="text-xs font-black text-slate-700">{d.overloadCount}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

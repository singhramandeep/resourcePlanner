import React, { useState, useMemo, useEffect } from 'react';
import { 
  Users, 
  ChevronRight, 
  ChevronDown, 
  UserPlus, 
  ShieldCheck, 
  ShieldAlert,
  ArrowRight,
  MoreVertical,
  MinusCircle,
  PlusCircle,
  GitGraph,
  Maximize2
} from 'lucide-react';

import { motion, AnimatePresence } from 'framer-motion';
import { TeamMember, Team } from '../types';
import { cn, obfuscate } from '../lib/utils';

interface OrgChartViewProps {
  members: TeamMember[];
  teams: Team[];
  onUpdateMember: (id: string, updates: Partial<TeamMember>) => void;
  onEditMember: (member: TeamMember) => void;
  privacyMode: boolean;
}

export default function OrgChartView({ members, teams, onUpdateMember, onEditMember, privacyMode }: OrgChartViewProps) {
  const [selectedManagerId, setSelectedManagerId] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkSelectedIds, setBulkSelectedIds] = useState<string[]>([]);
  const [viewType, setViewType] = useState<'hierarchy' | 'chart'>('hierarchy');
  const [draggedMemberId, setDraggedMemberId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);

  const managers = useMemo(() => members.filter(m => m.isManager), [members]);
  
  const getReportees = (managerId: string) => members.filter(m => m.managerId === managerId);

  const handleDragStart = (e: React.DragEvent, memberId: string) => {
    setDraggedMemberId(memberId);
    e.dataTransfer.setData('memberId', memberId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, memberId: string | null) => {
    e.preventDefault();
    if (draggedMemberId && draggedMemberId !== memberId) {
      setDropTargetId(memberId);
    }
  };

  const handleDropOnMember = (e: React.DragEvent, managerId: string | undefined) => {
    e.preventDefault();
    const memberId = e.dataTransfer.getData('memberId') || draggedMemberId;
    setDropTargetId(null);
    setDraggedMemberId(null);

    if (memberId && memberId !== managerId) {
      // Prevent circular reporting
      if (managerId) {
        let current: TeamMember | undefined = members.find(m => m.id === managerId);
        while (current) {
          if (current.id === memberId) return; // Cannot drop manager on their own reportee
          current = members.find(m => m.id === current?.managerId);
        }
      }
      
      onUpdateMember(memberId, { managerId });
      
      if (managerId) {
        const target = members.find(m => m.id === managerId);
        if (target && !target.isManager) {
          onUpdateMember(managerId, { isManager: true });
        }
      }
    }
  };

  const handleToggleManager = (id: string, current: boolean) => {
    onUpdateMember(id, { isManager: !current });
  };

  const handleSetManager = (memberId: string, managerId: string | undefined) => {
    onUpdateMember(memberId, { managerId });
  };

  const handleBulkAssign = (managerId: string) => {
    bulkSelectedIds.forEach(id => {
      onUpdateMember(id, { managerId });
    });
    setBulkSelectedIds([]);
    setBulkMode(false);
    setSelectedManagerId(managerId);
  };

  const removeFromReporting = (memberId: string) => {
    onUpdateMember(memberId, { managerId: undefined });
  };

  const unassignedMembers = useMemo(() => {
    return members.filter(m => !m.managerId);
  }, [members]);

  const selectedManager = useMemo(() => 
    members.find(m => m.id === selectedManagerId), 
    [members, selectedManagerId]
  );

  const reportingPath = useMemo(() => {
    if (!selectedManager) return [];
    const path: TeamMember[] = [];
    let current = members.find(m => m.id === selectedManager.managerId);
    while (current) {
      path.unshift(current);
      current = members.find(m => m.id === current?.managerId);
    }
    return path;
  }, [selectedManager, members]);

  // Handle selection and auto-expand path
  const handleSelect = (id: string) => {
    setSelectedManagerId(id);
    const path: string[] = [];
    let current = members.find(m => m.id === id);
    while (current?.managerId) {
      path.push(current.managerId);
      current = members.find(m => m.id === current?.managerId);
    }
    setExpandedIds(prev => {
      const next = new Set(prev);
      path.forEach(pid => next.add(pid));
      return next;
    });
  };

  const toggleExpand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const directReports = useMemo(() => 
    selectedManagerId ? getReportees(selectedManagerId) : [], 
    [members, selectedManagerId]
  );

  // Stats for managers
  const getReportingCount = (managerId: string) => {
    let count = 0;
    const direct = getReportees(managerId);
    count += direct.length;
    direct.forEach(d => {
      if (d.isManager) {
        count += getReportingCount(d.id);
      }
    });
    return count;
  };

  const renderHierarchyNode = (member: TeamMember, level: number = 0) => {
    const reports = getReportees(member.id);
    const hasReports = reports.length > 0;
    const isSelected = selectedManagerId === member.id;
    const isExpanded = expandedIds.has(member.id);

    return (
      <div key={member.id} className="flex flex-col">
        <div 
          onClick={() => handleSelect(member.id)}
          draggable
          onDragStart={(e) => handleDragStart(e, member.id)}
          onDragOver={(e) => handleDragOver(e, member.id)}
          onDragLeave={() => setDropTargetId(null)}
          onDrop={(e) => handleDropOnMember(e, member.id)}
          className={cn(
            "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all border group",
            isSelected ? "bg-indigo-50 border-indigo-200" : "hover:bg-slate-50 border-transparent",
            level > 0 && "ml-4 md:ml-8 relative before:absolute before:left-[-16px] md:before:left-[-20px] before:top-1/2 before:w-3 md:before:w-4 before:h-[1px] before:bg-slate-200 before:content-['']",
            level === 0 && !member.managerId && "border-slate-200 shadow-sm",
            dropTargetId === member.id && "bg-indigo-100 ring-2 ring-indigo-500 scale-[1.02]",
            draggedMemberId === member.id && "opacity-50 grayscale"
          )}
        >
          <div 
            onClick={(e) => hasReports && toggleExpand(member.id, e)}
            className="flex items-center justify-center w-4 h-4"
          >
            {hasReports && (
              <ChevronRight className={cn("w-4 h-4 text-slate-400 transition-transform", isExpanded && "rotate-90")} />
            )}
          </div>
          <img 
            src={member.avatar} 
            alt="" 
            className="w-8 h-8 rounded-full bg-slate-200 shadow-sm hover:ring-2 hover:ring-indigo-500 transition-all" 
            onClick={(e) => {
              e.stopPropagation();
              onEditMember(member);
            }}
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm truncate">{obfuscate(member.name, privacyMode)}</span>
              {member.isManager && (
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
              )}
            </div>
            <p className="text-[10px] uppercase font-bold tracking-tighter text-slate-400 truncate">{member.role}</p>
          </div>
          <div className="text-right pr-2">
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-tighter leading-none">Reports</p>
            <p className="text-[10px] font-black text-slate-700">{reports.length}</p>
          </div>
        </div>
        {isExpanded && hasReports && (
          <div className="flex flex-col mt-1">
            {reports.map(r => renderHierarchyNode(r, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/50">
        <div className="flex items-center gap-4">
          <div className="flex p-1 bg-slate-100 rounded-lg border border-slate-200">
            <button 
              onClick={() => setViewType('hierarchy')}
              className={cn(
                "px-3 py-1 text-xs font-semibold rounded-md transition-all",
                viewType === 'hierarchy' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
              )}
            >
              Hierarchy
            </button>
            <button 
              onClick={() => setViewType('chart')}
              className={cn(
                "px-3 py-1 text-xs font-semibold rounded-md transition-all",
                viewType === 'chart' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
              )}
            >
              Org Chart
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {bulkMode ? (
            <>
              <span className="text-xs font-medium text-indigo-600 mr-2">{bulkSelectedIds.length} selected</span>
              <button 
                onClick={() => {
                  setBulkMode(false);
                  setBulkSelectedIds([]);
                }}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <div className="relative group">
                <button 
                  disabled={bulkSelectedIds.length === 0}
                  className="px-4 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  Assign to Manager <ChevronDown className="w-3 h-3" />
                </button>
                <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-xl z-50 py-2 hidden group-hover:block">
                  <p className="px-4 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 mb-1">Select Manager</p>
                  <div className="max-h-64 overflow-auto">
                    {managers.map(m => (
                      <button
                        key={m.id}
                        onClick={() => handleBulkAssign(m.id)}
                        className="w-full px-4 py-2 flex items-center gap-3 hover:bg-indigo-50 text-left transition-colors"
                      >
                        <img src={m.avatar} alt="" className="w-6 h-6 rounded-full bg-slate-100" />
                        <div>
                          <p className="text-xs font-bold text-slate-700">{obfuscate(m.name, privacyMode)}</p>
                          <p className="text-[10px] text-slate-400">{m.role}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <button 
              onClick={() => setBulkMode(true)}
              className="px-3 py-1.5 text-xs font-bold text-slate-700 border border-slate-200 bg-white hover:bg-slate-50 rounded-lg transition-all flex items-center gap-2"
            >
              <Users className="w-4 h-4" />
              Bulk Manage
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel: List/Hierarchy */}
        <div className="w-1/3 border-r border-slate-100 flex flex-col">
          {viewType === 'hierarchy' ? (
            <div className="flex-1 overflow-auto p-4 space-y-2">
              <div 
                onDragOver={(e) => handleDragOver(e, 'clear')}
                onDragLeave={() => setDropTargetId(null)}
                onDrop={(e) => handleDropOnMember(e, undefined)}
                className={cn(
                  "px-3 py-2 rounded-lg border transition-all mb-4",
                  dropTargetId === 'clear' 
                    ? "bg-rose-50 border-rose-300 ring-2 ring-rose-500 scale-[1.02]" 
                    : "bg-slate-50 border-slate-200 border-dashed"
                )}
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Main Registry (Drop to Clear Manager)</h3>
                  {unassignedMembers.length > 0 && (
                    <span className="flex items-center gap-1 text-[9px] font-black text-rose-500 bg-rose-50 px-2 py-0.5 rounded border border-rose-100 uppercase tracking-tighter">
                      {unassignedMembers.length} Unassigned
                    </span>
                  )}
                </div>
              </div>
              
              {/* People with no manager - Top level nodes */}
              <div className="space-y-4">
                {unassignedMembers.map(m => (
                  <div key={m.id} className="relative">
                    {renderHierarchyNode(m)}
                  </div>
                ))}
                {unassignedMembers.length === 0 && (
                   <div className="py-8 text-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                     <p className="text-xs font-medium text-slate-400">Everyone has a manager assigned!</p>
                   </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col min-w-0">
               <div className="p-4 border-b border-slate-50 bg-slate-50/20">
                <h3 className="text-xs font-bold text-slate-900">All Members</h3>
                <p className="text-[10px] text-slate-500">Pick someone to see their reporting line</p>
               </div>
               <div className="flex-1 overflow-auto p-2 space-y-0.5">
                {members.map(member => (
                  <div 
                    key={member.id}
                    onClick={() => handleSelect(member.id)}
                    draggable
                    onDragStart={(e) => handleDragStart(e, member.id)}
                    className={cn(
                      "flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all group",
                      selectedManagerId === member.id ? "bg-indigo-50" : "hover:bg-slate-50",
                      draggedMemberId === member.id && "opacity-50"
                    )}
                  >
                    {bulkMode && (
                      <input 
                        type="checkbox"
                        checked={bulkSelectedIds.includes(member.id)}
                        onChange={(e) => {
                          e.stopPropagation();
                          if (e.target.checked) {
                            setBulkSelectedIds(prev => [...prev, member.id]);
                          } else {
                            setBulkSelectedIds(prev => prev.filter(id => id !== member.id));
                          }
                        }}
                        className="w-3.5 h-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                    )}
                    <img src={member.avatar} alt="" className="w-7 h-7 rounded-full bg-slate-100 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-900 truncate">{obfuscate(member.name, privacyMode)}</p>
                      <p className="text-[10px] text-slate-500 truncate">{member.role}</p>
                    </div>
                    {member.isManager && <ShieldCheck className="w-3.5 h-3.5 text-indigo-400 shrink-0" />}
                  </div>
                ))}
               </div>
            </div>
          )}
        </div>

        {/* Right Panel: Detail/Org View */}
        <div className="flex-1 bg-slate-50/30 overflow-auto p-8 relative">
          {selectedManager ? (
            <div className="max-w-3xl mx-auto space-y-8">
              {/* Breadcrumbs */}
              {reportingPath.length > 0 && (
                <div className="flex items-center flex-wrap gap-2 mb-2">
                  <button 
                    onClick={() => setSelectedManagerId(null)}
                    className="text-[10px] font-black text-slate-400 hover:text-indigo-600 uppercase tracking-widest transition-colors"
                  >
                    Organization
                  </button>
                  {reportingPath.map(m => (
                    <React.Fragment key={m.id}>
                      <ChevronRight className="w-3 h-3 text-slate-300" />
                      <button 
                        onClick={() => handleSelect(m.id)}
                        className="text-[10px] font-black text-slate-500 hover:text-indigo-600 uppercase tracking-widest transition-colors flex items-center gap-1.5"
                      >
                        <img src={m.avatar} alt="" className="w-4 h-4 rounded-full" />
                        {obfuscate(m.name, privacyMode)}
                      </button>
                    </React.Fragment>
                  ))}
                  <ChevronRight className="w-3 h-3 text-slate-300" />
                  <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">
                    {obfuscate(selectedManager.name, privacyMode)}
                  </span>
                </div>
              )}

              {/* Manager Card */}
              <div 
                onDragOver={(e) => handleDragOver(e, selectedManager.id)}
                onDragLeave={() => setDropTargetId(null)}
                onDrop={(e) => handleDropOnMember(e, selectedManager.id)}
                className={cn(
                  "bg-white p-6 rounded-2xl shadow-sm border transition-all",
                  dropTargetId === selectedManager.id ? "border-indigo-500 ring-4 ring-indigo-500/10 bg-indigo-50/30" : "border-slate-200"
                )}
              >
                <div className="flex items-start justify-between mb-6">
                  <div className="flex gap-4">
                    <div className="relative">
                      <img src={selectedManager.avatar} alt="" className="w-16 h-16 rounded-2xl bg-slate-100 shadow-inner" />
                      {selectedManager.isManager && (
                        <div className="absolute -bottom-1 -right-1 bg-indigo-600 text-white p-1 rounded-lg">
                          <ShieldCheck className="w-3 h-3" />
                        </div>
                      )}
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-slate-900">{obfuscate(selectedManager.name, privacyMode)}</h2>
                      <p className="text-sm font-medium text-slate-500">{selectedManager.role}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-[10px] font-bold text-slate-600 uppercase">
                          {teams.find(t => t.id === selectedManager.teamId)?.name}
                        </span>
                        {selectedManager.managerId && (
                          <div className="flex items-center gap-1 text-slate-400">
                            <ArrowRight className="w-3 h-3" />
                            <span className="text-[10px] font-medium italic">
                              reports to {obfuscate(members.find(m => m.id === selectedManager.managerId)?.name || '', privacyMode)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleToggleManager(selectedManager.id, !!selectedManager.isManager)}
                      className={cn(
                        "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                        selectedManager.isManager 
                          ? "bg-indigo-50 text-indigo-700 border border-indigo-200" 
                          : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                      )}
                    >
                      {selectedManager.isManager ? "Tagged as Manager" : "Tag as Manager"}
                    </button>
                    <div className="relative group/manager">
                      <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-400">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                      <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-slate-200 rounded-xl shadow-xl z-50 py-2 hidden group-hover/manager:block">
                        <p className="px-4 py-1 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 mb-1">Set My Manager</p>
                        <div className="max-h-64 overflow-auto">
                          <button 
                            onClick={() => handleSetManager(selectedManager.id, undefined)}
                            className="w-full px-4 py-2 text-xs text-red-600 hover:bg-red-50 text-left"
                          >
                            No Manager
                          </button>
                          {managers.filter(m => m.id !== selectedManager.id).map(m => (
                            <button
                              key={m.id}
                              onClick={() => handleSetManager(selectedManager.id, m.id)}
                              className="w-full px-4 py-2 flex items-center gap-3 hover:bg-indigo-50 text-left transition-colors"
                            >
                              <img src={m.avatar} alt="" className="w-5 h-5 rounded-full bg-slate-100" />
                              <span className="text-xs font-medium text-slate-700">{obfuscate(m.name, privacyMode)}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 pt-6 border-t border-slate-100">
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Direct Reports</p>
                    <p className="text-lg font-bold text-slate-900">{directReports.length}</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total org size</p>
                    <p className="text-lg font-bold text-slate-900">{getReportingCount(selectedManager.id)}</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Capacity</p>
                    <p className="text-lg font-bold text-slate-900">{selectedManager.capacity}h</p>
                  </div>
                </div>
              </div>

              {/* Reports Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    Direct Reports
                    <span className="bg-slate-200 text-slate-600 text-[10px] px-1.5 py-0.5 rounded-full">{directReports.length}</span>
                  </h3>
                  <button 
                    onClick={() => {
                      setBulkMode(true);
                      setBulkSelectedIds([]);
                    }}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1.5"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    Manage Reports
                  </button>
                </div>

                <div 
                  onDragOver={(e) => handleDragOver(e, selectedManager.id)}
                  onDragLeave={() => setDropTargetId(null)}
                  onDrop={(e) => handleDropOnMember(e, selectedManager.id)}
                  className={cn(
                    "grid grid-cols-2 gap-3 p-4 rounded-2xl border-2 border-dashed transition-all",
                    dropTargetId === selectedManager.id ? "bg-indigo-50 border-indigo-300 ring-2 ring-indigo-500" : "bg-transparent border-transparent"
                  )}
                >
                  {directReports.length > 0 ? (
                    directReports.map(member => (
                      <div key={member.id} className="bg-white p-3 rounded-xl border border-slate-200 flex items-center gap-3 group">
                        <img src={member.avatar} alt="" className="w-10 h-10 rounded-full bg-slate-100" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-slate-900 truncate">{obfuscate(member.name, privacyMode)}</p>
                          <p className="text-xs text-slate-500 truncate">{member.role}</p>
                        </div>
                        <button 
                          onClick={() => removeFromReporting(member.id)}
                          className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                          title="Remove from reporting"
                        >
                          <MinusCircle className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleSelect(member.id)}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"
                        >
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-2 py-12 flex flex-col items-center justify-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                        <Users className="w-6 h-6 text-slate-400" />
                      </div>
                      <p className="text-sm font-medium text-slate-500">No reportees assigned</p>
                      <p className="text-xs text-slate-400 mt-1">Use Bulk Manage to add people</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Visual Preview */}
              {viewType === 'chart' && (
                <div className="bg-white p-6 rounded-2xl border border-slate-200">
                   <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-slate-900">Tree Visualization</h3>
                    <GitGraph className="w-4 h-4 text-slate-400" />
                  </div>
                  <div className="flex flex-col items-center py-8">
                     <OrgNode 
                      member={selectedManager} 
                      members={members} 
                      depth={0} 
                      onClick={handleSelect} 
                      privacyMode={privacyMode}
                      onDragStart={handleDragStart}
                      onDragOver={handleDragOver}
                      onDrop={handleDropOnMember}
                      dropTargetId={dropTargetId}
                      draggedMemberId={draggedMemberId}
                      setDropTargetId={setDropTargetId}
                    />
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-20 h-20 rounded-3xl bg-slate-100 flex items-center justify-center mb-4 text-slate-300">
                <ShieldCheck className="w-10 h-10" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">Reporting Structure</h2>
              <p className="text-slate-500 max-w-xs mt-2">
                Select a person from the registry to manage their reports and position in the organization.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function OrgNode({ 
  member, 
  members, 
  depth, 
  onClick, 
  privacyMode,
  onDragStart,
  onDragOver,
  onDrop,
  dropTargetId,
  draggedMemberId,
  setDropTargetId
}: { 
  member: TeamMember, 
  members: TeamMember[], 
  depth: number, 
  onClick: (id: string) => void, 
  privacyMode: boolean,
  onDragStart: (e: React.DragEvent, id: string) => void,
  onDragOver: (e: React.DragEvent, id: string) => void,
  onDrop: (e: React.DragEvent, id: string) => void,
  dropTargetId: string | null,
  draggedMemberId: string | null,
  setDropTargetId: (id: string | null) => void
}) {
  const reports = members.filter(m => m.managerId === member.id);
  
  return (
    <div className="flex flex-col items-center">
      <div 
        onClick={() => onClick(member.id)}
        draggable
        onDragStart={(e) => onDragStart(e, member.id)}
        onDragOver={(e) => onDragOver(e, member.id)}
        onDragLeave={() => setDropTargetId(null)}
        onDrop={(e) => onDrop(e, member.id)}
        className={cn(
          "relative flex flex-col items-center p-3 rounded-xl border border-slate-200 bg-white shadow-sm hover:ring-2 hover:ring-indigo-500/20 cursor-pointer transition-all",
          depth === 0 ? "scale-110 mb-8" : "w-32",
          dropTargetId === member.id && "bg-indigo-100 ring-2 ring-indigo-500 scale-[1.05]",
          draggedMemberId === member.id && "opacity-50 grayscale"
        )}
      >
        <img src={member.avatar} alt="" className="w-10 h-10 rounded-full bg-slate-100 mb-2 shadow-inner" />
        <p className="text-[10px] font-bold text-slate-900 text-center leading-tight">{obfuscate(member.name, privacyMode)}</p>
        <p className="text-[9px] text-slate-500 text-center truncate w-full">{member.role}</p>
        
        {reports.length > 0 && (
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full z-10">
            {reports.length}
          </div>
        )}
      </div>

      {reports.length > 0 && depth < 3 && (
        <div className="relative pt-8 flex gap-4">
          {/* Connector Line */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1px] h-8 bg-slate-200" />
          
          {reports.map((r, idx) => (
             <div key={r.id} className="relative">
                {/* Horizontal line for siblings */}
                {reports.length > 1 && (
                  <div className={cn(
                    "absolute top-0 h-[1px] bg-slate-200",
                    idx === 0 ? "left-1/2 right-0" : 
                    idx === reports.length - 1 ? "left-0 right-1/2" :
                    "left-0 right-0"
                  )} />
                )}
                <OrgNode 
                  member={r} 
                  members={members} 
                  depth={depth + 1} 
                  onClick={onClick} 
                  privacyMode={privacyMode}
                  onDragStart={onDragStart}
                  onDragOver={onDragOver}
                  onDrop={onDrop}
                  dropTargetId={dropTargetId}
                  draggedMemberId={draggedMemberId}
                  setDropTargetId={setDropTargetId}
                />
             </div>
          ))}
        </div>
      )}
    </div>
  );
}

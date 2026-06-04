/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { Assignment, Project } from '../types';
import { MoreVertical, Calendar, Clock } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { obfuscate } from '../lib/utils';

interface AssignmentCardProps {
  key?: string;
  assignment: Assignment;
  projectColor: string;
  projects?: Project[];
  compact?: boolean;
  continuesLeft?: boolean;
  continuesRight?: boolean;
  onContextMenu?: (e: React.MouseEvent) => void;
  onClick?: (e: React.MouseEvent) => void;
  onDragStart?: (e: React.DragEvent) => void;
  onDragEnter?: (e: React.DragEvent) => void;
  onDragEnd?: (e: React.DragEvent) => void;
  onExtendStart?: (id: string) => void;
  onExtendEnd?: (id: string) => void;
  draggable?: boolean;
  privacyMode?: boolean;
  highlightType?: 'placeholder' | 'futureJoiner';
}

export default function AssignmentCard({ assignment, projectColor, compact, continuesLeft, continuesRight, onContextMenu, onClick, onDragStart, onDragEnter, onDragEnd, onExtendStart, onExtendEnd, draggable, projects = [], privacyMode = false, highlightType }: AssignmentCardProps) {
  const standardCapacity = 40;
  const contributionPercent = Math.round((assignment.hoursPerWeek / standardCapacity) * 100);
  const project = projects.find(p => p.id === assignment.projectId);

  const getStatusStyles = (status: string, highlightType?: 'placeholder' | 'futureJoiner') => {
    if (status === 'Planned' && highlightType === 'placeholder') {
      return {
        bg: '#f97316',
        text: 'white',
        border: '#c2410c',
        pattern: 'repeating-linear-gradient(45deg, rgba(255,255,255,0.16), rgba(255,255,255,0.16) 5px, transparent 5px, transparent 10px)'
      };
    }
    if (status === 'Planned' && highlightType === 'futureJoiner') {
      return {
        bg: '#38bdf8',
        text: 'white',
        border: '#0ea5e9',
        pattern: 'repeating-linear-gradient(45deg, rgba(255,255,255,0.16), rgba(255,255,255,0.16) 5px, transparent 5px, transparent 10px)'
      };
    }
    switch (status) {
      case 'Hard':
        return { 
          bg: '#1e40af', 
          text: 'white',
          border: '#1e3a8a',
          pattern: 'none'
        };
      case 'Soft':
        return { 
          bg: '#60a5fa', 
          text: 'white',
          border: '#3b82f6',
          pattern: 'none'
        };
      case 'Pending':
        return { 
          bg: '#94a3b8', 
          text: 'white',
          border: '#64748b',
          pattern: 'none'
        };
      case 'Planned':
        return { 
          bg: '#94a3b8', 
          text: 'white',
          border: '#64748b',
          pattern: 'repeating-linear-gradient(45deg, transparent, transparent 5px, rgba(255,255,255,0.1) 5px, rgba(255,255,255,0.1) 10px)'
        };
      default:
        return { bg: projectColor, text: 'white', border: 'transparent', pattern: 'none' };
    }
  };

  const statusStyles = getStatusStyles(assignment.status, highlightType);

  const formatDate = (dateStr: string) => {
    try {
      return format(parseISO(dateStr), 'MMM d');
    } catch (e) {
      return dateStr;
    }
  };

  const formatUpdated = (dateStr?: string) => {
    if (!dateStr) return null;
    try {
      return format(parseISO(dateStr), 'MMM d, HH:mm');
    } catch (e) {
      return dateStr;
    }
  };

  if (compact) {
    return (
      <motion.div
        whileHover={{ scale: 1.01 }}
        onContextMenu={onContextMenu}
        onClick={onClick}
        draggable={draggable}
        onDragStart={onDragStart}
        onDragEnter={onDragEnter}
        onDragEnd={onDragEnd}
        className={`h-full flex flex-col justify-center border group/card ${draggable ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'} border-opacity-30 transition-shadow hover:shadow-md ${continuesLeft || continuesRight ? 'shadow-none' : 'shadow-sm'} overflow-hidden ${continuesLeft ? 'rounded-l-none border-l-0' : 'rounded-l-[4px]'} ${continuesRight ? 'rounded-r-none border-r-0' : 'rounded-r-[4px]'}`}
        style={{ 
          backgroundColor: statusStyles.bg,
          borderColor: statusStyles.border,
          backgroundImage: statusStyles.pattern,
          color: statusStyles.text,
          marginLeft: continuesLeft ? '-4px' : '2px',
          marginRight: continuesRight ? '-5px' : '2px',
          marginTop: '1px',
          marginBottom: '1px',
          position: 'relative',
          zIndex: continuesRight || continuesLeft ? 10 : 5,
          width: continuesLeft && continuesRight ? 'calc(100% + 9px)' : continuesLeft ? 'calc(100% + 4px)' : continuesRight ? 'calc(100% + 5px)' : 'calc(100% - 4px)'
        }}
      >
        {onExtendStart && !continuesLeft && (
          <div 
            className="absolute left-0 top-0 bottom-0 w-3 hover:w-3.5 bg-white/5 cursor-ew-resize hover:bg-white/25 transition-all z-20 flex items-center justify-center group/handle"
            onMouseDown={(e) => {
              e.stopPropagation();
              onExtendStart(assignment.id);
            }}
          >
            <div className="w-[1.5px] h-3 bg-white/20 group-hover/handle:bg-white/40 rounded-full" />
          </div>
        )}
        {onExtendEnd && !continuesRight && (
          <div 
            className="absolute right-0 top-0 bottom-0 w-3 hover:w-3.5 bg-white/5 cursor-ew-resize hover:bg-white/25 transition-all z-20 flex items-center justify-center group/handle"
            onMouseDown={(e) => {
              e.stopPropagation();
              onExtendEnd(assignment.id);
            }}
          >
            <div className="w-[1.5px] h-3 bg-white/20 group-hover/handle:bg-white/40 rounded-full" />
          </div>
        )}
        <div 
          className="p-1 flex items-center justify-between gap-1 sticky left-[162px]"
          style={{ width: '100%', minWidth: 'min-content' }}
        >
          <p className="text-[8px] font-bold leading-none truncate flex-1 uppercase tracking-tighter" style={{ color: 'inherit' }}>
            {obfuscate(project?.name || 'Unknown', privacyMode)}
          </p>
          {assignment.hoursPerWeek !== 40 && (
            <span className="text-[7px] font-black shrink-0" style={{ opacity: 0.8, color: 'inherit' }}>{assignment.hoursPerWeek}h</span>
          )}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      whileHover={{ y: -2, boxShadow: '0 8px 30px rgba(0,0,0,0.04)' }}
      onContextMenu={onContextMenu}
      onClick={onClick}
      draggable={draggable}
      onDragStart={onDragStart}
      onDragEnter={onDragEnter}
      onDragEnd={onDragEnd}
      className={`border rounded-lg p-3 h-full flex flex-col relative group ${draggable ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'} border-opacity-50 shadow-sm`}
      style={{ 
        backgroundColor: statusStyles.bg,
        borderColor: statusStyles.border,
        backgroundImage: statusStyles.pattern,
        color: statusStyles.text
      }}
    >
      <div className="flex justify-between items-start mb-2 pointer-events-none">
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'inherit' }}>
              {obfuscate(project?.name || 'Unknown', privacyMode)}
            </span>
          </div>
          <span className="text-[8px] font-bold mt-0.5" style={{ opacity: 0.7, color: 'inherit' }}>
            {assignment.status} Assignment
          </span>
        </div>
        <div className="flex flex-col items-end">
          {assignment.hoursPerWeek !== 40 && (
            <span className="text-xs font-black" style={{ color: 'inherit' }}>{assignment.hoursPerWeek}h</span>
          )}
          <span className="text-[8px] font-bold" style={{ opacity: 0.7, color: 'inherit' }}>
            {contributionPercent}% Capacity
          </span>
        </div>
      </div>

      <div className="mt-auto flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-1" style={{ opacity: 0.8, color: 'inherit' }}>
          <Calendar className="w-2.5 h-2.5" />
          <span className="text-[9px] font-semibold">
            {formatDate(assignment.startDate)} - {formatDate(assignment.endDate)}
          </span>
        </div>
        {assignment.lastUpdated && (
          <div className="flex items-center gap-1 text-[9px] text-white/80 pointer-events-none">
            <Clock className="w-3 h-3" />
            <span className="text-[9px] font-semibold">{formatUpdated(assignment.lastUpdated)}</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}

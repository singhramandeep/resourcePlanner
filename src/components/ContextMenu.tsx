/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion, AnimatePresence } from 'motion/react';
import { Trash2, Edit2, Copy, MoreVertical } from 'lucide-react';
import { useEffect, useRef } from 'react';

interface ContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  onDelete: () => void;
  onDeleteEntirely?: () => void;
  title?: string;
}

export default function ContextMenu({ x, y, onClose, onDelete, onDeleteEntirely, title }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  return (
    <AnimatePresence>
      <motion.div
        ref={menuRef}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        style={{ top: y, left: x }}
        className="fixed z-[9999] w-48 bg-white border border-slate-200 rounded-lg shadow-xl py-1 overflow-hidden"
      >
        {title && (
          <div className="px-3 py-2 border-b border-slate-100 mb-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{title}</span>
          </div>
        )}
        
        <button 
          className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
          onClick={onClose}
        >
          <Edit2 className="w-3.5 h-3.5" />
          <span>Edit Allocation</span>
        </button>

        <button 
          className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
          onClick={onClose}
        >
          <Copy className="w-3.5 h-3.5" />
          <span>Duplicate</span>
        </button>

        <div className="h-px bg-slate-100 my-1" />

        <button 
          className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors"
          onClick={() => {
            onDelete();
            onClose();
          }}
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Clear from Period</span>
        </button>

        {onDeleteEntirely && (
          <button 
            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-black text-rose-600 hover:bg-rose-50 transition-colors"
            onClick={() => {
              onDeleteEntirely();
              onClose();
            }}
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Hard Delete Record</span>
          </button>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

import React, { useState, useMemo } from 'react';
import { 
  MessageSquare, 
  Send, 
  Clock, 
  CheckSquare,
  User,
  MoreVertical,
  History,
  Info,
  Flag
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, parseISO } from 'date-fns';
import { Comment, Todo, TeamMember, Project, TodoStatus, TodoPriority } from '../types';
import { cn, obfuscate } from '../lib/utils';

interface CommentHistoryProps {
  entityId: string;
  comments: Comment[];
  todos: Todo[];
  members: TeamMember[];
  projects: Project[];
  onAddComment: (comment: Omit<Comment, 'id' | 'createdAt' | 'authorId' | 'authorName'>) => Comment;
  onAddTodo: (todo: Omit<Todo, 'id' | 'createdAt'>) => Todo;
  privacyMode: boolean;
}

export default function CommentHistory({
  entityId,
  comments: allComments,
  todos: allTodos,
  members,
  projects,
  onAddComment,
  onAddTodo,
  privacyMode
}: CommentHistoryProps) {
  const [text, setText] = useState('');
  const [isTodo, setIsTodo] = useState(false);
  const [priority, setPriority] = useState<TodoPriority>('Medium');
  
  const entityComments = allComments.filter(c => c.entityId === entityId);
  const entityTodos = allTodos.filter(t => 
    t.projectIds?.includes(entityId) || 
    t.memberIds?.includes(entityId) || 
    t.assignedMemberIds?.includes(entityId)
  );

  const timelineItems = useMemo(() => {
    const items = [
      ...entityComments.map(c => ({ 
        ...c, 
        contentType: 'comment' as const, 
        date: parseISO(c.createdAt || new Date().toISOString()) 
      })),
      ...entityTodos.map(t => ({ 
        ...t, 
        contentType: 'todo' as const, 
        date: parseISO(t.createdAt || new Date().toISOString()) 
      }))
    ];
    return items.sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [entityComments, entityTodos]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    let todoId: string | undefined;
    if (isTodo) {
      const isProject = projects.some(p => p.id === entityId);
      const isMember = members.some(m => m.id === entityId);

      const newTodo = onAddTodo({
        title: text.length > 50 ? text.substring(0, 47) + '...' : text,
        description: text,
        status: 'Todo',
        priority: priority,
        assignedMemberIds: [],
        projectIds: isProject ? [entityId] : [],
        memberIds: isMember ? [entityId] : [],
      });
      todoId = newTodo.id;
    }

    onAddComment({
      entityId,
      text,
      isTodo,
      todoId
    });

    setText('');
    setIsTodo(false);
  };

  return (
    <div className="flex flex-col h-full bg-slate-50/50 rounded-2xl border border-slate-200 overflow-hidden">
      <div className="p-4 border-b border-slate-200 bg-white flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-slate-400" />
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Timeline & Comments</h3>
        </div>
        <div className="bg-slate-100 px-2 py-0.5 rounded text-[10px] font-black text-slate-500 uppercase">
          {entityComments.length} Entries
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/30">
        <AnimatePresence initial={false}>
          {timelineItems.length > 0 ? (
            timelineItems.map((item, idx) => (
              <motion.div 
                key={item.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex gap-3 group"
              >
                <div className="flex flex-col items-center gap-1 shrink-0 pt-1">
                  <div className={cn(
                    "w-8 h-8 rounded-full border flex items-center justify-center text-xs font-bold",
                    item.contentType === 'comment' ? "bg-white border-slate-200 text-slate-400" : "bg-indigo-50 border-indigo-200 text-indigo-600"
                  )}>
                    {item.contentType === 'comment' ? (
                      (item as Comment).authorName.charAt(0)
                    ) : (
                      <CheckSquare className="w-3.5 h-3.5" />
                    )}
                  </div>
                   {idx < timelineItems.length - 1 && (
                     <div className="w-px flex-1 bg-slate-200 min-h-[20px]" />
                   )}
                </div>
                <div className="flex-1 pb-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-bold text-slate-900">
                      {item.contentType === 'comment' ? (item as Comment).authorName : 'Task Assigned'}
                    </span>
                    <span className="text-[9px] font-medium text-slate-400">
                      {format(item.date, 'MMM d, h:mm a')}
                    </span>
                  </div>
                  <div className={cn(
                    "p-3 rounded-2xl relative bg-white border shadow-sm",
                    item.contentType === 'todo' ? "border-indigo-100 bg-indigo-50/20" : "border-slate-200"
                  )}>
                    {item.contentType === 'comment' ? (
                      <>
                        <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">{(item as Comment).text}</p>
                        {(item as Comment).isTodo && (
                          <div className="mt-2 pt-2 border-t border-indigo-100/50 flex items-center gap-2">
                            <CheckSquare className="w-3 h-3 text-indigo-500" />
                            <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest">Added to tasks</span>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-xs font-bold text-slate-800">{(item as Todo).title}</p>
                          <span className={cn(
                            "px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter border",
                            (item as Todo).priority === 'Critical' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                            (item as Todo).priority === 'High' ? 'bg-orange-50 text-orange-600 border-orange-100' :
                            'bg-slate-100 text-slate-500 border-slate-200'
                          )}>
                            {(item as Todo).priority}
                          </span>
                        </div>
                        {(item as Todo).description && (
                          <p className="text-[10px] text-slate-500 line-clamp-2">{(item as Todo).description}</p>
                        )}
                        <div className="flex items-center gap-2 pt-1">
                          <span className={cn(
                            "text-[8px] font-black uppercase px-1.5 py-0.5 rounded",
                            (item as Todo).status === 'Done' ? 'bg-emerald-100 text-emerald-700' :
                            (item as Todo).status === 'In Progress' ? 'bg-amber-100 text-amber-700' :
                            'bg-slate-200 text-slate-600'
                          )}>
                            {(item as Todo).status}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-3">
              <div className="w-12 h-12 rounded-full bg-white border border-slate-100 flex items-center justify-center">
                 <MessageSquare className="w-6 h-6 text-slate-200" />
              </div>
              <div className="text-center">
                <p className="text-xs font-bold uppercase tracking-widest">No activity yet</p>
                <p className="text-[10px] font-medium opacity-60 mt-1">Start a conversation or add notes</p>
              </div>
            </div>
          )}
        </AnimatePresence>
      </div>

      <div className="p-4 border-t border-slate-200 bg-white">
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="relative">
            <textarea 
              placeholder="Type your comment or note..."
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none h-24 resize-none transition-all placeholder:text-slate-400"
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            <button 
              type="submit"
              disabled={!text.trim()}
              className="absolute right-2 bottom-2 p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:grayscale transition-all shadow-lg shadow-indigo-100"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button 
                type="button"
                onClick={() => setIsTodo(!isTodo)}
                className={cn(
                  "flex items-center gap-1.5 px-2 py-1 rounded-md border transition-all text-[10px] font-black uppercase tracking-tighter",
                  isTodo 
                    ? "bg-indigo-600 border-indigo-600 text-white" 
                    : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                )}
              >
                <CheckSquare className="w-3 h-3" />
                <span>Format as TODO</span>
              </button>

              {isTodo && (
                <div className="flex items-center gap-1">
                   <Flag className="w-3 h-3 text-slate-400" />
                   <select 
                     className="bg-transparent border-none text-[10px] font-black text-slate-600 uppercase outline-none"
                     value={priority}
                     onChange={(e) => setPriority(e.target.value as any)}
                   >
                     <option value="Low">Low</option>
                     <option value="Medium">Medium</option>
                     <option value="High">High</option>
                     <option value="Critical">Critical</option>
                   </select>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-1 text-slate-400">
               <Info className="w-3 h-3" />
               <span className="text-[9px] font-medium italic">Supports multiline</span>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

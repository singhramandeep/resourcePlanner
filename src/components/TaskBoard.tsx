import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  Calendar, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  MoreVertical,
  Flag,
  Tag,
  MessageSquare,
  User,
  Projector,
  Trash2,
  ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, parseISO, isAfter, isBefore } from 'date-fns';
import { Todo, TodoStatus, TodoPriority, TeamMember, Project } from '../types';
import { cn, obfuscate } from '../lib/utils';

interface TaskBoardProps {
  todos: Todo[];
  members: TeamMember[];
  projects: Project[];
  onUpdateTodo: (id: string, updates: Partial<Todo>) => void;
  onDeleteTodo: (id: string) => void;
  onAddTodo: (todo: Omit<Todo, 'id' | 'createdAt'>) => Todo;
  onEditMember: (member: TeamMember) => void;
  privacyMode: boolean;
}

const COLUMNS: { id: TodoStatus; label: string; color: string }[] = [
  { id: 'Backlog', label: 'Backlog', color: 'bg-slate-100 text-slate-600' },
  { id: 'Todo', label: 'To Do', color: 'bg-indigo-50 text-indigo-600' },
  { id: 'In Progress', label: 'In Progress', color: 'bg-amber-50 text-amber-600' },
  { id: 'Done', label: 'Done', color: 'bg-emerald-50 text-emerald-600' },
];

const PRIORITIES: TodoPriority[] = ['Low', 'Medium', 'High', 'Critical'];

export default function TaskBoard({ 
  todos, 
  members, 
  projects, 
  onUpdateTodo, 
  onDeleteTodo, 
  onAddTodo,
  onEditMember,
  privacyMode 
}: TaskBoardProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPriority, setFilterPriority] = useState<TodoPriority | 'All'>('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);

  const filteredTodos = useMemo(() => {
    return todos.filter(t => {
      const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           t.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesPriority = filterPriority === 'All' || t.priority === filterPriority;
      return matchesSearch && matchesPriority;
    });
  }, [todos, searchQuery, filterPriority]);

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggedTaskId(taskId);
    e.dataTransfer.setData('taskId', taskId);
  };

  const handleDrop = (e: React.DragEvent, status: TodoStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    if (taskId) {
      onUpdateTodo(taskId, { status });
    }
    setDraggedTaskId(null);
  };

  return (
    <div className="h-full flex flex-col gap-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Task Board</h2>
          <p className="text-sm text-slate-500 font-medium tracking-tight">Manage and track follow-up tasks for resources and projects.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-200">
            <Search className="w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Filter tasks..." 
              className="bg-transparent border-none outline-none text-sm w-48"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <select 
            className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-600 outline-none"
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value as any)}
          >
            <option value="All">All Priorities</option>
            {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
          >
            <Plus className="w-4 h-4" />
            <span>Create Task</span>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto">
        <div className="flex gap-6 h-full min-w-max pb-4">
          {COLUMNS.map(column => (
            <div 
              key={column.id} 
              className="flex flex-col w-80 bg-slate-100/50 rounded-2xl border border-slate-200 overflow-hidden"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => handleDrop(e, column.id)}
            >
              <div className="p-4 flex items-center justify-between border-b border-slate-200 bg-white">
                <div className="flex items-center gap-2">
                  <span className={cn("px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest", column.color)}>
                    {column.label}
                  </span>
                  <span className="text-xs font-bold text-slate-400">
                    {filteredTodos.filter(t => t.status === column.id).length}
                  </span>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {filteredTodos.filter(t => t.status === column.id).map(todo => (
                  <TaskCard 
                    key={todo.id} 
                    todo={todo} 
                    members={members} 
                    projects={projects}
                    onUpdateTodo={onUpdateTodo}
                    onDeleteTodo={onDeleteTodo}
                    onEditTodo={(t) => setEditingTodo(t)}
                    onEditMember={onEditMember}
                    onDragStart={handleDragStart}
                    privacyMode={privacyMode}
                  />
                ))}
                {filteredTodos.filter(t => t.status === column.id).length === 0 && (
                  <div className="h-24 rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400">
                    <p className="text-[10px] font-black uppercase tracking-widest">No tasks</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {(showAddModal || editingTodo) && (
        <AddTaskModal 
          todo={editingTodo || undefined}
          onClose={() => { setShowAddModal(false); setEditingTodo(null); }} 
          onAdd={(todoData) => {
            if (editingTodo) {
              onUpdateTodo(editingTodo.id, todoData);
              return editingTodo; // Not used but type needs it
            } else {
              return onAddTodo(todoData);
            }
          }} 
          members={members} 
          projects={projects}
          privacyMode={privacyMode}
        />
      )}
    </div>
  );
}

interface TaskCardProps {
  key?: string;
  todo: Todo;
  members: TeamMember[];
  projects: Project[];
  onUpdateTodo: (id: string, updates: Partial<Todo>) => void;
  onDeleteTodo: (id: string) => void;
  onEditTodo: (todo: Todo) => void;
  onEditMember: (member: TeamMember) => void;
  onDragStart: (e: React.DragEvent, id: string) => void;
  privacyMode: boolean;
}

function TaskCard({ 
  todo, 
  members, 
  projects, 
  onUpdateTodo, 
  onDeleteTodo, 
  onEditTodo,
  onEditMember,
  onDragStart,
  privacyMode 
}: TaskCardProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const relatedProjects = projects.filter(p => todo.projectIds?.includes(p.id));
  const relatedResources = members.filter(m => todo.memberIds?.includes(m.id));
  const taggedPeople = members.filter(m => todo.assignedMemberIds?.includes(m.id));

  const priorityColors = {
    Low: 'bg-slate-100 text-slate-600',
    Medium: 'bg-blue-50 text-blue-600 border-blue-100',
    High: 'bg-orange-50 text-orange-600 border-orange-100',
    Critical: 'bg-rose-50 text-rose-600 border-rose-100'
  };

  return (
    <motion.div 
      layoutId={todo.id}
      draggable
      onDragStart={(e) => onDragStart(e, todo.id)}
      className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all cursor-grab active:cursor-grabbing group relative"
    >
      <div className="flex items-start justify-between mb-3">
        <span className={cn("px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border", priorityColors[todo.priority])}>
          {todo.priority}
        </span>
        <div className="relative">
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-1 hover:bg-slate-100 rounded text-slate-400"
          >
            <MoreVertical className="w-3.5 h-3.5" />
          </button>
          {isMenuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setIsMenuOpen(false)} />
              <div className="absolute right-0 top-full mt-1 w-32 bg-white rounded-lg shadow-xl border border-slate-200 z-20 overflow-hidden py-1">
                <button 
                  onClick={() => { onEditTodo(todo); setIsMenuOpen(false); }}
                  className="w-full px-3 py-1.5 text-left text-xs font-bold text-slate-600 hover:bg-slate-50 flex items-center gap-2"
                >
                  <AlertCircle className="w-3 h-3" />
                  Edit Task
                </button>
                <button 
                  onClick={() => { onDeleteTodo(todo.id); setIsMenuOpen(false); }}
                  className="w-full px-3 py-1.5 text-left text-xs font-bold text-rose-600 hover:bg-rose-50 flex items-center gap-2 border-t border-slate-50"
                >
                  <Trash2 className="w-3 h-3" />
                  Delete
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <h4 className="text-xs font-bold text-slate-900 mb-1 leading-relaxed">{todo.title}</h4>
      {todo.description && (
        <p className="text-[10px] text-slate-500 line-clamp-2 mb-3">{todo.description}</p>
      )}

      <div className="space-y-2 pt-2 border-t border-slate-50">
        {(relatedProjects.length > 0 || relatedResources.length > 0) && (
          <div className="flex flex-wrap gap-1.5">
            {relatedProjects.map(p => (
              <div key={p.id} className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-indigo-50/50 text-indigo-700 text-[9px] font-black border border-indigo-100/50 uppercase tracking-tighter">
                <Projector className="w-2.5 h-2.5" />
                {p.name}
              </div>
            ))}
            {relatedResources.map(m => (
              <div key={m.id} className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-50/50 text-amber-700 text-[9px] font-black border border-amber-100/50 uppercase tracking-tighter">
                <User className="w-2.5 h-2.5" />
                {obfuscate(m.name, privacyMode)}
              </div>
            ))}
          </div>
        )}

        {taggedPeople.length > 0 && (
          <div className="flex flex-wrap gap-1 items-center">
            <span className="text-[8px] font-black text-slate-400 uppercase mr-1">Notifying:</span>
            <div className="flex -space-x-1.5">
              {taggedPeople.map(m => (
                <img 
                  key={m.id} 
                  src={m.avatar} 
                  alt="" 
                  title={obfuscate(m.name, privacyMode)}
                  className="w-5 h-5 rounded-full border-2 border-white bg-slate-100 shadow-sm cursor-pointer hover:ring-2 hover:ring-indigo-500 transition-all" 
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditMember(m);
                  }}
                />
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-[9px] font-black text-slate-400 uppercase tracking-tighter">
            <Calendar className="w-2.5 h-2.5" />
            {todo.dueDate ? format(parseISO(todo.dueDate), 'd MMM') : 'No date'}
          </div>
          {todo.status === 'Done' && (
            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
          )}
        </div>
      </div>
    </motion.div>
  );
}

function AddTaskModal({ 
  todo,
  onClose, 
  onAdd, 
  members, 
  projects,
  privacyMode 
}: { 
  todo?: Todo;
  onClose: () => void; 
  onAdd: (todo: Omit<Todo, 'id' | 'createdAt'>) => Todo; 
  members: TeamMember[]; 
  projects: Project[];
  privacyMode: boolean;
}) {
  const [title, setTitle] = useState(todo?.title || '');
  const [description, setDescription] = useState(todo?.description || '');
  const [priority, setPriority] = useState<TodoPriority>(todo?.priority || 'Medium');
  const [status, setStatus] = useState<TodoStatus>(todo?.status || 'Todo');
  const [dueDate, setDueDate] = useState(todo?.dueDate || '');
  const [projectIds, setProjectIds] = useState<string[]>(todo?.projectIds || []);
  const [memberIds, setMemberIds] = useState<string[]>(todo?.memberIds || []);
  const [assignedMemberIds, setAssignedMemberIds] = useState<string[]>(todo?.assignedMemberIds || []);
  const [isProjectsOpen, setIsProjectsOpen] = useState(false);
  const [isResourcesOpen, setIsResourcesOpen] = useState(false);
  const [isTagsOpen, setIsTagsOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;
    onAdd({
      title,
      description,
      priority,
      status,
      dueDate: dueDate || undefined,
      projectIds,
      memberIds,
      assignedMemberIds
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden"
      >
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">
            {todo ? 'Edit Task' : 'Create New Task'}
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-all text-slate-400">
            <Plus className="rotate-45 w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Task Title</label>
              <input 
                autoFocus
                type="text"
                placeholder="What needs to be done?"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Description</label>
              <textarea 
                placeholder="Additional details..."
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none transition-all h-24 resize-none"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Priority</label>
                <div className="flex p-1 bg-slate-100 rounded-lg">
                  {PRIORITIES.map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPriority(p)}
                      className={cn(
                        "flex-1 py-1 rounded text-[10px] font-black uppercase tracking-tight transition-all",
                        priority === p ? "bg-white text-indigo-700 shadow-sm" : "text-slate-400 hover:text-slate-600"
                      )}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Due Date</label>
                <input 
                  type="date"
                  className="w-full px-4 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Projects</label>
                <div className="relative">
                  <button 
                    type="button"
                    onClick={() => setIsProjectsOpen(!isProjectsOpen)}
                    className="w-full flex items-center justify-between px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-bold text-slate-600 group hover:border-slate-300 transition-all"
                  >
                    <div className="flex gap-1 overflow-hidden">
                      {projectIds.length > 0 ? (
                        projectIds.map(id => (
                          <span key={id} className="bg-indigo-100 text-indigo-700 px-2 rounded-full uppercase truncate max-w-[80px]">
                            {projects.find(p => p.id === id)?.name || ''}
                          </span>
                        ))
                      ) : (
                        <span className="text-slate-400">Select projects...</span>
                      )}
                    </div>
                    <ChevronDown className={cn("w-3.5 h-3.5 text-slate-400 transition-transform", isProjectsOpen ? "rotate-180" : "")} />
                  </button>

                  <AnimatePresence>
                    {isProjectsOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute top-full mt-2 left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-2xl z-[120] max-h-48 overflow-y-auto p-2"
                      >
                        {projects.map(p => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => {
                              setProjectIds(prev => 
                                prev.includes(p.id) ? prev.filter(id => id !== p.id) : [...prev, p.id]
                              );
                            }}
                            className={cn(
                              "w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all mb-0.5",
                              projectIds.includes(p.id) ? "bg-indigo-50 text-indigo-700" : "hover:bg-slate-50 text-slate-600"
                            )}
                          >
                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                            <span>{p.name}</span>
                            {projectIds.includes(p.id) && (
                              <CheckCircle2 className="w-3 h-3 ml-auto text-indigo-600" />
                            )}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Resources</label>
                <div className="relative">
                  <button 
                    type="button"
                    onClick={() => setIsResourcesOpen(!isResourcesOpen)}
                    className="w-full flex items-center justify-between px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-bold text-slate-600 group hover:border-slate-300 transition-all"
                  >
                    <div className="flex gap-1 overflow-hidden">
                      {memberIds.length > 0 ? (
                        memberIds.map(id => (
                          <span key={id} className="bg-amber-100 text-amber-700 px-2 rounded-full uppercase truncate max-w-[80px]">
                            {obfuscate(members.find(m => m.id === id)?.name || '', privacyMode)}
                          </span>
                        ))
                      ) : (
                        <span className="text-slate-400">Select resources...</span>
                      )}
                    </div>
                    <ChevronDown className={cn("w-3.5 h-3.5 text-slate-400 transition-transform", isResourcesOpen ? "rotate-180" : "")} />
                  </button>

                  <AnimatePresence>
                    {isResourcesOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute top-full mt-2 left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-2xl z-[120] max-h-48 overflow-y-auto p-2"
                      >
                        {members.map(m => (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => {
                              setMemberIds(prev => 
                                prev.includes(m.id) ? prev.filter(id => id !== m.id) : [...prev, m.id]
                              );
                            }}
                            className={cn(
                              "w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all mb-0.5",
                              memberIds.includes(m.id) ? "bg-amber-50 text-amber-700" : "hover:bg-slate-50 text-slate-600"
                            )}
                          >
                            <img src={m.avatar} alt="" className="w-5 h-5 rounded-full" />
                            <span>{obfuscate(m.name, privacyMode)}</span>
                            {memberIds.includes(m.id) && (
                              <CheckCircle2 className="w-3 h-3 ml-auto text-amber-600" />
                            )}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            <div className="space-y-1 pt-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Tag People</label>
                <div className="relative">
                  <button 
                    type="button"
                    onClick={() => setIsTagsOpen(!isTagsOpen)}
                    className="w-full flex items-center justify-between px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-bold text-slate-600 group hover:border-slate-300 transition-all"
                  >
                    <div className="flex gap-1 overflow-hidden">
                      {assignedMemberIds.length > 0 ? (
                        assignedMemberIds.map(id => (
                          <span key={id} className="bg-indigo-100 text-indigo-700 px-2 rounded-full uppercase truncate max-w-[80px]">
                            {obfuscate(members.find(m => m.id === id)?.name || '', privacyMode)}
                          </span>
                        ))
                      ) : (
                        <span className="text-slate-400">Select people to notify...</span>
                      )}
                    </div>
                    <ChevronDown className={cn("w-3.5 h-3.5 text-slate-400 transition-transform", isTagsOpen ? "rotate-180" : "")} />
                  </button>

                  <AnimatePresence>
                    {isTagsOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute top-full mt-2 left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-2xl z-[110] max-h-48 overflow-y-auto p-2"
                      >
                        {members.map(m => (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => {
                              setAssignedMemberIds(prev => 
                                prev.includes(m.id) ? prev.filter(id => id !== m.id) : [...prev, m.id]
                              );
                            }}
                            className={cn(
                              "w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all mb-0.5",
                              assignedMemberIds.includes(m.id) ? "bg-indigo-50 text-indigo-700" : "hover:bg-slate-50 text-slate-600"
                            )}
                          >
                            <img src={m.avatar} alt="" className="w-5 h-5 rounded-full" />
                            <span>{obfuscate(m.name, privacyMode)}</span>
                            {assignedMemberIds.includes(m.id) && (
                              <CheckCircle2 className="w-3 h-3 ml-auto text-indigo-600" />
                            )}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl text-sm font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="flex-1 py-3 bg-indigo-600 text-white rounded-xl text-sm font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
            >
              {todo ? 'Save Changes' : 'Create Task'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  LayoutDashboard, 
  Table2, 
  Users, 
  Briefcase, 
  UserMinus,
  Settings, 
  Download,
  ChevronDown,
  ChevronRight,
  Circle,
  Plus,
  Trash2,
  Edit2,
  Folder,
  PanelLeftClose,
  PanelLeftOpen,
  GitGraph,
  CheckSquare,
  BarChart3,
  TrendingUp,
  UserCheck,
  GraduationCap
} from 'lucide-react';
import { ViewType, Team, Project, ProjectGroup } from '../types';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SidebarProps {
  currentView: ViewType;
  setCurrentView: (view: ViewType) => void;
  selectedTeamId: string | null;
  setSelectedTeamId: (id: string | null) => void;
  selectedProjectId: string | null;
  setSelectedProjectId: (id: string | null) => void;
  selectedProjectGroupId: string | null;
  setSelectedProjectGroupId: (id: string | null) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  teams: Team[];
  projects: Project[];
  projectGroups: ProjectGroup[];
  user: { name: string; role: string; avatar: string };
  onUpdateUser: (user: { name: string; role: string; avatar: string }) => void;
  onAddTeam: () => void;
  onDeleteTeam: (id: string) => void;
  onEditTeam?: (team: Team) => void;
}

export default function Sidebar({ 
  currentView, 
  setCurrentView, 
  selectedTeamId, 
  setSelectedTeamId, 
  selectedProjectId,
  setSelectedProjectId,
  selectedProjectGroupId,
  setSelectedProjectGroupId,
  searchQuery,
  setSearchQuery,
  isCollapsed,
  setIsCollapsed,
  teams, 
  projects,
  projectGroups,
  user, 
  onUpdateUser, 
  onAddTeam, 
  onDeleteTeam, 
  onEditTeam 
}: SidebarProps) {
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isGridExpanded, setIsGridExpanded] = useState(true);
  const [isTeamExpanded, setIsTeamExpanded] = useState(true);
  const [isProjectsExpanded, setIsProjectsExpanded] = useState(true);
  const [isReportsExpanded, setIsReportsExpanded] = useState(true);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState(user.name);
  const [editAvatar, setEditAvatar] = useState(user.avatar);

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupId]: !prev[groupId]
    }));
  };

  const navItems = [
    { id: 'Dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { 
      id: 'Grid', 
      icon: Table2, 
      label: 'Resource Grid',
      hasChildren: true,
      isExpanded: isGridExpanded,
      toggle: () => setIsGridExpanded(!isGridExpanded)
    },
    { 
      id: 'Team', 
      icon: Users, 
      label: 'Team Members',
      hasChildren: true,
      isExpanded: isTeamExpanded,
      toggle: () => setIsTeamExpanded(!isTeamExpanded)
    },
    { 
      id: 'Projects', 
      icon: Briefcase, 
      label: 'Projects',
      hasChildren: true,
      isExpanded: isProjectsExpanded,
      toggle: () => setIsProjectsExpanded(!isProjectsExpanded)
    },
    { 
      id: 'Reports', 
      icon: BarChart3, 
      label: 'Reports',
      hasChildren: true,
      isExpanded: isReportsExpanded,
      toggle: () => setIsReportsExpanded(!isReportsExpanded)
    },
    { id: 'Org', icon: GitGraph, label: 'Org Structure' },
    { id: 'Tasks', icon: CheckSquare, label: 'Tasks' },
    { id: 'Settings', icon: Settings, label: 'Settings' },
  ];

  const reportItems = [
    { id: 'Bench', icon: UserMinus, label: 'Bench View' },
    { id: 'Contractors', icon: UserCheck, label: 'Contractors' },
    { id: 'Interns', icon: GraduationCap, label: 'Interns' },
    { id: 'Forecast', icon: TrendingUp, label: 'Resource Forecast' },
  ];

  const exportOptions = ['Export as PDF', 'Export as CSV', 'Export as Excel'];

  const renderTeamTree = (parentId: string | null, viewId: string, depth = 0) => {
    const childTeams = teams.filter(t => (t.parentId || null) === parentId);
    
    return childTeams.map(team => (
      <div key={`${viewId}-${team.id}`} className="space-y-1">
        <div 
          className="group flex items-center justify-between px-3 py-1.5 rounded-lg transition-all hover:bg-slate-50"
          style={{ paddingLeft: isCollapsed ? '12px' : `${depth * 14 + 12}px` }}
        >
          <button
            onClick={() => {
              setCurrentView(viewId as ViewType);
              setSelectedTeamId(team.id);
              setSelectedProjectId(null);
              setSelectedProjectGroupId(null);
              setSearchQuery('');
            }}
            className={`flex-1 flex items-center gap-2 text-xs font-medium ${
              currentView === viewId && selectedTeamId === team.id
                ? 'text-indigo-700'
                : 'text-slate-500'
            }`}
          >
            <Circle className={`w-1.5 h-1.5 shrink-0 ${currentView === viewId && selectedTeamId === team.id ? 'fill-indigo-600 text-indigo-600' : 'text-slate-300'}`} />
            {!isCollapsed && <span className="truncate">{team.name}</span>}
          </button>
          {!isCollapsed && (
            <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 transition-all shrink-0">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onEditTeam?.(team);
                }}
                className="p-1 hover:bg-slate-200 rounded text-slate-400 hover:text-indigo-600 transition-all"
              >
                <Edit2 className="w-3 h-3" />
              </button>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteTeam(team.id);
                }}
                className="p-1 hover:bg-rose-100 rounded text-slate-400 hover:text-rose-500 transition-all"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
        {renderTeamTree(team.id, viewId, depth + 1)}
      </div>
    ));
  };

  const renderProjectHierarchy = () => {
    const ungroupedProjects = projects.filter(p => !p.groupId);
    
    return (
      <div className="space-y-1 mt-1">
        {ungroupedProjects.map(project => (
          <button
            key={project.id}
            onClick={() => {
              setCurrentView('Projects');
              setSelectedProjectId(project.id);
              setSelectedProjectGroupId(null);
              setSelectedTeamId(null);
              setSearchQuery('');
            }}
            className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              currentView === 'Projects' && selectedProjectId === project.id
                ? 'text-indigo-700 bg-indigo-50/50'
                : 'text-slate-500 hover:bg-slate-50'
            }`}
            style={{ paddingLeft: isCollapsed ? '12px' : '24px' }}
          >
            <Circle className={`w-1.5 h-1.5 shrink-0 ${currentView === 'Projects' && selectedProjectId === project.id ? 'fill-indigo-600 text-indigo-600' : 'text-slate-300'}`} />
            {!isCollapsed && <span className="truncate">{project.name}</span>}
          </button>
        ))}

        {projectGroups.map(group => {
          const groupProjects = projects.filter(p => p.groupId === group.id);
          const isGroupExpanded = expandedGroups[group.id];
          const isGroupActive = currentView === 'Projects' && selectedProjectGroupId === group.id;

          return (
            <div key={group.id} className="space-y-1">
              <button
                onClick={() => {
                  toggleGroup(group.id);
                  setCurrentView('Projects');
                  setSelectedProjectGroupId(group.id);
                  setSelectedProjectId(null);
                  setSelectedTeamId(null);
                  setSearchQuery('');
                }}
                className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  isGroupActive ? 'text-indigo-700 bg-indigo-50/30' : 'text-slate-600 hover:bg-slate-50'
                }`}
                style={{ paddingLeft: isCollapsed ? '12px' : '16px' }}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Folder className={`w-3.5 h-3.5 shrink-0 ${isGroupActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                  {!isCollapsed && <span className="truncate">{group.name}</span>}
                </div>
                {!isCollapsed && (
                  <ChevronDown className={`w-3 h-3 transition-transform ${isGroupExpanded ? 'rotate-180' : '-rotate-90'}`} />
                )}
              </button>

              {isGroupExpanded && !isCollapsed && (
                <div className="space-y-1">
                  {groupProjects.map(project => (
                    <button
                      key={project.id}
                      onClick={() => {
                        setCurrentView('Projects');
                        setSelectedProjectId(project.id);
                        setSelectedProjectGroupId(null);
                      }}
                      className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        currentView === 'Projects' && selectedProjectId === project.id
                          ? 'text-indigo-700 bg-indigo-50/50'
                          : 'text-slate-500 hover:bg-slate-50'
                      }`}
                      style={{ paddingLeft: '36px' }}
                    >
                      <Circle className={`w-1.5 h-1.5 shrink-0 ${currentView === 'Projects' && selectedProjectId === project.id ? 'fill-indigo-600 text-indigo-600' : 'text-slate-300'}`} />
                      <span className="truncate">{project.name}</span>
                    </button>
                  ))}
                  {groupProjects.length === 0 && (
                    <span className="block px-8 py-1 text-[10px] text-slate-400 italic">No projects</span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <aside className={`${isCollapsed ? 'w-20' : 'w-64'} bg-white border-r border-slate-200 flex flex-col shrink-0 transition-all duration-300 relative`}>
      {/* Brand */}
      <div className={`p-6 flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shrink-0">
          <div className="w-4 h-4 bg-white rounded-sm rotate-45"></div>
        </div>
        {!isCollapsed && <span className="font-bold text-lg tracking-tight text-slate-900 truncate">ResourcePlanner</span>}
      </div>

      {/* Collapse Toggle */}
      <button 
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-20 w-6 h-6 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:border-indigo-200 transition-all shadow-sm z-50"
      >
        {isCollapsed ? <PanelLeftOpen className="w-3.5 h-3.5" /> : <PanelLeftClose className="w-3.5 h-3.5" />}
      </button>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-4 space-y-1 overflow-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id && !selectedTeamId && !selectedProjectId && !selectedProjectGroupId;
          const isParentActive = currentView === item.id;

          return (
            <div key={item.id} className="space-y-1">
              <button
                onClick={() => {
                  setCurrentView(item.id as ViewType);
                  setSelectedTeamId(null);
                  setSelectedProjectId(null);
                  setSelectedProjectGroupId(null);
                  setSearchQuery('');
                  if (item.toggle) item.toggle();
                }}
                className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} px-3 py-2 rounded-lg transition-all duration-200 font-medium text-sm ${
                  isActive 
                    ? 'bg-indigo-50 text-indigo-700' 
                    : isParentActive 
                      ? 'text-indigo-600 bg-indigo-50/30' 
                      : 'text-slate-600 hover:bg-slate-50'
                }`}
                title={isCollapsed ? item.label : undefined}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 shrink-0 ${isActive || isParentActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                  {!isCollapsed && <span>{item.label}</span>}
                </div>
                {item.hasChildren && !isCollapsed && (
                  <ChevronDown className={`w-3 h-3 transition-transform ${item.isExpanded ? 'rotate-180' : ''}`} />
                )}
              </button>

              {item.hasChildren && item.isExpanded && (
                <div className="space-y-1">
                  {item.id === 'Projects' ? renderProjectHierarchy() : 
                   item.id === 'Reports' ? (
                     <div className="space-y-1">
                       {reportItems.map(report => {
                         const ReportIcon = report.icon;
                         const isReportActive = currentView === report.id;
                         return (
                           <button
                             key={report.id}
                             onClick={() => {
                               setCurrentView(report.id as ViewType);
                               setSelectedTeamId(null);
                               setSelectedProjectId(null);
                               setSelectedProjectGroupId(null);
                               setSearchQuery('');
                             }}
                             className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                               isReportActive
                                 ? 'text-indigo-700 bg-indigo-50/50'
                                 : 'text-slate-500 hover:bg-slate-50'
                             }`}
                             style={{ paddingLeft: isCollapsed ? '12px' : '24px' }}
                           >
                             <ReportIcon className={`w-3.5 h-3.5 shrink-0 ${isReportActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                             {!isCollapsed && <span className="truncate">{report.label}</span>}
                           </button>
                         );
                       })}
                     </div>
                   ) : 
                   renderTeamTree(null, item.id)}
                  
                  {!isCollapsed && item.id !== 'Reports' && (
                    <button
                      onClick={() => {
                        setCurrentView(item.id as ViewType);
                        setSelectedTeamId(null);
                        setSelectedProjectId(null);
                        setSelectedProjectGroupId(null);
                        setSearchQuery('');
                      }}
                      className={`ml-3 mr-3 w-[calc(100%-24px)] flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        currentView === item.id && selectedTeamId === null && selectedProjectId === null && selectedProjectGroupId === null
                          ? 'text-indigo-700 bg-indigo-50/50'
                          : 'text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      <Circle className={`w-1.5 h-1.5 shrink-0 ${currentView === item.id && selectedTeamId === null && selectedProjectId === null && selectedProjectGroupId === null ? 'fill-indigo-600 text-indigo-600' : 'text-slate-300'}`} />
                      <span>{item.id === 'Projects' ? 'All Projects' : 'All Groups'}</span>
                    </button>
                  )}
                  
                  {!isCollapsed && item.id === 'Team' && (
                    <button
                      onClick={onAddTeam}
                      className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:bg-slate-50 hover:text-indigo-600 transition-all"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add Team</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Export Section */}
      <div className="p-4 mt-auto border-t border-slate-100">
        {!isCollapsed && (
          <div className="relative mb-4">
            <button 
              onClick={() => setIsExportOpen(!isExportOpen)}
              className="w-full flex items-center justify-between px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-100 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Download className="w-4 h-4 text-slate-400" />
                <span>Export</span>
              </div>
              <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${isExportOpen ? 'rotate-180' : ''}`} />
            </button>
            
            <AnimatePresence>
              {isExportOpen && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute bottom-full mb-2 left-0 w-full bg-white border border-slate-200 rounded-lg shadow-xl overflow-hidden z-50 p-1"
                >
                  {exportOptions.map((option) => (
                    <button
                      key={option}
                      className="w-full text-left px-3 py-1.5 text-xs hover:bg-slate-50 rounded transition-colors"
                      onClick={() => setIsExportOpen(false)}
                    >
                      {option}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        <div className={`px-1 relative ${isCollapsed ? 'flex justify-center' : ''}`}>
          <button 
            onClick={() => setIsEditingProfile(!isEditingProfile)}
            className={`flex items-center gap-3 w-full p-2 hover:bg-slate-50 rounded-lg transition-all group ${isCollapsed ? 'justify-center' : ''}`}
          >
            {user.avatar ? (
              <img src={user.avatar} alt="" className="w-8 h-8 rounded-full border border-indigo-200 object-cover shrink-0" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs border border-indigo-200 shrink-0">
                {user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
              </div>
            )}
            {!isCollapsed && (
              <>
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-xs font-bold text-slate-900 truncate">{user.name}</p>
                  <p className="text-[10px] text-slate-500 truncate font-medium">{user.role}</p>
                </div>
                <Settings className="w-3 h-3 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
              </>
            )}
          </button>

          <AnimatePresence>
            {isEditingProfile && !isCollapsed && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="absolute bottom-full mb-2 left-0 w-64 bg-white border border-slate-200 rounded-xl shadow-2xl p-4 z-[100]"
              >
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Edit Profile</h3>
                
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Your Name</label>
                    <input 
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Avatar Type</label>
                    <div className="grid grid-cols-4 gap-2">
                      <button 
                        onClick={() => setEditAvatar('')}
                        className={`aspect-square rounded-lg border-2 flex items-center justify-center text-[10px] font-bold ${!editAvatar ? 'border-indigo-600 bg-indigo-50 text-indigo-600' : 'border-slate-100 hover:border-slate-200'}`}
                      >
                        Init
                      </button>
                      <button 
                        onClick={() => setEditAvatar(`https://api.dicebear.com/7.x/avataaars/svg?seed=${editName || 'User'}`)}
                        className={`aspect-square rounded-lg border-2 overflow-hidden ${editAvatar?.includes('avataaars') ? 'border-indigo-600' : 'border-slate-100 hover:border-slate-200'}`}
                      >
                        <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${editName || 'User'}`} alt="" className="w-full h-full object-cover" />
                      </button>
                      <button 
                        onClick={() => setEditAvatar(`https://avatar.iran.liara.run/public/boy?username=${editName || 'User'}`)}
                        className={`aspect-square rounded-lg border-2 overflow-hidden ${editAvatar?.includes('boy') ? 'border-indigo-600' : 'border-slate-100 hover:border-slate-200'}`}
                      >
                        <img src={`https://avatar.iran.liara.run/public/boy?username=${editName || 'User'}`} alt="" className="w-full h-full object-cover" />
                      </button>
                      <button 
                        onClick={() => setEditAvatar(`https://avatar.iran.liara.run/public/girl?username=${editName || 'User'}`)}
                        className={`aspect-square rounded-lg border-2 overflow-hidden ${editAvatar?.includes('girl') ? 'border-indigo-600' : 'border-slate-100 hover:border-slate-200'}`}
                      >
                        <img src={`https://avatar.iran.liara.run/public/girl?username=${editName || 'User'}`} alt="" className="w-full h-full object-cover" />
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button 
                      onClick={() => setIsEditingProfile(false)}
                      className="flex-1 px-3 py-2 text-xs font-bold text-slate-500 hover:bg-slate-50 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={() => {
                        onUpdateUser({ ...user, name: editName, avatar: editAvatar });
                        setIsEditingProfile(false);
                      }}
                      className="flex-1 px-3 py-2 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-100"
                    >
                      Save
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </aside>
  );
}

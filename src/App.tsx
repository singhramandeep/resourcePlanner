/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Briefcase, 
  Settings, 
  Download, 
  Plus, 
  Search, 
  Calendar as CalendarIcon,
  ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek,
  endOfWeek,
  isSameMonth, 
  parseISO,
  isBefore,
  isAfter
} from 'date-fns';
import { 
  ViewType, 
  Assignment, 
  AssignmentStatus, 
  TeamMember, 
  Project, 
  Team, 
  ProjectGroup,
  Comment,
  Todo,
  TodoStatus
} from './types';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import ResourceGrid from './components/ResourceGrid';
import ReportingView from './components/ReportingView';
import TeamMembersView from './components/TeamMembersView';
import ProjectsView from './components/ProjectsView';
import BenchView from './components/BenchView';
import OrgChartView from './components/OrgChartView';
import TaskBoard from './components/TaskBoard';
import ForecastView from './components/ForecastView';
import EmploymentReportView from './components/EmploymentReportView';
import SettingsView from './components/SettingsView';
import AddResourceModal from './components/AddResourceModal';
import AddProjectModal from './components/AddProjectModal';
import EditResourceModal from './components/EditResourceModal';
import EditProjectModal from './components/EditProjectModal';
import AddTeamModal from './components/AddTeamModal';
import EditTeamModal from './components/EditTeamModal';
import BulkEditModal from './components/BulkEditModal';
import { MOCK_ASSIGNMENTS, MOCK_TEAM_MEMBERS, MOCK_PROJECTS, MOCK_TEAMS, MOCK_PROJECT_GROUPS } from './mockData';

const loadData = <T,>(key: string, defaultData: T): T => {
  try {
    const saved = localStorage.getItem(key);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error(`Error loading data for ${key}`, e);
  }
  return defaultData;
};

export default function App() {
  const [currentView, setCurrentView] = useState<ViewType>('Grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(() => {
    return localStorage.getItem('selectedTeamId');
  });
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedProjectGroupId, setSelectedProjectGroupId] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [privacyMode, setPrivacyMode] = useState(() => {
    return localStorage.getItem('privacyMode') === 'true';
  });

  useEffect(() => {
    localStorage.setItem('privacyMode', privacyMode.toString());
  }, [privacyMode]);

  useEffect(() => {
    if (selectedTeamId) {
      localStorage.setItem('selectedTeamId', selectedTeamId);
    } else {
      localStorage.removeItem('selectedTeamId');
    }
  }, [selectedTeamId]);
  const [teams, setTeams] = useState<Team[]>(() => loadData('teams', MOCK_TEAMS));
  const [projectGroups, setProjectGroups] = useState<ProjectGroup[]>(() => loadData('projectGroups', MOCK_PROJECT_GROUPS));
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(() => loadData('teamMembers', MOCK_TEAM_MEMBERS));
  const [projects, setProjects] = useState<Project[]>(() => loadData('projects', MOCK_PROJECTS));
  const [assignments, setAssignments] = useState<Assignment[]>(() => loadData('assignments', MOCK_ASSIGNMENTS));
  const [currentYear, setCurrentYear] = useState(() => {
    const saved = localStorage.getItem('currentYear');
    return saved ? parseInt(saved, 10) : new Date().getFullYear();
  });
  const [viewMode, setViewMode] = useState<'monthly' | 'weekly'>(() => {
    const saved = localStorage.getItem('viewMode');
    return (saved as 'monthly' | 'weekly') || 'monthly';
  });
  const [user, setUser] = useState(() => loadData('userProfile', {
    name: 'Ryan Gosling',
    role: 'Admin Account',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ryan'
  }));
  
  const [comments, setComments] = useState<Comment[]>(() => loadData('comments', []));
  const [todos, setTodos] = useState<Todo[]>(() => loadData('todos', []));

  useEffect(() => {
    localStorage.setItem('comments', JSON.stringify(comments));
  }, [comments]);

  useEffect(() => {
    localStorage.setItem('todos', JSON.stringify(todos));
  }, [todos]);
  
  const [showAddResource, setShowAddResource] = useState(false);
  const [showAddProject, setShowAddProject] = useState(false);
  const [showAddTeam, setShowAddTeam] = useState(false);
  
  const [editingResource, setEditingResource] = useState<TeamMember | null>(null);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [bulkEditIds, setBulkEditIds] = useState<string[] | null>(null);

  useEffect(() => {
    localStorage.setItem('teams', JSON.stringify(teams));
  }, [teams]);

  useEffect(() => {
    localStorage.setItem('teamMembers', JSON.stringify(teamMembers));
  }, [teamMembers]);

  useEffect(() => {
    localStorage.setItem('projects', JSON.stringify(projects));
  }, [projects]);

  useEffect(() => {
    localStorage.setItem('projectGroups', JSON.stringify(projectGroups));
  }, [projectGroups]);

  useEffect(() => {
    localStorage.setItem('assignments', JSON.stringify(assignments));
  }, [assignments]);

  useEffect(() => {
    localStorage.setItem('userProfile', JSON.stringify(user));
  }, [user]);

  useEffect(() => {
    localStorage.setItem('currentYear', currentYear.toString());
  }, [currentYear]);

  useEffect(() => {
    localStorage.setItem('viewMode', viewMode);
  }, [viewMode]);

  const handleImportAll = (data: {
    teams?: Team[];
    projectGroups?: ProjectGroup[];
    teamMembers?: TeamMember[];
    projects?: Project[];
    assignments?: Assignment[];
    comments?: Comment[];
    todos?: Todo[];
  }) => {
    if (data.teams) setTeams(data.teams);
    if (data.projectGroups) setProjectGroups(data.projectGroups);
    if (data.teamMembers) setTeamMembers(data.teamMembers);
    if (data.projects) setProjects(data.projects);
    if (data.assignments) setAssignments(data.assignments);
    if (data.comments) setComments(data.comments);
    if (data.todos) setTodos(data.todos);
  };

  const handleResetToDefault = () => {
    setTeams(MOCK_TEAMS);
    setProjectGroups(MOCK_PROJECT_GROUPS);
    setTeamMembers(MOCK_TEAM_MEMBERS);
    setProjects(MOCK_PROJECTS);
    setAssignments(MOCK_ASSIGNMENTS);
    setComments([]);
    setTodos([]);
  };

  const handleClearAll = () => {
    setTeams([]);
    setProjectGroups([]);
    setTeamMembers([]);
    setProjects([]);
    setAssignments([]);
    setComments([]);
    setTodos([]);
  };

  const handleAddTeam = (team: Team) => {
    setTeams(prev => [...prev, team]);
    setShowAddTeam(false);
  };

  const handleUpdateTeam = (id: string, updates: Partial<Team>) => {
    setTeams(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  const handleDeleteTeam = (id: string) => {
    setTeams(prev => prev.filter(t => t.id !== id));
    setTeamMembers(prev => prev.filter(m => m.teamId !== id)); // Remove members of the team
    if (selectedTeamId === id) {
      setSelectedTeamId(null);
    }
  };

  const handleAddSingleResource = (member: TeamMember, initialAssignment?: Assignment) => {
    setTeamMembers(prev => [...prev, member]);
    if (initialAssignment) {
      setAssignments(prev => [...prev, initialAssignment]);
    }
    setShowAddResource(false);
  };

  const handleAddBulkResource = (resources: any[]) => {
    const defaultTeamId = teams.length > 0 ? teams[0].id : '';
    const newMembers: TeamMember[] = resources.map((res, idx) => {
      let avatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(res.name)}`;
      if (res.gender === 'boy') {
        avatar = `https://avatar.iran.liara.run/public/boy?username=${encodeURIComponent(res.name)}`;
      } else if (res.gender === 'girl') {
        avatar = `https://avatar.iran.liara.run/public/girl?username=${encodeURIComponent(res.name)}`;
      }

      return {
        id: `m-${Date.now()}-${idx}`,
        name: res.name,
        role: res.role,
        skills: res.skills,
        capacity: 40,
        teamId: defaultTeamId,
        companyStartDate: undefined,
        employmentType: res.employmentType,
        avatar
      };
    });
    setTeamMembers(prev => [...prev, ...newMembers]);
    setShowAddResource(false);
  };

  const handleAddSingleProject = (project: Project) => {
    setProjects(prev => [...prev, project]);
    setShowAddProject(false);
  };

  const handleAddProjectGroup = (name: string) => {
    const newGroup: ProjectGroup = {
      id: `pg-${Date.now()}`,
      name
    };
    setProjectGroups(prev => [...prev, newGroup]);
  };

  const handleAddBulkProject = (names: string[]) => {
    const colors = ['#4F46E5', '#0891B2', '#059669', '#7C3AED', '#64748B', '#E11D48', '#D97706'];
    const newProjects: Project[] = names.map((name, idx) => ({
      id: `p-${Date.now()}-${idx}`,
      name,
      client: 'Internal',
      color: colors[idx % colors.length]
    }));
    setProjects(prev => [...prev, ...newProjects]);
    setShowAddProject(false);
  };

  const handleRemoveAssignmentEntirely = (id: string) => {
    setAssignments(prev => prev.filter(a => a.id !== id));
  };

  const handleDeleteAssignment = (id: string, targetDate: Date, mode: 'month' | 'week') => {
    setAssignments(prev => {
      const result: Assignment[] = [];
      const periodStart = mode === 'month' ? startOfMonth(targetDate) : startOfWeek(targetDate);
      const periodEnd = mode === 'month' ? endOfMonth(targetDate) : endOfWeek(targetDate);

      for (const a of prev) {
        if (a.id !== id) {
          result.push(a);
          continue;
        }

        const assignStart = parseISO(a.startDate);
        const assignEnd = parseISO(a.endDate);

        const startsBefore = isBefore(assignStart, periodStart);
        const endsAfter = isAfter(assignEnd, periodEnd);

        if (startsBefore && endsAfter) {
          // Split into two
          result.push({
            ...a,
            id: `${a.id}-pre`,
            endDate: format(mode === 'month' ? endOfMonth(subMonths(targetDate, 1)) : new Date(periodStart.getTime() - 86400000), 'yyyy-MM-dd')
          });
          result.push({
            ...a,
            id: `${a.id}-post`,
            startDate: format(mode === 'month' ? startOfMonth(addMonths(targetDate, 1)) : new Date(periodEnd.getTime() + 86400000), 'yyyy-MM-dd')
          });
        } else if (startsBefore) {
          result.push({
            ...a,
            endDate: format(mode === 'month' ? endOfMonth(subMonths(targetDate, 1)) : new Date(periodStart.getTime() - 86400000), 'yyyy-MM-dd')
          });
        } else if (endsAfter) {
          result.push({
            ...a,
            startDate: format(mode === 'month' ? startOfMonth(addMonths(targetDate, 1)) : new Date(periodEnd.getTime() + 86400000), 'yyyy-MM-dd')
          });
        } 
      }
      return result;
    });
  };

  const handleAddAssignment = (memberId: string, projectId: string, hours: number, date: Date, mode: 'month' | 'week', status: AssignmentStatus = 'Hard', startDate?: string, endDate?: string) => {
    const start = mode === 'month' ? startOfMonth(date) : startOfWeek(date);
    const end = mode === 'month' ? endOfMonth(date) : endOfWeek(date);
    const sDate = startDate || format(start, 'yyyy-MM-dd');
    const eDate = endDate || format(end, 'yyyy-MM-dd');

    // Check for exact duplicates to prevent spam
    const isDuplicate = assignments.some(a => 
      a.memberId === memberId && 
      a.projectId === projectId && 
      a.startDate === sDate && 
      a.endDate === eDate
    );

    if (isDuplicate) return;
 
    const newAssignment: Assignment = {
      id: `a-${Date.now()}`,
      memberId,
      projectId,
      hoursPerWeek: hours,
      startDate: sDate,
      endDate: eDate,
      status
    };
    setAssignments(prev => [...prev, newAssignment]);
  };

  const handleEditAssignment = (id: string, updates: Partial<Assignment>) => {
    setAssignments(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
  };

  const handleBulkUpdateAssignments = (ids: string[], updates: Partial<Assignment>) => {
    setAssignments(prev => prev.map(a => ids.includes(a.id) ? { ...a, ...updates } : a));
  };

  const handleUpdateMember = (id: string, updates: Partial<TeamMember>) => {
    setTeamMembers(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
  };

  const handleDeleteMember = (id: string) => {
    setTeamMembers(prev => prev.filter(m => m.id !== id));
    setAssignments(prev => prev.filter(a => a.memberId !== id));
  };

  const handleBulkDeleteMembers = (ids: string[]) => {
    const idSet = new Set(ids);
    setTeamMembers(prev => prev.filter(m => !idSet.has(m.id)));
    setAssignments(prev => prev.filter(a => !idSet.has(a.memberId)));
  };

  const handleApplyBulkEdit = (updates: any) => {
    if (!bulkEditIds) return;
    const idSet = new Set(bulkEditIds);
    setTeamMembers(prev => prev.map(m => {
      if (!idSet.has(m.id)) return m;
      
      const newSkills = [...m.skills];
      if (updates.addedSkills) {
        updates.addedSkills.forEach((newSkill: any) => {
          const existing = newSkills.find(s => s.name === newSkill.name);
          if (existing) {
            existing.rating = newSkill.rating;
          } else {
            newSkills.push(newSkill);
          }
        });
      }

      let updatedAvatar = m.avatar;
      if (updates.avatarGender === 'boy') {
        updatedAvatar = `https://avatar.iran.liara.run/public/boy?username=${encodeURIComponent(m.name)}`;
      } else if (updates.avatarGender === 'girl') {
        updatedAvatar = `https://avatar.iran.liara.run/public/girl?username=${encodeURIComponent(m.name)}`;
      }

      return {
        ...m,
        skills: newSkills,
        avatar: updatedAvatar,
        ...(updates.employmentType ? { employmentType: updates.employmentType } : {}),
        ...(updates.teamId ? { teamId: updates.teamId } : {})
      };
    }));
    setBulkEditIds(null);
  };

  const handleDeleteProject = (id: string) => {
    setProjects(prev => prev.filter(p => p.id !== id));
    setAssignments(prev => prev.filter(a => a.projectId !== id));
  };

  const handleBulkDeleteProjects = (ids: string[]) => {
    const idSet = new Set(ids);
    setProjects(prev => prev.filter(p => !idSet.has(p.id)));
    setAssignments(prev => prev.filter(a => !idSet.has(a.projectId)));
  };

  const handleUpdateProject = (id: string, updates: Partial<Project>) => {
    setProjects(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const handleAddComment = (comment: Omit<Comment, 'id' | 'createdAt' | 'authorId' | 'authorName'>) => {
    const newComment: Comment = {
      ...comment,
      id: `c-${Date.now()}`,
      createdAt: new Date().toISOString(),
      authorId: 'user-1', // Mock current user
      authorName: user.name
    };
    setComments(prev => [...prev, newComment]);
    return newComment;
  };

  const handleAddTodo = (todo: Omit<Todo, 'id' | 'createdAt'>) => {
    const newTodo: Todo = {
      ...todo,
      id: `t-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    setTodos(prev => [...prev, newTodo]);
    return newTodo;
  };

  const handleUpdateTodo = (id: string, updates: Partial<Todo>) => {
    setTodos(prev => prev.map(t => t.id === id ? { 
      ...t, 
      ...updates,
      completedAt: updates.status === 'Done' ? new Date().toISOString() : (updates.status && t.status === 'Done' ? undefined : t.completedAt)
    } : t));
  };

  const handleDeleteTodo = (id: string) => {
    setTodos(prev => prev.filter(t => t.id !== id));
    setComments(prev => prev.filter(c => c.todoId !== id));
  };

  const filteredTeamMembers = useMemo(() => {
    if (!selectedTeamId) return teamMembers;
    
    const getAllDescendantTeamIds = (parentId: string, allTeams: Team[]): string[] => {
      const ids: string[] = [parentId];
      const children = allTeams.filter(t => (t.parentId || null) === parentId);
      for (const child of children) {
        ids.push(...getAllDescendantTeamIds(child.id, allTeams));
      }
      return ids;
    };
    
    const teamIdFamily = getAllDescendantTeamIds(selectedTeamId, teams);
    return teamMembers.filter(m => teamIdFamily.includes(m.teamId));
  }, [teamMembers, selectedTeamId, teams]);

  const finalFilteredMembers = useMemo(() => {
    let filtered = filteredTeamMembers;
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(m => {
        const memberAssignments = assignments.filter(a => a.memberId === m.id);
        const projectNames = memberAssignments.map(a => projects.find(p => p.id === a.projectId)?.name.toLowerCase() || '');
        const skills = m.skills.map(s => s.name.toLowerCase());
        
        return m.name.toLowerCase().includes(query) || 
               m.role.toLowerCase().includes(query) ||
               skills.some(s => s.includes(query)) ||
               projectNames.some(p => p.includes(query));
      });
    }

    // Project filter
    if (selectedProjectId) {
      const assignedMemberIds = new Set(assignments.filter(a => a.projectId === selectedProjectId).map(a => a.memberId));
      filtered = filtered.filter(m => assignedMemberIds.has(m.id));
    } else if (selectedProjectGroupId) {
      const groupProjectIds = new Set(projects.filter(p => p.groupId === selectedProjectGroupId).map(p => p.id));
      const assignedMemberIds = new Set(assignments.filter(a => groupProjectIds.has(a.projectId)).map(a => a.memberId));
      filtered = filtered.filter(m => assignedMemberIds.has(m.id));
    }
    return filtered;
  }, [filteredTeamMembers, selectedProjectId, selectedProjectGroupId, assignments, projects, searchQuery]);

  const filteredAssignmentsByTeam = useMemo(() => {
    const memberIdSet = new Set(finalFilteredMembers.map(m => m.id));
    return assignments.filter(a => memberIdSet.has(a.memberId));
  }, [assignments, finalFilteredMembers]);

  return (
    <div className="flex h-screen overflow-hidden text-slate-900">
      {/* Sidebar Navigation */}
      <Sidebar 
        currentView={currentView} 
        setCurrentView={setCurrentView} 
        selectedTeamId={selectedTeamId}
        setSelectedTeamId={setSelectedTeamId}
        selectedProjectId={selectedProjectId}
        setSelectedProjectId={setSelectedProjectId}
        selectedProjectGroupId={selectedProjectGroupId}
        setSelectedProjectGroupId={setSelectedProjectGroupId}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        isCollapsed={sidebarCollapsed}
        setIsCollapsed={setSidebarCollapsed}
        teams={teams}
        projects={projects}
        projectGroups={projectGroups}
        onAddTeam={() => setShowAddTeam(true)}
        onDeleteTeam={handleDeleteTeam}
        user={user}
        onUpdateUser={setUser}
        onEditTeam={setEditingTeam}
      />

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-slate-50 relative">
        <Header 
          searchQuery={searchQuery} 
          setSearchQuery={setSearchQuery} 
          onAddResource={() => setShowAddResource(true)}
          onAddProject={() => setShowAddProject(true)}
          privacyMode={privacyMode}
          setPrivacyMode={setPrivacyMode}
        />

        <div className={`flex-1 ${['Grid', 'Projects', 'Team', 'Bench', 'Contractors', 'Interns'].includes(currentView) ? 'overflow-hidden' : 'overflow-auto'} ${currentView === 'Grid' ? 'p-0' : 'p-6 lg:p-8'}`}>
          <AnimatePresence mode="wait">
            {currentView === 'Dashboard' && (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <ReportingView 
                  members={finalFilteredMembers} 
                  projects={projects} 
                  assignments={filteredAssignmentsByTeam} 
                  onEditMember={(m) => setEditingResource(m)}
                  privacyMode={privacyMode}
                />
              </motion.div>
            )}

            {currentView === 'Grid' && (
              <motion.div
                key="grid"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="h-full"
              >
                <ResourceGrid 
                  searchQuery={searchQuery} 
                  members={finalFilteredMembers}
                  projects={projects}
                  assignments={assignments}
                  onDeleteAssignment={handleDeleteAssignment}
                  onAddAssignment={handleAddAssignment}
                  onEditAssignment={handleEditAssignment}
                  onRemoveAssignmentEntirely={handleRemoveAssignmentEntirely}
                  onAddProject={() => setShowAddProject(true)}
                  selectedTeamId={selectedTeamId}
                  teams={teams}
                  currentYear={currentYear}
                  setCurrentYear={setCurrentYear}
                  viewMode={viewMode}
                  setViewMode={setViewMode}
                  onEditMember={(m) => setEditingResource(m)}
                  privacyMode={privacyMode}
                />
              </motion.div>
            )}

            {currentView === 'Team' && (
              <motion.div
                key="team"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="h-full"
              >
                <TeamMembersView 
                  members={finalFilteredMembers}
                  assignments={assignments} 
                  searchQuery={searchQuery} 
                  selectedTeamId={selectedTeamId}
                  onUpdateMember={handleUpdateMember}
                  onDeleteMember={handleDeleteMember}
                  onBulkDelete={handleBulkDeleteMembers}
                  onBulkEdit={setBulkEditIds}
                  onEditMember={(m) => setEditingResource(m)}
                  teams={teams}
                  projects={projects}
                  onDeleteTeam={handleDeleteTeam}
                  onEditTeam={setEditingTeam}
                  privacyMode={privacyMode}
                  onSwitchView={setCurrentView}
                />
              </motion.div>
            )}

            {currentView === 'Projects' && (
              <motion.div
                key="projects"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="h-full"
              >
                <ProjectsView 
                  members={filteredTeamMembers}
                  projects={projects}
                  assignments={assignments} 
                  projectGroups={projectGroups}
                  selectedProjectId={selectedProjectId}
                  selectedProjectGroupId={selectedProjectGroupId}
                  onAddProjectGroup={handleAddProjectGroup}
                  onDeleteProject={handleDeleteProject}
                  onUpdateProject={handleUpdateProject}
                  onBulkDelete={handleBulkDeleteProjects}
                  onEditProject={(p) => setEditingProject(p)}
                  currentYear={currentYear}
                  setCurrentYear={setCurrentYear}
                  viewMode={viewMode}
                  setViewMode={setViewMode}
                  onAddAssignment={handleAddAssignment}
                  onUpdateAssignment={handleEditAssignment}
                  onBulkUpdateAssignments={handleBulkUpdateAssignments}
                  onDeleteAssignment={handleDeleteAssignment}
                  onRemoveAssignmentEntirely={handleRemoveAssignmentEntirely}
                  onAddProject={() => setShowAddProject(true)}
                  onEditMember={(m) => setEditingResource(m)}
                  privacyMode={privacyMode}
                  searchQuery={searchQuery}
                />
              </motion.div>
            )}

            {currentView === 'Bench' && (
              <motion.div
                key="bench"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="h-full"
              >
                <BenchView 
                  members={finalFilteredMembers} 
                  assignments={filteredAssignmentsByTeam} 
                  onEditMember={(m) => setEditingResource(m)}
                  privacyMode={privacyMode}
                />
              </motion.div>
            )}

            {currentView === 'Contractors' && (
              <motion.div
                key="contractors"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="h-full"
              >
                <EmploymentReportView 
                  type="contractor"
                  members={finalFilteredMembers} 
                  assignments={filteredAssignmentsByTeam} 
                  onEditMember={(m) => setEditingResource(m)}
                  privacyMode={privacyMode}
                />
              </motion.div>
            )}

            {currentView === 'Interns' && (
              <motion.div
                key="interns"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="h-full"
              >
                <EmploymentReportView 
                  type="intern"
                  members={finalFilteredMembers} 
                  assignments={filteredAssignmentsByTeam} 
                  onEditMember={(m) => setEditingResource(m)}
                  privacyMode={privacyMode}
                />
              </motion.div>
            )}

            {currentView === 'Forecast' && (
              <motion.div
                key="forecast"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="h-full overflow-auto"
              >
                <ForecastView 
                  members={finalFilteredMembers}
                  projects={projects}
                  assignments={assignments}
                  privacyMode={privacyMode}
                />
              </motion.div>
            )}

            {currentView === 'Org' && (
              <motion.div
                key="org"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="h-full"
              >
                <OrgChartView 
                  members={finalFilteredMembers} 
                  teams={teams}
                  onUpdateMember={handleUpdateMember}
                  onEditMember={(m) => setEditingResource(m)}
                  privacyMode={privacyMode}
                />
              </motion.div>
            )}

            {currentView === 'Tasks' && (
              <motion.div
                key="tasks"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="h-full"
              >
                <TaskBoard 
                  todos={todos}
                  members={teamMembers}
                  projects={projects}
                  onUpdateTodo={handleUpdateTodo}
                  onDeleteTodo={handleDeleteTodo}
                  onAddTodo={handleAddTodo}
                  onEditMember={(m) => setEditingResource(m)}
                  privacyMode={privacyMode}
                />
              </motion.div>
            )}

            {currentView === 'Settings' && (
              <motion.div
                key="settings"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="h-full overflow-auto"
              >
                <SettingsView 
                  teams={teams}
                  projectGroups={projectGroups}
                  teamMembers={teamMembers}
                  projects={projects}
                  assignments={assignments}
                  comments={comments}
                  todos={todos}
                  onImportAll={handleImportAll}
                  onResetToDefault={handleResetToDefault}
                  onClearAll={handleClearAll}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Modals */}
        <AnimatePresence>
          {showAddResource && (
            <AddResourceModal 
              onClose={() => setShowAddResource(false)}
              onAddResource={handleAddSingleResource}
              onBulkAdd={handleAddBulkResource}
              teams={teams}
              teamMembers={teamMembers}
            />
          )}
          {showAddProject && (
            <AddProjectModal
              onClose={() => setShowAddProject(false)}
              onAddProject={handleAddSingleProject}
              onBulkAdd={handleAddBulkProject}
              projectGroups={projectGroups}
            />
          )}
          {showAddTeam && (
            <AddTeamModal
              onClose={() => setShowAddTeam(false)}
              onAddTeam={handleAddTeam}
              teams={teams}
            />
          )}
          {editingTeam && (
            <EditTeamModal
              team={editingTeam}
              onClose={() => setEditingTeam(null)}
              onUpdateTeam={handleUpdateTeam}
              teams={teams}
            />
          )}
          {editingResource && (
            <EditResourceModal
              resource={editingResource}
              onClose={() => setEditingResource(null)}
              onUpdate={handleUpdateMember}
              teams={teams}
              teamMembers={teamMembers}
              comments={comments}
              todos={todos}
              onAddComment={handleAddComment}
              onAddTodo={handleAddTodo}
              projects={projects}
              privacyMode={privacyMode}
            />
          )}
          {editingProject && (
            <EditProjectModal
              project={editingProject}
              onClose={() => setEditingProject(null)}
              onUpdate={handleUpdateProject}
              projectGroups={projectGroups}
              comments={comments}
              todos={todos}
              onAddComment={handleAddComment}
              onAddTodo={handleAddTodo}
              members={teamMembers}
              projects={projects}
              privacyMode={privacyMode}
            />
          )}
          {bulkEditIds && (
            <BulkEditModal
              onClose={() => setBulkEditIds(null)}
              onUpdate={handleApplyBulkEdit}
              teams={teams}
            />
          )}
        </AnimatePresence>

      </main>
    </div>
  );
}

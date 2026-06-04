import React, { useMemo, useState } from 'react';
import { TeamMember, Project, Assignment, AssignmentStatus, Comment } from '../types';
import { obfuscate } from '../lib/utils';
import { format, parseISO, min, max, differenceInDays, isValid } from 'date-fns';
import { Calendar, Briefcase, Clock, List, Layers, ChevronDown, ChevronRight, Plus, MessageSquare, Users } from 'lucide-react';

interface OpportunityDraft {
  name: string;
  probability: number;
  startDate: string;
  endDate: string;
}

interface RoleDraft {
  selectedMemberId: string;
  resource: string;
  role: string;
  hours: number;
  comment: string;
}

interface UpcomingDemandReportViewProps {
  members: TeamMember[];
  projects: Project[];
  assignments: Assignment[];
  comments: Comment[];
  onEditMember: (member: TeamMember) => void;
  onUpdateMember: (id: string, updates: Partial<TeamMember>) => void;
  onUpdateProject: (id: string, updates: Partial<Project>) => void;
  onCreateProject: (project: Project) => void;
  onAddAssignment: (memberId: string, projectId: string, hours: number, date: Date, mode: 'month' | 'week', status?: AssignmentStatus, startDate?: string, endDate?: string) => void;
  onCreateMemberAssignment: (member: TeamMember, assignment: Assignment) => void;
  onUpdateAssignment: (id: string, updates: Partial<Assignment>) => void;
  onAddComment: (comment: Omit<Comment, 'id' | 'createdAt' | 'authorId' | 'authorName'>) => Comment;
  privacyMode: boolean;
}

export default function UpcomingDemandReportView({ members, projects, assignments, comments, onEditMember, onUpdateMember, onUpdateProject, onCreateProject, onAddAssignment, onCreateMemberAssignment, onUpdateAssignment, onAddComment, privacyMode }: UpcomingDemandReportViewProps) {
  const [activeSubReport, setActiveSubReport] = useState<'opportunities' | 'timeline'>('opportunities');
  const [showNewOpportunity, setShowNewOpportunity] = useState(false);
  const [newOpportunity, setNewOpportunity] = useState<OpportunityDraft>({ name: '', probability: 50, startDate: '', endDate: '' });
  const [expandedProjects, setExpandedProjects] = useState<Record<string, boolean>>({});
  const [newRoleDrafts, setNewRoleDrafts] = useState<Record<string, RoleDraft>>({});
  const [roleEdits, setRoleEdits] = useState<Record<string, { resource: string; role: string; hours: number; selectedMemberId: string }>>({});
  const [opportunityComments, setOpportunityComments] = useState<Record<string, string>>({});
  const [roleComments, setRoleComments] = useState<Record<string, string>>({});

  const upcomingProjects = useMemo(() => projects.filter(project => project.upcoming), [projects]);

  const opportunityCount = upcomingProjects.length;
  const demandRowsCount = assignments.filter(a => upcomingProjects.some(p => p.id === a.projectId)).length || opportunityCount;
  const unassignedCount = opportunityCount - assignments.filter(a => upcomingProjects.some(p => p.id === a.projectId)).length;

  const projectAssignments = useMemo(() => {
    return upcomingProjects.reduce<Record<string, Assignment[]>>((acc, project) => {
      acc[project.id] = assignments.filter(a => a.projectId === project.id);
      return acc;
    }, {});
  }, [upcomingProjects, assignments]);

  const commentsByEntity = useMemo(() => {
    return comments.reduce<Record<string, Comment[]>>((acc, comment) => {
      if (!acc[comment.entityId]) acc[comment.entityId] = [];
      acc[comment.entityId].push(comment);
      return acc;
    }, {});
  }, [comments]);

  const updateDraft = (projectId: string, updates: Partial<RoleDraft>) => {
    setNewRoleDrafts(prev => ({
      ...prev,
      [projectId]: {
        selectedMemberId: updates.selectedMemberId ?? prev[projectId]?.selectedMemberId ?? '',
        resource: updates.resource ?? prev[projectId]?.resource ?? '',
        role: updates.role ?? prev[projectId]?.role ?? '',
        hours: updates.hours ?? prev[projectId]?.hours ?? 40,
        comment: updates.comment ?? prev[projectId]?.comment ?? ''
      }
    }));
  };

  const updateRoleEdit = (assignmentId: string, updates: Partial<{ resource: string; role: string; hours: number; selectedMemberId: string }>) => {
    setRoleEdits(prev => ({
      ...prev,
      [assignmentId]: {
        resource: updates.resource ?? prev[assignmentId]?.resource ?? '',
        role: updates.role ?? prev[assignmentId]?.role ?? '',
        hours: updates.hours ?? prev[assignmentId]?.hours ?? 40,
        selectedMemberId: updates.selectedMemberId ?? prev[assignmentId]?.selectedMemberId ?? ''
      }
    }));
  };

  const toggleExpanded = (projectId: string) => {
    setExpandedProjects(prev => ({ ...prev, [projectId]: !prev[projectId] }));
  };

  const saveOpportunity = () => {
    const newProject: Project = {
      id: `p-${Date.now()}`,
      name: newOpportunity.name || 'New Opportunity',
      client: 'TBD',
      color: '#4F46E5',
      upcoming: true,
      probability: newOpportunity.probability,
      startDate: newOpportunity.startDate || undefined,
      endDate: newOpportunity.endDate || undefined
    };
    onCreateProject(newProject);
    setNewOpportunity({ name: '', probability: 50, startDate: '', endDate: '' });
    setShowNewOpportunity(false);
    setExpandedProjects(prev => ({ ...prev, [newProject.id]: true }));
  };

  const saveNewRole = (project: Project) => {
    const draft = newRoleDrafts[project.id];
    if (!draft) return;

    if (draft.selectedMemberId && draft.selectedMemberId !== 'new') {
      onAddAssignment(draft.selectedMemberId, project.id, draft.hours, new Date(), 'week', 'Planned', project.startDate, project.endDate);
    } else {
      const placeholder: TeamMember = {
        id: `m-${Date.now()}`,
        name: draft.resource || 'Unidentified',
        role: draft.role || 'TBD',
        skills: [],
        capacity: 40,
        teamId: '',
        companyStartDate: undefined,
        employmentType: 'employee',
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${Date.now()}`,
        isPlaceholder: true,
        isFutureJoiner: false
      };
      const assignment: Assignment = {
        id: `a-${Date.now()}`,
        memberId: placeholder.id,
        projectId: project.id,
        hoursPerWeek: draft.hours,
        startDate: project.startDate || new Date().toISOString().slice(0, 10),
        endDate: project.endDate || project.startDate || new Date().toISOString().slice(0, 10),
        status: 'Planned',
        lastUpdated: new Date().toISOString()
      };
      onCreateMemberAssignment(placeholder, assignment);
    }

    if (draft.comment.trim()) {
      onAddComment({ entityId: project.id, text: draft.comment.trim() });
    }
    setNewRoleDrafts(prev => {
      const copy = { ...prev };
      delete copy[project.id];
      return copy;
    });
    setExpandedProjects(prev => ({ ...prev, [project.id]: true }));
  };

  const saveRoleEdits = (assignment: Assignment, member?: TeamMember) => {
    const edit = roleEdits[assignment.id];
    if (!edit || !member) return;

    if (edit.selectedMemberId && edit.selectedMemberId !== assignment.memberId && edit.selectedMemberId !== 'new') {
      onUpdateAssignment(assignment.id, { memberId: edit.selectedMemberId });
    }
    if (edit.role !== member.role) {
      onUpdateMember(member.id, { role: edit.role });
    }
    if (edit.hours !== assignment.hoursPerWeek) {
      onUpdateAssignment(assignment.id, { hoursPerWeek: edit.hours });
    }
  };

  const saveRoleComment = (assignmentId: string) => {
    const commentText = roleComments[assignmentId]?.trim();
    if (!commentText) return;
    onAddComment({ entityId: assignmentId, text: commentText });
    setRoleComments(prev => ({ ...prev, [assignmentId]: '' }));
  };

  const saveOpportunityComment = (projectId: string) => {
    const commentText = opportunityComments[projectId]?.trim();
    if (!commentText) return;
    onAddComment({ entityId: projectId, text: commentText });
    setOpportunityComments(prev => ({ ...prev, [projectId]: '' }));
  };

  const allMemberOptions = members.map(member => ({ id: member.id, label: member.name }));
  const getProjectCommentCount = (projectId: string) => (commentsByEntity[projectId] || []).length;
  const getAssignmentCommentCount = (assignmentId: string) => (commentsByEntity[assignmentId] || []).length;

  const timelineRange = useMemo(() => {
    const dates = upcomingProjects.flatMap(project => {
      const assignmentDates = projectAssignments[project.id]?.flatMap(a => [a.startDate, a.endDate]) || [];
      const startDates = assignmentDates.filter(Boolean).map(date => parseISO(date));
      const projectDates = [project.startDate, project.endDate].filter(Boolean).map(date => parseISO(date as string));
      return [...startDates, ...projectDates].filter((date): date is Date => date !== undefined && isValid(date));
    });

    if (dates.length === 0) return null;
    return { start: min(dates), end: max(dates) };
  }, [upcomingProjects, projectAssignments]);

  const getTimelineStyles = (startDate?: string, endDate?: string) => {
    if (!timelineRange || !startDate || !endDate) return { left: '0%', width: '100%' };
    const start = parseISO(startDate);
    const end = parseISO(endDate);
    const totalDays = Math.max(differenceInDays(timelineRange.end, timelineRange.start), 1);
    const offset = Math.max(differenceInDays(start, timelineRange.start), 0);
    const width = Math.max(differenceInDays(end, start) + 1, 1);
    return { left: `${Math.min((offset / totalDays) * 100, 100)}%`, width: `${Math.min((width / totalDays) * 100, 100)}%` };
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Upcoming Demand</h2>
          <p className="text-sm text-slate-500 mt-1">Track demand from upcoming projects in opportunity and timeline views.</p>
        </div>
        <div className="flex items-center gap-2 bg-slate-100 rounded-2xl p-2">
          <button
            onClick={() => setActiveSubReport('opportunities')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${activeSubReport === 'opportunities' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <List className="w-4 h-4 inline-block mr-2" />
            Opportunities
          </button>
          <button
            onClick={() => setActiveSubReport('timeline')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${activeSubReport === 'timeline' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <Layers className="w-4 h-4 inline-block mr-2" />
            Timeline
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center gap-2 text-slate-700 mb-3">
            <Briefcase className="w-4 h-4" />
            <h3 className="text-sm font-bold">Upcoming projects</h3>
          </div>
          <p className="text-3xl font-black text-slate-900">{opportunityCount}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center gap-2 text-slate-700 mb-3">
            <Calendar className="w-4 h-4" />
            <h3 className="text-sm font-bold">Demand entries</h3>
          </div>
          <p className="text-3xl font-black text-indigo-700">{demandRowsCount}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center gap-2 text-slate-700 mb-3">
            <Clock className="w-4 h-4" />
            <h3 className="text-sm font-bold">Unassigned opportunities</h3>
          </div>
          <p className="text-3xl font-black text-amber-700">{unassignedCount}</p>
        </div>
      </div>

      {activeSubReport === 'opportunities' ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Opportunity table</h3>
              <p className="text-xs text-slate-500 mt-1">Create upcoming opportunities, define roles, and assign resources in one place.</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowNewOpportunity(prev => !prev)}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition"
              >
                <Plus className="w-4 h-4" />
                Add opportunity
              </button>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">{opportunityCount} opportunities</div>
            </div>
          </div>

          {showNewOpportunity && (
            <div className="px-6 py-6 border-b border-slate-100 bg-slate-50">
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-3">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-400">Opportunity</label>
                  <input
                    type="text"
                    value={newOpportunity.name}
                    onChange={e => setNewOpportunity(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Opportunity name"
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-400">Probability</label>
                  <div className="mt-2 flex items-center gap-2">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={newOpportunity.probability}
                      onChange={e => setNewOpportunity(prev => ({ ...prev, probability: Number(e.target.value) }))}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none"
                    />
                    <span className="text-sm text-slate-500">%</span>
                  </div>
                </div>
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-400">Start</label>
                  <input
                    type="date"
                    value={newOpportunity.startDate}
                    onChange={e => setNewOpportunity(prev => ({ ...prev, startDate: e.target.value }))}
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-400">End</label>
                  <input
                    type="date"
                    value={newOpportunity.endDate}
                    onChange={e => setNewOpportunity(prev => ({ ...prev, endDate: e.target.value }))}
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    onClick={saveOpportunity}
                    className="w-full rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
                  >
                    Create opportunity
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4 px-6 py-5">
            {upcomingProjects.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-10 text-center text-slate-500">
                <p className="text-sm font-semibold">No upcoming opportunities yet.</p>
                <p className="mt-2 text-xs">Use the Add opportunity button to create a new upcoming project and add roles against it.</p>
              </div>
            ) : (
              upcomingProjects.map(project => {
                const assignmentsForProject = projectAssignments[project.id] || [];
                const expanded = !!expandedProjects[project.id];
                const projectCommentCount = getProjectCommentCount(project.id);

                return (
                  <div key={project.id} className="rounded-3xl border border-slate-200 bg-slate-50">
                    <div className="flex flex-col gap-2 border-b border-slate-200 px-5 py-4 md:flex-row md:items-center md:justify-between">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => toggleExpanded(project.id)}
                          className="rounded-full border border-slate-200 bg-white p-2 text-slate-500 transition hover:border-slate-300"
                        >
                          {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        </button>
                        <div>
                          <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-900">
                            <span>{obfuscate(project.name, privacyMode)}</span>
                            <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-bold text-slate-500">{project.probability ?? 'TBD'}%</span>
                          </div>
                          <div className="text-xs text-slate-500">
                            {project.startDate ? format(parseISO(project.startDate), 'MMM d') : 'TBD'} — {project.endDate ? format(parseISO(project.endDate), 'MMM d') : 'TBD'}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                        <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-2 shadow-sm">{assignmentsForProject.length} role{assignmentsForProject.length === 1 ? '' : 's'}</span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-2 shadow-sm">{projectCommentCount} notes</span>
                        <button
                          onClick={() => onUpdateProject(project.id, { probability: project.probability ?? 0 })}
                          className="rounded-full bg-slate-100 px-3 py-2 text-slate-700 transition hover:bg-slate-200"
                        >
                          Edit opportunity
                        </button>
                      </div>
                    </div>

                    {expanded && (
                      <div className="space-y-4 px-5 py-5">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                          <div>
                            <label className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-400">Opportunity name</label>
                            <input
                              type="text"
                              value={project.name}
                              onChange={e => onUpdateProject(project.id, { name: e.target.value })}
                              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-400">Probability</label>
                            <input
                              type="number"
                              min={0}
                              max={100}
                              value={project.probability ?? 0}
                              onChange={e => onUpdateProject(project.id, { probability: Number(e.target.value) })}
                              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-400">Comments</label>
                            <div className="mt-2 flex gap-2">
                              <input
                                type="text"
                                value={opportunityComments[project.id] ?? ''}
                                onChange={e => setOpportunityComments(prev => ({ ...prev, [project.id]: e.target.value }))}
                                placeholder="Add comment"
                                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none"
                              />
                              <button
                                onClick={() => saveOpportunityComment(project.id)}
                                className="rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700"
                              >
                                Save
                              </button>
                            </div>
                          </div>
                        </div>

                        <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="bg-slate-50/90 text-[10px] uppercase tracking-wider text-slate-400">
                                <th className="p-4">Role</th>
                                <th className="p-4">Resource</th>
                                <th className="p-4">Total Hours</th>
                                <th className="p-4">Status</th>
                                <th className="p-4">Comments</th>
                                <th className="p-4">Action</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {assignmentsForProject.map(assignment => {
                                const member = members.find(m => m.id === assignment.memberId);
                                const edit = roleEdits[assignment.id] || {
                                  resource: member?.name ?? '',
                                  role: member?.role ?? '',
                                  hours: assignment.hoursPerWeek,
                                  selectedMemberId: member?.id ?? 'new'
                                };
                                return (
                                  <tr key={assignment.id}>
                                    <td className="p-4 align-top">
                                      <input
                                        type="text"
                                        value={edit.role}
                                        onChange={e => updateRoleEdit(assignment.id, { role: e.target.value })}
                                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none"
                                      />
                                    </td>
                                    <td className="p-4 align-top space-y-2">
                                      <select
                                        value={edit.selectedMemberId}
                                        onChange={e => updateRoleEdit(assignment.id, { selectedMemberId: e.target.value })}
                                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none"
                                      >
                                        <option value="new">Unidentified resource</option>
                                        {allMemberOptions.map(option => (
                                          <option key={option.id} value={option.id}>{option.label}</option>
                                        ))}
                                      </select>
                                      {edit.selectedMemberId === 'new' && (
                                        <input
                                          type="text"
                                          value={edit.resource}
                                          onChange={e => updateRoleEdit(assignment.id, { resource: e.target.value })}
                                          placeholder="Unidentified name"
                                          className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none"
                                        />
                                      )}
                                    </td>
                                    <td className="p-4 align-top">
                                      <input
                                        type="number"
                                        min={1}
                                        value={edit.hours}
                                        onChange={e => updateRoleEdit(assignment.id, { hours: Number(e.target.value) })}
                                        className="w-24 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none"
                                      />
                                    </td>
                                    <td className="p-4 align-top text-sm font-semibold uppercase tracking-[0.12em] text-slate-700">{assignment.status}</td>
                                    <td className="p-4 align-top">
                                      <div className="space-y-2">
                                        <input
                                          type="text"
                                          value={roleComments[assignment.id] ?? ''}
                                          onChange={e => setRoleComments(prev => ({ ...prev, [assignment.id]: e.target.value }))}
                                          placeholder="Add comment"
                                          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none"
                                        />
                                        <button
                                          onClick={() => saveRoleComment(assignment.id)}
                                          className="rounded-2xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-800"
                                        >
                                          Save note
                                        </button>
                                      </div>
                                    </td>
                                    <td className="p-4 align-top text-right">
                                      <button
                                        onClick={() => saveRoleEdits(assignment, member)}
                                        className="rounded-2xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
                                      >
                                        Save
                                      </button>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-5 gap-3 items-end rounded-3xl border border-slate-200 bg-white p-4">
                          <div className="lg:col-span-2">
                            <label className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-400">Resource</label>
                            <select
                              value={newRoleDrafts[project.id]?.selectedMemberId ?? 'new'}
                              onChange={e => updateDraft(project.id, { selectedMemberId: e.target.value })}
                              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none"
                            >
                              <option value="new">Unidentified resource</option>
                              {allMemberOptions.map(option => (
                                <option key={option.id} value={option.id}>{option.label}</option>
                              ))}
                            </select>
                            {newRoleDrafts[project.id]?.selectedMemberId === 'new' && (
                              <input
                                type="text"
                                value={newRoleDrafts[project.id]?.resource ?? ''}
                                onChange={e => updateDraft(project.id, { resource: e.target.value })}
                                placeholder="Placeholder name"
                                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none"
                              />
                            )}
                          </div>
                          <div>
                            <label className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-400">Role</label>
                            <input
                              type="text"
                              value={newRoleDrafts[project.id]?.role ?? ''}
                              onChange={e => updateDraft(project.id, { role: e.target.value })}
                              placeholder="Role name"
                              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-400">Total hours</label>
                            <input
                              type="number"
                              min={1}
                              value={newRoleDrafts[project.id]?.hours ?? 40}
                              onChange={e => updateDraft(project.id, { hours: Number(e.target.value) })}
                              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-400">Comment</label>
                            <input
                              type="text"
                              value={newRoleDrafts[project.id]?.comment ?? ''}
                              onChange={e => updateDraft(project.id, { comment: e.target.value })}
                              placeholder="Role note"
                              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none"
                            />
                          </div>
                          <div className="flex items-center">
                            <button
                              onClick={() => saveNewRole(project)}
                              className="w-full rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
                            >
                              Add role
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Timeline view</h3>
              <p className="text-xs text-slate-500 mt-1">Visual demand bars for upcoming project entries.</p>
            </div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">{timelineRange ? format(timelineRange.start, 'MMM d') + ' – ' + format(timelineRange.end, 'MMM d') : 'No timeline'}</div>
          </div>
          <div className="px-6 py-4">
            {timelineRange ? (
              <div className="space-y-3">
                {demandRows.map((row, index) => {
                  const start = row.assignment?.startDate || row.project.startDate;
                  const end = row.assignment?.endDate || row.project.endDate;
                  const style = getTimelineStyles(start, end);
                  const resourceName = row.member ? obfuscate(row.member.name, privacyMode) : 'Unassigned';
                  return (
                    <div key={`${row.project.id}-tl-${index}`} className="space-y-2">
                      <div className="flex items-center justify-between text-sm font-semibold text-slate-700">
                        <span>{obfuscate(row.project.name, privacyMode)}</span>
                        <span className="text-slate-500">{resourceName}</span>
                      </div>
                      <div className="relative h-10 rounded-2xl bg-slate-100 overflow-hidden border border-slate-200">
                        <div className="absolute inset-y-0 left-0 bg-slate-200" style={{ width: style.left }} />
                        <div 
                          className={`absolute inset-y-1 rounded-xl ${row.assignment ? 'bg-indigo-500/90' : 'bg-amber-500/90'}`} 
                          style={{ left: style.left, width: style.width }}
                        />
                        <div className="absolute inset-y-0 right-0 w-px bg-slate-200" />
                        <div className="absolute inset-y-0 left-0 right-0 flex items-center justify-center text-[11px] font-black text-slate-700 pointer-events-none">
                          {start ? format(parseISO(start), 'MMM d') : 'TBD'} — {end ? format(parseISO(end), 'MMM d') : 'TBD'}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-6 text-center text-slate-500">No timeline data is available for upcoming demand.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { 
  Download, 
  Upload, 
  RefreshCw, 
  Trash2, 
  Check, 
  Copy, 
  AlertTriangle, 
  FileCode, 
  Info,
  Database,
  CheckCircle2,
  Lock
} from 'lucide-react';
import { 
  Team, 
  ProjectGroup, 
  TeamMember, 
  Project, 
  Assignment, 
  Comment, 
  Todo 
} from '../types';
import { MOCK_TEAMS, MOCK_PROJECT_GROUPS, MOCK_TEAM_MEMBERS, MOCK_PROJECTS, MOCK_ASSIGNMENTS } from '../mockData';

interface SettingsViewProps {
  teams: Team[];
  projectGroups: ProjectGroup[];
  teamMembers: TeamMember[];
  projects: Project[];
  assignments: Assignment[];
  comments: Comment[];
  todos: Todo[];
  onImportAll: (data: {
    teams?: Team[];
    projectGroups?: ProjectGroup[];
    teamMembers?: TeamMember[];
    projects?: Project[];
    assignments?: Assignment[];
    comments?: Comment[];
    todos?: Todo[];
  }) => void;
  onResetToDefault: () => void;
  onClearAll: () => void;
}

export default function SettingsView({
  teams,
  projectGroups,
  teamMembers,
  projects,
  assignments,
  comments,
  todos,
  onImportAll,
  onResetToDefault,
  onClearAll
}: SettingsViewProps) {
  const [dragActive, setDragActive] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'warning' | null; text: string | null }>({ type: null, text: null });
  const [copiedSchema, setCopiedSchema] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Generate Current Export Payload
  const currentPayload = {
    teams,
    projectGroups,
    teamMembers,
    projects,
    assignments,
    comments,
    todos,
    exportedAt: new Date().toISOString(),
    version: '1.2.0'
  };

  const currentPayloadString = JSON.stringify(currentPayload, null, 2);

  const handleExport = () => {
    try {
      const blob = new Blob([currentPayloadString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `resource-planner-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setStatusMessage({ type: 'success', text: 'Operational master data exported successfully!' });
    } catch (e) {
      console.error(e);
      setStatusMessage({ type: 'error', text: 'Failed to generate download. Please try again.' });
    }
  };

  const validateAndImport = (jsonText: string) => {
    try {
      const parsed = JSON.parse(jsonText);
      if (typeof parsed !== 'object' || parsed === null) {
        throw new Error('Imported JSON is not an object.');
      }

      // Check for minimal array validity
      const warnings: string[] = [];
      const arraysToCheck = ['teams', 'projectGroups', 'teamMembers', 'projects', 'assignments', 'comments', 'todos'];
      
      arraysToCheck.forEach(key => {
        if (parsed[key] !== undefined && !Array.isArray(parsed[key])) {
          warnings.push(`Key '${key}' is defined but is not a valid list.`);
        }
      });

      if (warnings.length > 0) {
        setStatusMessage({ type: 'error', text: `Malformed Schema: ${warnings.join(' ')}` });
        return;
      }

      // Safe initialization of missing structures
      const finalData = {
        teams: Array.isArray(parsed.teams) ? parsed.teams : [],
        projectGroups: Array.isArray(parsed.projectGroups) ? parsed.projectGroups : [],
        teamMembers: Array.isArray(parsed.teamMembers) ? parsed.teamMembers : [],
        projects: Array.isArray(parsed.projects) ? parsed.projects : [],
        assignments: Array.isArray(parsed.assignments) ? parsed.assignments : [],
        comments: Array.isArray(parsed.comments) ? parsed.comments : [],
        todos: Array.isArray(parsed.todos) ? parsed.todos : []
      };

      // Perform deep sanitization/verification of items to fit our data features format
      // Ensure recently introduced fields exist or are safely padded.
      finalData.teamMembers = finalData.teamMembers.map((m: any, idx: number) => {
        const id = m.id || `m-imported-${idx}`;
        return {
          id,
          name: m.name || `Resource ${idx + 1}`,
          role: m.role || 'Contributor',
          avatar: m.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${id}`,
          capacity: typeof m.capacity === 'number' ? m.capacity : 40,
          skills: Array.isArray(m.skills) ? m.skills : [],
          teamId: m.teamId || '',
          companyStartDate: m.companyStartDate || undefined,
          lastWorkingDay: m.lastWorkingDay || undefined,
          employmentType: m.employmentType || 'employee',
          managerId: m.managerId || undefined,
          isManager: m.isManager !== undefined ? Boolean(m.isManager) : false
        };
      });

      finalData.projects = finalData.projects.map((p: any, idx: number) => {
        return {
          id: p.id || `p-imported-${idx}`,
          name: p.name || `Project ${idx + 1}`,
          client: p.client || 'Client',
          color: p.color || '#4f46e5',
          startDate: p.startDate || undefined,
          endDate: p.endDate || undefined,
          type: p.type || 'Other',
          code: p.code || `PRJ-${idx + 100}`,
          pm: p.pm || undefined,
          pc: p.pc || undefined,
          groupId: p.groupId || null
        };
      });

      finalData.teams = finalData.teams.map((t: any, idx: number) => {
        return {
          id: t.id || `t-imported-${idx}`,
          name: t.name || `Team ${idx + 1}`,
          description: t.description || '',
          parentId: t.parentId || null
        };
      });

      finalData.assignments = finalData.assignments.map((a: any, idx: number) => {
        return {
          id: a.id || `a-imported-${idx}`,
          memberId: a.memberId || '',
          projectId: a.projectId || '',
          startDate: a.startDate || '',
          endDate: a.endDate || '',
          hoursPerWeek: typeof a.hoursPerWeek === 'number' ? a.hoursPerWeek : 40,
          status: a.status || 'Planned'
        };
      });

      finalData.projectGroups = finalData.projectGroups.map((pg: any, idx: number) => {
        return {
          id: pg.id || `pg-imported-${idx}`,
          name: pg.name || `Group ${idx + 1}`
        };
      });

      finalData.comments = finalData.comments.map((c: any, idx: number) => {
        return {
          id: c.id || `c-imported-${idx}`,
          authorId: c.authorId || 'admin',
          authorName: c.authorName || 'Admin',
          text: c.text || '',
          createdAt: c.createdAt || new Date().toISOString(),
          entityId: c.entityId || '',
          isTodo: c.isTodo !== undefined ? Boolean(c.isTodo) : undefined,
          todoId: c.todoId || undefined
        };
      });

      finalData.todos = finalData.todos.map((td: any, idx: number) => {
        return {
          id: td.id || `todo-imported-${idx}`,
          title: td.title || `Task ${idx + 1}`,
          description: td.description || undefined,
          status: td.status || 'Todo',
          priority: td.priority || 'Medium',
          dueDate: td.dueDate || undefined,
          assignedMemberIds: Array.isArray(td.assignedMemberIds) ? td.assignedMemberIds : [],
          projectIds: Array.isArray(td.projectIds) ? td.projectIds : [],
          memberIds: Array.isArray(td.memberIds) ? td.memberIds : [],
          createdAt: td.createdAt || new Date().toISOString(),
          completedAt: td.completedAt || undefined
        };
      });

      onImportAll(finalData);
      setStatusMessage({ 
        type: 'success', 
        text: `Data successfully imported! Load Stats: ${finalData.teamMembers.length} Resources, ${finalData.projects.length} Projects, ${finalData.teams.length} Teams, ${finalData.assignments.length} Allocations.` 
      });

    } catch (e: any) {
      console.error(e);
      setStatusMessage({ type: 'error', text: `Failed to import JSON: ${e.message || 'Malformed schema configuration.'}` });
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          validateAndImport(event.target.result as string);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          validateAndImport(event.target.result as string);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleCopySchema = () => {
    navigator.clipboard.writeText(schemaSample);
    setCopiedSchema(true);
    setTimeout(() => setCopiedSchema(false), 2000);
  };

  // Schema format representing our fully expanded models to answer user requirement
  const schemaSample = `{
  "teams": [
    {
      "id": "t1",
      "name": "Customer Experience Team",
      "description": "UX Design and Product Strategy & Alignment",
      "parentId": "t0"
    }
  ],
  "projectGroups": [
    {
      "id": "pg1",
      "name": "Acme Projects Division"
    }
  ],
  "teamMembers": [
    {
      "id": "m1",
      "name": "Sarah Chen",
      "role": "Senior UX Designer",
      "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
      "capacity": 40,
      "skills": [
        { "name": "Figma", "rating": 3 }
      ],
      "teamId": "t1",
      "companyStartDate": "2023-01-15",
      "lastWorkingDay": "2026-12-31",
      "employmentType": "employee",
      "managerId": "m12",
      "isManager": false
    }
  ],
  "projects": [
    {
      "id": "p1",
      "name": "Project Phoenix",
      "client": "Acme Corp",
      "color": "#4F46E5",
      "startDate": "2025-01-01",
      "endDate": "2026-12-31",
      "type": "Fixed Bid",
      "code": "PRJ-PHX",
      "pm": "John Wick",
      "pc": "Winston-HQ",
      "groupId": "pg1"
    }
  ],
  "assignments": [
    {
      "id": "a1",
      "memberId": "m1",
      "projectId": "p1",
      "startDate": "2026-01-01",
      "endDate": "2026-06-30",
      "hoursPerWeek": 30,
      "status": "Hard"
    }
  ],
  "comments": [
    {
      "id": "c1",
      "authorId": "m12",
      "authorName": "William",
      "text": "Requires design signoff.",
      "createdAt": "2026-05-18T12:00:00Z",
      "entityId": "m1"
    }
  ],
  "todos": [
    {
      "id": "todo1",
      "title": "Establish Wireframes",
      "description": "Perform preliminary user tests",
      "status": "Todo",
      "priority": "High",
      "dueDate": "2026-06-01",
      "assignedMemberIds": ["m1"],
      "projectIds": ["p1"],
      "memberIds": ["m1"],
      "createdAt": "2026-05-18T10:00:00Z"
    }
  ]
}`;

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      {/* Header and Title */}
      <div>
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <Database className="w-6 h-6 text-indigo-600" />
          Workspace Management & Master Data Settings
        </h2>
        <p className="text-xs text-slate-500 font-semibold mt-1 uppercase tracking-wider">
          Export, Import, validate, and reset workspace collections perfectly.
        </p>
      </div>

      {/* Database Quick Health Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {[
          { label: 'Teams', count: teams.length, color: 'bg-indigo-50 text-indigo-700' },
          { label: 'Groups', count: projectGroups.length, color: 'bg-pink-50 text-pink-700' },
          { label: 'Resources', count: teamMembers.length, color: 'bg-teal-50 text-teal-700' },
          { label: 'Projects', count: projects.length, color: 'bg-amber-50 text-amber-700' },
          { label: 'Allocations', count: assignments.length, color: 'bg-emerald-50 text-emerald-700' },
          { label: 'Comments', count: comments.length, color: 'bg-violet-50 text-violet-700' },
          { label: 'Tasks', count: todos.length, color: 'bg-sky-50 text-sky-700' },
        ].map((db) => (
          <div key={db.label} className="bg-white px-4 py-3 rounded-xl border border-slate-100 shadow-sm text-center">
            <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-md ${db.color}`}>
              {db.count}
            </span>
            <p className="text-xs font-bold text-slate-500 mt-2 truncate">{db.label}</p>
          </div>
        ))}
      </div>

      {statusMessage.text && (
        <div className={`p-4 rounded-xl flex items-start gap-3 border ${
          statusMessage.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 
          statusMessage.type === 'warning' ? 'bg-amber-50 border-amber-200 text-amber-800' :
          'bg-rose-50 border-rose-200 text-rose-800'
        }`}>
          {statusMessage.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertTriangle className="w-5 h-5 shrink-0" />}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider">{statusMessage.type}</p>
            <p className="text-xs font-medium mt-0.5">{statusMessage.text}</p>
          </div>
        </div>
      )}

      {/* Primary Action Panel */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Export Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                <Download className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-slate-800">Export Application Data</h3>
            </div>
            <p className="text-xs text-slate-500 font-medium leading-relaxed mb-4">
              Download a complete JSON configuration file representing teams, projects, resources, allocation bounds, comments logs, and tasks logs. Use this file as a complete snapshot to revive states anytime.
            </p>
          </div>
          <button
            onClick={handleExport}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white py-2.5 px-4 rounded-xl text-xs font-bold transition-all shadow-md shadow-slate-100 flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            Download Master Data.json
          </button>
        </div>

        {/* Import Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
              <Upload className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-slate-800">Import Master Data</h3>
          </div>
          <p className="text-xs text-slate-500 font-medium leading-relaxed mb-4">
            Import a custom JSON payload schema. Any missing records will be safely initialised with intelligent default configuration structures.
          </p>

          <div
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`cursor-pointer border-2 border-dashed rounded-xl p-5 text-center transition-all ${
              dragActive ? 'border-indigo-600 bg-indigo-50/20' : 'border-slate-200 hover:border-indigo-500 hover:bg-slate-50/50'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept="application/json"
              className="hidden"
            />
            <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-700">Drag & Drop master JSON file here</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Or click to browse your desktop</p>
          </div>
        </div>
      </div>

      {/* Master JSON Structure Reference & Field Validation Guides */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <FileCode className="w-4 h-4 text-indigo-600" />
              "Always Ready" JSON Schema Structure Reference
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Includes recently implemented metrics, role fields, and managers references (`employmentType`, `managerId`, etc.).
            </p>
          </div>
          <button
            onClick={handleCopySchema}
            className="text-xs font-bold text-slate-600 hover:text-indigo-600 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 transition-all flex items-center gap-1.5 self-start sm:self-auto"
          >
            {copiedSchema ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            {copiedSchema ? 'Copied Schema' : 'Copy Template Schema'}
          </button>
        </div>

        <div className="text-xs text-slate-600 space-y-2 leading-relaxed font-medium">
          <p className="flex items-center gap-1 text-[11px] font-bold uppercase text-slate-400 bg-slate-50 px-2.5 py-1 rounded inline-block">
            <Info className="w-3.5 h-3.5 text-indigo-500" /> Real-time fields synced on development:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-slate-500 text-[11px]">
            <li><strong className="text-slate-700">teamMembers</strong> features <code className="bg-slate-100 px-1 py-0.5 rounded text-indigo-600 font-mono">employmentType</code> (employee, contractor, intern), <code className="bg-slate-100 px-1 py-0.5 rounded text-indigo-600 font-mono">managerId</code> for parent organigrams, and <code className="bg-slate-100 px-1 py-0.5 rounded text-indigo-600 font-mono">isManager</code>.</li>
            <li><strong className="text-slate-700">todos</strong> features <code className="bg-slate-100 px-1 py-0.5 rounded text-indigo-600 font-mono">completedAt</code> timestamps, priority flags, and assigned resources/projects arrays.</li>
            <li><strong className="text-slate-700">assignments</strong> properties maps allocations bounds (<code className="bg-slate-100 px-1 py-0.5 rounded text-indigo-600 font-mono">hoursPerWeek</code>, <code className="bg-slate-100 px-1 py-0.5 rounded text-indigo-600 font-mono">status</code>) strictly.</li>
          </ul>
        </div>

        <div className="rounded-xl overflow-hidden border border-slate-200 max-h-72 overflow-y-auto">
          <pre className="p-4 bg-slate-50 text-[11px] font-mono text-slate-600 leading-snug select-all">
            {schemaSample}
          </pre>
        </div>
      </div>

      {/* Dangerous Operations Zone */}
      <div className="bg-rose-50/50 p-6 rounded-2xl border border-rose-100 shadow-sm space-y-4">
        <div>
          <h3 className="font-bold text-rose-900 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-600" />
            Dangerous Operations Area
          </h3>
          <p className="text-xs text-rose-700 font-semibold mt-0.5">
            Destructive actions affecting local database collections. Ensure any critical workflows have been backed up via JSON first.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => {
              if (window.confirm('Reset workspace to the default high-fidelity mock operational datasets?')) {
                onResetToDefault();
                setStatusMessage({ type: 'success', text: 'Database reset to default settings successfully.' });
              }
            }}
            className="flex-1 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 py-2.5 px-4 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4 text-slate-500" />
            Reset to High-Fidelity Mock Data
          </button>
          
          <button
            onClick={() => {
              if (window.confirm('Construct an empty baseline? This will clear all resources, assignments, and tasks.')) {
                onClearAll();
                setStatusMessage({ type: 'warning', text: 'All operational master data records cleared completed.' });
              }
            }}
            className="flex-1 bg-rose-600 hover:bg-rose-700 text-white py-2.5 px-4 rounded-xl text-xs font-bold transition-all shadow-md shadow-rose-100 flex items-center justify-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Wipe Entire Database (Empty Slate)
          </button>
        </div>
      </div>
    </div>
  );
}

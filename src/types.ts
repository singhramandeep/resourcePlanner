/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Team {
  id: string;
  name: string;
  description: string;
  parentId?: string | null;
}

export type SkillRating = 1 | 2 | 3;

export interface Skill {
  name: string;
  rating: SkillRating;
}

export type EmploymentType = 'employee' | 'intern' | 'contractor';

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  avatar: string;
  capacity: number; // Max hours per week, e.g., 40
  skills: Skill[];
  teamId: string;
  companyStartDate?: string;
  lastWorkingDay?: string;
  employmentType?: EmploymentType;
  managerId?: string;
  isManager?: boolean;
}

export type ProjectType = 'T&M' | 'Fixed Bid' | 'Milestone based' | 'Other';

export interface ProjectGroup {
  id: string;
  name: string;
}

export interface Project {
  id: string;
  name: string;
  client: string;
  color: string;
  startDate?: string;
  endDate?: string;
  type?: ProjectType;
  code?: string;
  pm?: string;
  pc?: string;
  groupId?: string | null;
}

export type AssignmentStatus = 'Hard' | 'Soft' | 'Pending' | 'Planned';
export type TodoStatus = 'Todo' | 'Backlog' | 'In Progress' | 'Done';
export type TodoPriority = 'Low' | 'Medium' | 'High' | 'Critical';

export interface Comment {
  id: string;
  authorId: string;
  authorName: string;
  text: string;
  createdAt: string;
  entityId: string; // memberId or projectId
  isTodo?: boolean;
  todoId?: string;
}

export interface Todo {
  id: string;
  title: string;
  description?: string;
  status: TodoStatus;
  priority: TodoPriority;
  dueDate?: string;
  assignedMemberIds: string[]; // Tagged people to notify
  projectIds: string[]; // Associated projects
  memberIds: string[]; // Associated resources
  createdAt: string;
  completedAt?: string;
}

export interface Assignment {
  id: string;
  memberId: string;
  projectId: string;
  startDate: string;
  endDate: string;
  hoursPerWeek: number;
  status: AssignmentStatus;
}

export type ViewType = 'Dashboard' | 'Grid' | 'Team' | 'Projects' | 'Bench' | 'Org' | 'Tasks' | 'Settings' | 'Contractors' | 'Interns' | 'Forecast';

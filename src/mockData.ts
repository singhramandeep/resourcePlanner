/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TeamMember, Project, Assignment, Team, ProjectGroup } from './types';

export const MOCK_PROJECT_GROUPS: ProjectGroup[] = [
  { id: 'pg1', name: 'Leviton Projects' },
  { id: 'pg2', name: 'Internal' },
];

export const MOCK_TEAMS: Team[] = [
  { id: 't0', name: 'CX-QE', description: 'Combined CX and QE Operations' },
  { id: 't1', name: 'CX Team', description: 'Customer Experience and Design', parentId: 't0' },
  { id: 't2', name: 'QE Team', description: 'Quality Engineering and Testing', parentId: 't0' },
  { id: 't3', name: 'Platform Team', description: 'Infrastructure and Backend' },
];

export const MOCK_TEAM_MEMBERS: TeamMember[] = [
  { id: 'm12', name: 'William Martinez', role: 'Product Lead', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=William', capacity: 40, skills: [{name: 'Strategy', rating: 3}, {name: 'Roadmapping', rating: 3}, {name: 'Analytics', rating: 2}], teamId: 't1', companyStartDate: '2022-03-25', employmentType: 'employee', isManager: true },
  { id: 'm1', name: 'Sarah Chen', role: 'Senior UX Designer', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah', capacity: 40, skills: [{name: 'UI Design', rating: 3}, {name: 'Figma', rating: 3}, {name: 'UX Research', rating: 2}], teamId: 't1', companyStartDate: '2022-01-15', employmentType: 'employee', managerId: 'm12' },
  { id: 'm2', name: 'Marcus Rodriguez', role: 'Frontend Architect', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Marcus', capacity: 40, skills: [{name: 'React', rating: 3}, {name: 'TypeScript', rating: 3}, {name: 'Node.js', rating: 2}], teamId: 't1', companyStartDate: '2021-06-20', lastWorkingDay: '2026-06-30', employmentType: 'employee', managerId: 'm12' },
  { id: 'm3', name: 'Elena Gilbert', role: 'Product Manager', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Elena', capacity: 40, skills: [{name: 'Agile', rating: 3}, {name: 'Jira', rating: 2}, {name: 'Stakeholder Management', rating: 3}], teamId: 't1', companyStartDate: '2023-03-10', employmentType: 'employee', managerId: 'm12' },
  { id: 'm4', name: 'David Kim', role: 'Full Stack Developer', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=David', capacity: 40, skills: [{name: 'Next.js', rating: 3}, {name: 'PostgreSQL', rating: 2}, {name: 'AWS', rating: 1}], teamId: 't3', companyStartDate: '2022-11-05', employmentType: 'employee', isManager: true },
  { id: 'm6', name: 'James Wilson', role: 'Backend Dev', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=James', capacity: 40, skills: [{name: 'GraphQL', rating: 2}, {name: 'Go', rating: 3}, {name: 'Redis', rating: 2}], teamId: 't3', companyStartDate: '2021-02-28', employmentType: 'employee', managerId: 'm4' },
  { id: 'm8', name: 'Lucas Brown', role: 'DevOps', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Lucas', capacity: 40, skills: [{name: 'Docker', rating: 3}, {name: 'K8s', rating: 2}, {name: 'CI/CD', rating: 3}], teamId: 't3', companyStartDate: '2023-01-20', employmentType: 'employee', managerId: 'm4' },
  { id: 'm10', name: 'Oliver Miller', role: 'Data Scientist', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Oliver', capacity: 40, skills: [{name: 'Python', rating: 3}, {name: 'Pandas', rating: 3}, {name: 'ML', rating: 2}], teamId: 't3', companyStartDate: '2021-11-15', employmentType: 'employee', managerId: 'm4' },
  { id: 'm14', name: 'Benjamin Clark', role: 'Security Eng', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Benjamin', capacity: 40, skills: [{name: 'PenTesting', rating: 3}, {name: 'IAM', rating: 3}, {name: 'Compliance', rating: 2}], teamId: 't3', companyStartDate: '2022-08-10', employmentType: 'employee', managerId: 'm4' },
  { id: 'm5', name: 'Maya Patel', role: 'Quality Engineer', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Maya', capacity: 40, skills: [{name: 'Jest', rating: 3}, {name: 'Cypress', rating: 3}, {name: 'QA Automation', rating: 2}], teamId: 't2', companyStartDate: '2023-08-14', employmentType: 'employee', isManager: true },
  { id: 'm17', name: 'Alex Rivera', role: 'QA Contractor', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex', capacity: 40, skills: [{name: 'Manual Testing', rating: 3}], teamId: 't2', companyStartDate: '2026-02-01', employmentType: 'contractor', managerId: 'm5' },
  { id: 'm7', name: 'Sophie Taylor', role: 'Designer', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sophie', capacity: 40, skills: [{name: 'Illustration', rating: 3}, {name: 'Branding', rating: 2}, {name: 'Adobe CC', rating: 3}], teamId: 't1', companyStartDate: '2022-05-12', employmentType: 'employee', managerId: 'm12' },
  { id: 'm9', name: 'Emma Davis', role: 'UI Artist', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emma', capacity: 40, skills: [{name: 'Three.js', rating: 2}, {name: 'Unity', rating: 3}, {name: 'Blender', rating: 2}], teamId: 't1', companyStartDate: '2022-09-01', employmentType: 'employee', managerId: 'm12' },
  { id: 'm11', name: 'Isabella Garcia', role: 'Mobile Dev', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Isabella', capacity: 40, skills: [{name: 'React Native', rating: 3}, {name: 'Swift', rating: 2}, {name: 'Kotlin', rating: 2}], teamId: 't3', companyStartDate: '2023-04-01', employmentType: 'employee', managerId: 'm4' },
  { id: 'm13', name: 'Mia Robinson', role: 'Content Strategist', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mia', capacity: 40, skills: [{name: 'Copywriting', rating: 3}, {name: 'SEO', rating: 2}, {name: 'Marketing', rating: 3}], teamId: 't1', companyStartDate: '2023-07-01', employmentType: 'employee', managerId: 'm12' },
  { id: 'm15', name: 'Charlotte Lewis', role: 'Systems Arch', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Charlotte', capacity: 40, skills: [{name: 'Microservices', rating: 3}, {name: 'System Design', rating: 3}, {name: 'Scalability', rating: 2}], teamId: 't3', companyStartDate: '2021-05-30', lastWorkingDay: '2026-05-31', employmentType: 'employee', managerId: 'm4' },
  { id: 'm16', name: 'Zoe Vent', role: 'UX Intern', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Zoe', capacity: 20, skills: [{name: 'Figma', rating: 2}], teamId: 't1', companyStartDate: '2026-05-01', employmentType: 'intern', managerId: 'm12' },
];

export const MOCK_PROJECTS: Project[] = [
  { id: 'p1', name: 'Project Phoenix', client: 'Acme Corp', color: '#4F46E5', startDate: '2025-01-01', endDate: '2026-12-31', type: 'Fixed Bid', code: 'PRJ-PHX', pm: 'John Wick', pc: 'Winston', groupId: 'pg1' },
  { id: 'p2', name: 'Solar Horizon', client: 'EcoSolutions', color: '#0891B2', startDate: '2025-06-01', endDate: '2026-06-30', type: 'T&M', code: 'SOL-HOR', pm: 'Sherlock Holmes', pc: 'Watson', groupId: 'pg1' },
  { id: 'p3', name: 'Quantum Ledger', client: 'Future Finance', color: '#059669', startDate: '2026-01-01', endDate: '2026-09-30', type: 'Milestone based', code: 'QUA-LED', pm: 'Tony Stark', pc: 'Jarvis', groupId: 'pg1' },
  { id: 'p4', name: 'Nebula App', client: 'Starlight Tech', color: '#7C3AED', startDate: '2025-11-01', endDate: '2027-06-30', type: 'Other', code: 'NEB-APP', pm: 'Bruce Wayne', pc: 'Alfred' },
  { id: 'p5', name: 'Internal Audit', client: 'Corporate', color: '#64748B', startDate: '2026-03-01', endDate: '2026-11-30', type: 'T&M', code: 'INT-AUD', pm: 'Clark Kent', pc: 'Lois Lane', groupId: 'pg2', upcoming: true, probability: 60 },
  { id: 'p6', name: 'Quantum Ledger (Preview)', client: 'Future Finance', color: '#059669', startDate: '2026-10-01', endDate: '2027-03-30', type: 'Milestone based', code: 'QUA-LED-PRV', pm: 'Tony Stark', pc: 'Jarvis', groupId: null, upcoming: true, probability: 30 },
];

export const MOCK_ASSIGNMENTS: Assignment[] = [
  { id: 'a1', memberId: 'm1', projectId: 'p1', startDate: '2026-01-01', endDate: '2026-03-31', hoursPerWeek: 30, status: 'Hard' },
  { id: 'a2', memberId: 'm1', projectId: 'p2', startDate: '2026-04-01', endDate: '2026-12-31', hoursPerWeek: 20, status: 'Soft' },
  { id: 'a3', memberId: 'm2', projectId: 'p1', startDate: '2026-01-01', endDate: '2026-06-30', hoursPerWeek: 40, status: 'Hard' },
  { id: 'a4', memberId: 'm3', projectId: 'p3', startDate: '2026-02-01', endDate: '2026-08-31', hoursPerWeek: 35, status: 'Pending' },
  { id: 'a5', memberId: 'm4', projectId: 'p4', startDate: '2026-05-01', endDate: '2026-05-31', hoursPerWeek: 40, status: 'Planned' },
  { id: 'a6', memberId: 'm5', projectId: 'p1', startDate: '2026-01-01', endDate: '2026-12-31', hoursPerWeek: 40, status: 'Hard' },
  { id: 'a7', memberId: 'm6', projectId: 'p2', startDate: '2026-03-01', endDate: '2026-09-30', hoursPerWeek: 30, status: 'Soft' },
  { id: 'a8', memberId: 'm7', projectId: 'p4', startDate: '2026-06-01', endDate: '2026-12-31', hoursPerWeek: 15, status: 'Pending' },
  { id: 'a9', memberId: 'm8', projectId: 'p5', startDate: '2026-01-01', endDate: '2026-12-31', hoursPerWeek: 40, status: 'Hard' },
];

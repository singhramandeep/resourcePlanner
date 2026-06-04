# Project Structure

This repository is a single-page application built with React, TypeScript, and Vite.

## Key files and folders

- `index.html` — static HTML shell and entry point for the Vite app.
- `package.json` — dependency definitions, scripts, and project metadata.
- `vite.config.ts` — Vite configuration, plugin setup, aliasing, and environment variable definitions.
- `tsconfig.json` — TypeScript compiler configuration.
- `src/main.tsx` — application bootstrap, mounting `App` into the DOM.
- `src/App.tsx` — core app shell, state orchestration, current view switching, persistent local storage, and modal management.
- `src/types.ts` — domain model for teams, resources, projects, assignments, comments, todos, and view state.
- `src/mockData.ts` — seeded sample data for teams, projects, team members, and assignments.
- `src/components/` — feature screens, UI layout, dialogs, and report views.

## Application structure

- `App` is the top-level controller and global client-side state source.
- UI is divided into a sidebar, header, view container, and modal overlays.
- Navigation is implemented through `currentView` state rather than URL routing.
- User data is persisted in browser `localStorage` for teams, projects, assignments, comments, todos, and settings.

## View modules

- `Sidebar` — navigation, team/project selection, and quick actions.
- `Header` — search, add resource/project buttons, privacy toggle, and date display.
- `ResourceGrid` — visual resource planning dashboard.
- `TeamMembersView` — team and employment-type grouping with member details.
- `ProjectsView` — project listing with group filtering.
- `BenchView` — bench and unassigned resource tracking.
- `OrgChartView` — organizational hierarchy display.
- `TaskBoard` — task and todo management.
- `ForecastView` — resource forecast analytics.
- `EmploymentReportView` — reporting for employment state, contractors, and interns.
- `SettingsView` — data import/export, reset, and app preferences.

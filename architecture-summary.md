# Architecture Summary

This project is a single-page client-side application with a centralized state container in `src/App.tsx`.

## High-level architecture

- `src/main.tsx` mounts the React app into the DOM.
- `src/App.tsx` is the root app shell and state manager.
- UI is composed of a fixed `Sidebar`, top `Header`, and a content area that renders view components based on `currentView`.
- Navigation is state-driven rather than URL-driven: `currentView` determines which screen renders.

## Component organization

- `src/components/Sidebar.tsx` handles navigation, team/project selection, and view toggles.
- `src/components/Header.tsx` provides search, add actions, privacy toggle, and date display.
- Feature views are implemented in separate components:
  - `ResourceGrid`
  - `ReportingView`
  - `TeamMembersView`
  - `ProjectsView`
  - `BenchView`
  - `OrgChartView`
  - `TaskBoard`
  - `ForecastView`
  - `EmploymentReportView`
  - `SettingsView`
- Modal components support create/edit workflows for resources, projects, teams, and bulk actions.

## State and persistence

- `App.tsx` maintains application state for:
  - `teams`, `projectGroups`, `teamMembers`, `projects`, `assignments`
  - `comments`, `todos`, `user`
  - UI settings like `currentYear`, `viewMode`, `privacyMode`, `selectedTeamId`, and `selectedProjectId`
- State persists to `localStorage` after every relevant update.
- The app uses `useEffect` hooks to synchronize local state into storage.

## UI pattern

- The application follows a component-driven layout with state lifted to the top-level container.
- Views are conditionally rendered instead of using a router.
- The sidebar provides dynamic children lists based on current team/project data.

## Notable architectural observations

- There is no backend API integration in the current repo.
- The app is optimized for client-side interactivity and in-browser persistence.
- Existing dependencies include packages that are not yet used by the UI, such as `express` and `@google/genai`, which may point to future extension areas.

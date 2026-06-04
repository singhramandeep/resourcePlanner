# Resource Planner SaaS

A browser-based resource planning dashboard built with React, Vite, Tailwind CSS and TypeScript.

The app helps teams manage projects, assign resources, track bench capacity, view organizational structure, and forecast staffing.

## Features

- Resource grid with project assignments and capacity tracking
- Team and project management with nested team structure and project groups
- Bench view for idle resource visibility
- Org chart and task board modes for planning and collaboration
- Reporting views for contractors, interns, and forecasts
- Search, quick add, edit, and privacy mode controls
- Local state persistence using `localStorage`

## Included Views

- **Dashboard** — overview and quick status
- **Resource Grid** — resource availability and assignments
- **Team Members** — detailed team member management
- **Projects** — project details, clients, and statuses
- **Bench** — view unassigned or underutilized resources
- **Org Structure** — hierarchical team organization
- **Tasks** — todo and task board management
- **Forecast** — resource planning outlook
- **Settings** — app preferences and profile management

## Tech Stack

- React 19
- Vite 6
- TypeScript
- Tailwind CSS 4
- Framer Motion
- Recharts
- Lucide React icons

## Getting Started

### Prerequisites

- Node.js 20+ recommended

### Install dependencies

```bash
npm install
```

### Run locally

```bash
npm run dev
```

Open the local development URL shown by Vite, typically:

```text
http://localhost:3000
```

If the port is already in use, Vite may prompt to use a different port.

### Build for production

```bash
npm run build
```

### Validate types

```bash
npm run lint
```

## Project Structure

- `src/App.tsx` — app shell, view routing, local state, and persistence
- `src/components/` — UI views, modals, sidebar, header, and dashboards
- `src/types.ts` — domain model for resources, projects, assignments, comments, and todos
- `src/mockData.ts` — sample data for teams, resources, projects, and assignments

> Note: data is stored in browser `localStorage`, so changes persist between sessions unless cleared.

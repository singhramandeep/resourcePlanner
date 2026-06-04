# Tech Stack

This project is built as a modern front-end SPA.

## Core frameworks and tools

- React 19 — UI component library and declarative rendering.
- Vite 6 — fast development server and build tool.
- TypeScript 5.8 — typed JavaScript with compile-time validation.
- Tailwind CSS 4 — utility-first styling framework.
- Framer Motion — animations and transitions.
- Recharts — charting and dashboard visualizations.
- Lucide React — icon library.

## Dependencies

- `@google/genai` — AI-related dependency included in package.json, though the current codebase does not expose explicit AI flows in the UI.
- `clsx` — conditional class name composition.
- `date-fns` — date manipulation and formatting.
- `dotenv` — environment variable support in Vite.
- `express` — included as a dependency but not currently used by the client-side application.
- `react-easy-crop` — image crop UI component.
- `tailwind-merge` — merging Tailwind utility classes.

## Build and development tooling

- `@vitejs/plugin-react` — React plugin for Vite.
- `@tailwindcss/vite` — Tailwind CSS plugin for Vite.
- TypeScript compiler (`tsc`) for type-checking via `npm run lint`.
- `tsx` — TypeScript execution runtime.

## Observations

- The app is a front-end-only SPA with no backend project files or API layer in this repository.
- Deployment should target static hosting or a CDN after running `npm run build`.
- Because `express` is present in dependencies, there may be future plans or vestigial support for a Node/Express server, but it is not consumed by the current app source.

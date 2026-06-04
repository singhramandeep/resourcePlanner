# Deployment

This repository does not include deployment-specific configuration files.

## What is available

- `npm run build` — builds the static production bundle.
- `npm run preview` — previews the built app locally.
- `vite.config.ts` — Vite app configuration for development and build.

## Missing deployment artifacts

- No `Dockerfile`.
- No CI/CD pipeline definitions.
- No cloud IaC manifests or host-specific deployment scripts.

## Deployment recommendation

For a SPA like this, deploy the generated static assets from `dist/` to a static host.

### Suggested hosting options

- Vercel
- Netlify
- GitHub Pages
- Azure Static Web Apps

### Basic deployment flow

1. `npm install`
2. `npm run build`
3. Publish the `dist/` folder to your chosen static host

## Notes

- The app uses client-side `localStorage` rather than a server-side database, so deployment is mostly about serving static assets.
- If future versions add API integration, you will need to add backend deployment configuration as well.

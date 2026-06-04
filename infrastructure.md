# Infrastructure

This repository contains only the client-side application for a React/Vite SPA.

## Current infrastructure state

- No backend service code is present in the repository.
- There is no Dockerfile, Kubernetes manifest, or cloud infrastructure definition.
- The app is designed to run as a static web application after building with Vite.

## Deployment targets

Suitable hosting targets include:

- Static site hosts (Netlify, Vercel, GitHub Pages, Azure Static Web Apps)
- CDN-backed static hosting with a modern build pipeline

## Environment support

- `vite.config.ts` defines `process.env.GEMINI_API_KEY` from environment variables.
- There is no `.env` file in the repository, and no backend runtime presently consumes this value.

## Recommended infrastructure additions

- Add a CI workflow for `npm install`, `npm run lint`, and `npm run build`.
- Add a simple static deployment pipeline for the generated `dist/` folder.
- If the app requires server-side data, add an explicit API service and environment configuration separate from the client bundle.

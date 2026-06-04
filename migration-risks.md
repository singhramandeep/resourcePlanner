# Migration Risks

This repository is a front-end SPA, so migration risk is primarily around build/dependency compatibility and client-side state behavior.

## Top risks

- `React 19` and `Vite 6` compatibility: ensure all dependencies are compatible with the current React and Vite versions before upgrading.
- Tailwind CSS 4 adoption: component classes are tightly bound to current Tailwind utility names, so style refactors should preserve class semantics.
- `localStorage` schema changes: the app persists multiple collections directly to `localStorage`. Changing entity shapes could invalidate stored user data.
- Unused or extraneous dependencies: `express` and `@google/genai` are present in `package.json` but not clearly used by the client code. This may indicate drift or an incomplete migration path.
- No automated test coverage: absence of tests increases risk for layout, logic, and state regression during migration.

## Specific migration concerns

- If adding real backend support, the current architecture will need explicit API and data-fetching layers.
- Introducing URL routing would require a moderate refactor because current view selection is handled by `currentView` state.
- Replacing local persistence with server persistence requires migration of saved local state or introduction of import/export flows.

## Recommendations

- Add a small automated test suite before major dependency upgrades.
- Document the `localStorage` data format and establish upgrade helpers for stored entities.
- Remove unused dependencies or verify whether they are intended for a future server-side layer.

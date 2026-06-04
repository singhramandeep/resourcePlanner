# Test Coverage

There is currently no automated test coverage in this repository.

## Evidence

- No `*.test.*`, `*.spec.*`, or `vitest.config.*` files are present.
- `package.json` contains no test runner dependencies such as `vitest`, `jest`, or `react-testing-library`.
- Scripts include `lint` and `build` but no `test` script.

## Coverage gaps

- Component rendering and UI state transitions are not covered.
- View switching and modal workflows are not validated.
- Data persistence behavior for `localStorage` is not tested.
- Edge cases for empty team/project/assignment data are not covered.

## Recommended additions

- Add unit tests for `src/App.tsx` and core components like `Sidebar`, `Header`, `ResourceGrid`, and `ProjectsView`.
- Add integration or snapshot tests for the main app flow.
- Use a test runner such as `Vitest` with `@testing-library/react` for React component tests.
- Add a `test` script and CI integration to prevent regressions during upgrades.

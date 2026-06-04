# Data Model

The app stores its data in browser-local state with types defined in `src/types.ts`.

## Domain entities

### `Team`
- `id`, `name`, `description`
- optional `parentId` for nested team hierarchies

### `TeamMember`
- `id`, `name`, `role`, `avatar`
- `capacity` — available hours per week
- `skills` — list of skill objects with `name` and `rating`
- `teamId` — association to a `Team`
- optional `companyStartDate`, `lastWorkingDay`, `employmentType`, `managerId`, `isManager`

### `ProjectGroup`
- `id`, `name`
- used to categorize projects into buckets such as internal or client-facing work

### `Project`
- `id`, `name`, `client`, `color`
- optional `startDate`, `endDate`, `type`, `code`, `pm`, `pc`, and `groupId`

### `Assignment`
- links `memberId` to `projectId`
- `startDate`, `endDate`, `hoursPerWeek`
- `status` — one of `Hard`, `Soft`, `Pending`, `Planned`

### `Comment`
- `id`, `authorId`, `authorName`, `text`, `createdAt`, `entityId`
- optionally references todos via `isTodo` and `todoId`

### `Todo`
- `id`, `title`, `description`, `status`, `priority`
- optional `dueDate`
- associations: `assignedMemberIds`, `projectIds`, `memberIds`
- `createdAt`, `completedAt`

## Persistence

- The app initializes state from `localStorage` using sample data in `src/mockData.ts`.
- Changes to teams, projects, assignments, comments, todos, user profile, and view settings are persisted locally.
- There is no server-side database or ORM in this repository.

## Data flow

- `App.tsx` holds the canonical state for all domain entities.
- Child views receive data and mutation callbacks as props.
- State changes are saved to `localStorage` on every update.

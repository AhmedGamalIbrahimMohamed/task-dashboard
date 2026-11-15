# Task Manager Dashboard

A task management dashboard built with Angular 21, PrimeNG and Bootstrap. It follows the provided Figma design (header, sidebar, statistic cards, filter bar and a three column Kanban board) and adds a task list, analytics, team and calendar views on top of it.

## Features

- **Dashboard**: statistic cards (total, completed, in progress, overdue), status tabs, priority filter and a Kanban board with drag and drop between columns
- **Create, edit and view tasks** in a dialog opened with PrimeNG DialogService. Required fields have a red asterisk and the save button stays disabled until the form is valid. View mode shows the same form read only
- **Delete tasks** with a confirmation dialog
- **Filtering** by status, priority and assignee, plus a real-time search on title and description from the header
- **Tasks page**: sortable and paginated table of the filtered tasks with row actions
- **Analytics**: tasks by priority (doughnut) and by status (bar) with Chart.js, and a recent activity feed
- **Team**: members list with open, done and overdue counts and a shortcut to their tasks
- **Calendar**: open tasks grouped by due date, overdue days highlighted
- Loading skeletons, empty states, error states with retry and toast notifications
- Responsive layout (mobile, tablet, desktop) with an off-canvas sidebar on small screens
- English and Arabic with a language switch in the header, including a full right-to-left layout

## Tech stack

| Area          | Choice                                                    |
| ------------- | --------------------------------------------------------- |
| Framework     | Angular 21 (standalone components, signals, zoneless)     |
| UI            | PrimeNG 21 (Aura preset customized to the design palette) |
| Layout        | Bootstrap 5 (reboot, grid and utilities only)             |
| Charts        | Chart.js through the PrimeNG chart component              |
| Drag and drop | Angular CDK                                               |
| Mock backend  | angular-in-memory-web-api                                 |
| Testing       | Vitest with the Angular unit-test builder and jsdom       |
| Code quality  | ESLint (angular-eslint), Prettier, Husky and lint-staged  |

I used PrimeNG for the interactive components (dialog, select, date picker, table, menu, toast) and Bootstrap only for the grid and spacing utilities, so the two libraries don't fight over component styles.

## Getting started

Requirements: Node.js 20.19+ (or 22.12+) and npm 10+.

```bash
npm install
npm start
```

The app runs on http://localhost:4200.

To refresh the mock data with dates relative to today:

```bash
npm run generate:data
```

## Scripts

| Script                  | Description                                    |
| ----------------------- | ---------------------------------------------- |
| `npm start`             | Start the dev server                           |
| `npm run build`         | Production build to `dist/`                    |
| `npm test`              | Run unit tests once                            |
| `npm run test:watch`    | Run unit tests in watch mode                   |
| `npm run test:coverage` | Run tests with a coverage report (`coverage/`) |
| `npm run lint`          | Lint TypeScript and templates                  |
| `npm run format`        | Format the project with Prettier               |
| `npm run format:check`  | Check formatting                               |
| `npm run generate:data` | Regenerate `data-fetching/*.json`              |

A pre-commit hook runs ESLint and Prettier on staged files.

## Environment configuration

Settings live in `src/environments`:

| Key        | Description                                 | Dev   | Prod  |
| ---------- | ------------------------------------------- | ----- | ----- |
| `apiUrl`   | Base URL of the API                         | `api` | `api` |
| `apiDelay` | Simulated latency of the in-memory API (ms) | 600   | 300   |
| `cacheTtl` | How long GET responses stay cached (ms)     | 30000 | 60000 |

The development file replaces the production one through `fileReplacements` in `angular.json`.

## Project structure

```
src/app
├── core
│   ├── api            in-memory backend (tasks, statistics, users)
│   ├── i18n           I18n service, t pipe, title strategy, en/ar dictionaries
│   ├── interceptors   cache, retry and error interceptors
│   ├── models         Task, Statistic and Activity types
│   ├── services       API services (tasks, users, statistics)
│   ├── store          TaskStore (signal based state)
│   ├── utils          date and task helpers
│   └── validators     custom form validators
├── layout             shell, header, sidebar
├── shared/components  task-card, stat-card, priority-badge, user-avatar, empty-state, icon
└── features
    ├── dashboard      page + filter-bar and task-board
    ├── tasks          page + task-form-dialog + TaskActions (dialogs, toasts)
    ├── analytics      page + task-charts and activity-feed
    ├── team
    └── calendar
```

## Architecture decisions

### Smart and presentational components

Pages (`Dashboard`, `Tasks`, `Analytics`, `Team`, `Calendar`) and the `Shell` are the smart components. They inject the store and services and pass data down. Components like `TaskBoard`, `FilterBar`, `TaskCard`, `StatCard`, `TaskCharts` and `ActivityFeed` only use `input()` and `output()`, which makes them easy to reuse and test.

The shared components follow the component groups in the Figma file: icon and primary buttons, navigation items with hover states, and the task card with its default, hover and overdue variants.

### State management with signals

`TaskStore` is a root service built on signals:

- `httpResource` loads the tasks and exposes `isLoading` and `error`
- `filters` is a writable signal and `filteredTasks`, `counts` and `activities` are `computed`
- Mutations go through `HttpClient`, then update the resource value locally, so the UI updates without refetching
- Moving a card on the board updates the UI first and rolls back if the request fails

I chose signals over NgRx because the state is small and lives in one feature. A signal store keeps it readable and still gives a single source of truth.

`TaskActions` handles the UI side of task operations (opening the task dialog with DialogService, confirming deletion and showing toasts), so the store stays free of UI concerns.

### API layer

- `angular-in-memory-web-api` serves the JSON files in `data-fetching/` as a REST API (`/api/tasks`, `/api/statistics`, `/api/users`)
- Reads use the new `httpResource`; writes use `HttpClient`
- **Cache interceptor**: caches GET responses for `cacheTtl` and clears a collection when a POST, PUT or DELETE hits it
- **Retry interceptor**: retries failed GET requests up to 2 times with an increasing delay, only for network and 5xx errors
- **Error interceptor**: maps HTTP errors to readable messages and shows a toast

The statistic cards take their labels and trends ("+12 this week") from the statistics endpoint, but the numbers are calculated from the current tasks, so they stay correct after creating, editing or moving tasks.

### Forms

The task form is a typed reactive form:

- Custom validators: `noWhitespaceValidator`, `notPastDateValidator` and `uniqueItemsValidator`
- Dynamic controls: tags are a `FormArray` (up to 5 unique tags)
- Dynamic validation: the "no past date" rule only applies to new tasks that are not done, and it updates when the status changes
- Errors show after a field is touched, and the messages come from one map

### Internationalization (English and Arabic)

I built a small signal-based translation layer instead of adding a library. This keeps language switching instant, at runtime, without rebuilding:

- The `I18n` service holds the current language in a signal and exposes `t(key, params)`
- The `t` pipe is used in templates, for example `{{ 'nav.tasks' | t }}` or `{{ 'due.inDays' | t: { count: 3 } }}`
- Dictionaries live in `core/i18n/translations`. The English file defines the key type and the Arabic file must contain every key, so a missing translation fails the build
- Plurals use `Intl.PluralRules`, which covers the Arabic forms (one, two, few, many)
- Switching to Arabic sets `lang` and `dir="rtl"` on `<html>`. Styles use logical properties (`margin-inline-end`, `border-inline-start`), the drawer and toasts move to the correct side, and user content uses `dir="auto"` and `<bdi>`
- Dates use Angular's locale data, and PrimeNG components (date picker, empty messages) get Arabic texts
- Page titles are translated with a custom `TitleStrategy`
- The chosen language is saved in `localStorage`; the first visit follows the browser language

Task data (titles, descriptions, tags and names) is user content, so it is shown as entered.

## Performance

- `OnPush` change detection on every component, enforced by an ESLint rule
- Zoneless change detection
- Every route is lazy loaded with `loadComponent`
- The task dialog is loaded with `@defer (on idle)`, which keeps the initial bundle under 1 MB (about 190 kB transferred)
- Only the Bootstrap reboot, grid and utilities CSS are included
- `track` on every `@for` loop and `computed` for derived data
- Cached GET responses through the interceptor
- `takeUntilDestroyed` for the one manual subscription, while HTTP calls complete on their own

## Accessibility

- Skip link to the main content, landmarks (`header`, `nav`, `main`) and `aria-current` on the active link
- Labels on all form controls, `aria-invalid` on the title and live regions for tags and the activity feed
- Visible focus styles and keyboard support through PrimeNG components
- Respects `prefers-reduced-motion`
- ESLint template accessibility rules are enabled

## Testing

Tests use Vitest through `ng test`, with `HttpTestingController` for HTTP.

- **Unit tests**: utils, validators, interceptors, API services, `TaskStore` and `TaskActions`
- **Component tests**: shared and presentational components (inputs, outputs and rendered states)
- **Integration tests**: pages rendered with the real store and mocked HTTP responses (loading, data, filtering, error and retry)

Current coverage: 99% statements, 97% branches, 100% functions and lines. The coverage thresholds are set to 80% in `angular.json`.

Paths that contain glob characters such as parentheses (for example `Senior Front End Test (Angular)`) are supported through a small plugin in `vitest-base.config.ts` that escapes the test file paths before Vitest matches them.

## Known limitations and future improvements

- Data lives in memory, so changes reset on page reload. The next step would be a real API, or JSON Server for persistence.
- Reordering cards inside a column is kept on the client only, because the API has no `order` field.
- Overdue tasks are always pinned to the top of their column.
- There is no authentication, and the current user is fixed.
- The calendar is a list grouped by date; a month view would be a good next step.
- Settings is a placeholder page.
- Only English and Arabic are included. Adding a language means adding one dictionary file and one entry in the language list.
- Add end-to-end tests (Playwright) for drag and drop and the full create, edit and delete flow.

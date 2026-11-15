import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  {
    path: 'dashboard',
    title: 'nav.dashboard',
    loadComponent: () => import('./features/dashboard/dashboard').then((m) => m.Dashboard),
  },
  {
    path: 'tasks',
    title: 'nav.tasks',
    loadComponent: () => import('./features/tasks/tasks').then((m) => m.Tasks),
  },
  {
    path: 'calendar',
    title: 'nav.calendar',
    loadComponent: () => import('./features/calendar/calendar').then((m) => m.Calendar),
  },
  {
    path: 'analytics',
    title: 'nav.analytics',
    loadComponent: () => import('./features/analytics/analytics').then((m) => m.Analytics),
  },
  {
    path: 'team',
    title: 'nav.team',
    loadComponent: () => import('./features/team/team').then((m) => m.Team),
  },
  {
    path: 'settings',
    title: 'nav.settings',
    loadComponent: () =>
      import('./shared/components/empty-state/empty-state').then((m) => m.EmptyState),
    data: {
      icon: 'settings',
      titleKey: 'nav.settings',
      messageKey: 'settings.message',
    },
  },
  { path: '**', redirectTo: 'dashboard' },
];

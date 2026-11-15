import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TranslatePipe } from '../../core/i18n';
import { TaskStore } from '../../core/store/task-store';
import { ActivityFeed } from './components/activity-feed/activity-feed';
import { TaskCharts } from './components/task-charts/task-charts';

@Component({
  selector: 'app-analytics',
  imports: [TaskCharts, ActivityFeed, TranslatePipe],
  template: `
    <h1 class="page-title">{{ 'nav.analytics' | t }}</h1>
    <div class="row g-3 fade-in">
      <div class="col-12 col-xl-8">
        <app-task-charts [tasks]="store.tasks()" />
      </div>
      <div class="col-12 col-xl-4">
        <app-activity-feed [activities]="store.activities()" />
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Analytics {
  protected readonly store = inject(TaskStore);
}

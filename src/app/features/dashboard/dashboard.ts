import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DialogService } from 'primeng/dynamicdialog';
import {
  TaskDialogData,
  TaskDialogResult,
  TaskFormDialog,
} from '../tasks/components/task-form-dialog/task-form-dialog';
import { Button } from 'primeng/button';
import { Skeleton } from 'primeng/skeleton';
import { I18n, TranslatePipe } from '../../core/i18n';
import { Statistic, TASK_STATUSES, TaskStatus, Task } from '../../core/models';
import { StatisticsApi } from '../../core/services/statistics-api';
import { TaskActions } from '../tasks/task-actions';
import { TaskStore } from '../../core/store/task-store';
import { EmptyState } from '../../shared/components/empty-state/empty-state';
import { StatCard } from '../../shared/components/stat-card/stat-card';
import { FilterBar } from './components/filter-bar/filter-bar';
import { TaskBoard } from './components/task-board/task-board';

@Component({
  selector: 'app-dashboard',
  imports: [StatCard, FilterBar, TaskBoard, Button, Skeleton, EmptyState, TranslatePipe],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Dashboard {
  private readonly dialogService = inject(DialogService);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly store = inject(TaskStore);
  protected readonly actions = inject(TaskActions);
  private readonly i18n = inject(I18n);
  private readonly statistics = inject(StatisticsApi).statisticsResource();

  protected readonly stats = computed<Statistic[]>(() => {
    const counts = this.store.counts();
    const values: Record<string, number> = {
      'stat-001': counts.total,
      'stat-002': counts.completed,
      'stat-003': counts.inProgress,
      'stat-004': counts.overdue,
    };
    const statistics = this.statistics.hasValue() ? this.statistics.value() : [];

    return statistics.map((stat) => ({
      ...stat,
      value: values[stat.id] ?? stat.value,
      title: this.translateOr(`stats.${stat.id}.title`, stat.title),
      changeLabel: this.translateOr(`stats.${stat.id}.change`, stat.changeLabel),
    }));
  });

  protected readonly visibleStatuses = computed<TaskStatus[]>(() => {
    const status = this.store.filters().status;
    return status === 'all' ? TASK_STATUSES : [status];
  });

  protected readonly skeletonColumns = [1, 2, 3];
  protected readonly skeletonStats = [1, 2, 3, 4];

  private translateOr(key: string, fallback: string): string {
    return this.i18n.has(key) ? this.i18n.t(key) : fallback;
  }

  openDialog(task?: Task, viewOnly = false): void {
    const ref = this.dialogService.open(TaskFormDialog, {
      header: this.i18n.t(viewOnly ? 'form.viewTitle' : task ? 'form.editTitle' : 'form.newTitle'),
      data: { task, viewOnly } satisfies TaskDialogData,
      modal: true,
      closable: true,
      dismissableMask: false,
      style: { width: '100%', maxWidth: '600px' },
    });

    ref?.onClose
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res: TaskDialogResult | undefined) => {
        if (res?.success) this.store.reload();
      });
  }
}

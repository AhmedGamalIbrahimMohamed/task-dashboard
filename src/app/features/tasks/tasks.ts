import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DialogService } from 'primeng/dynamicdialog';
import {
  TaskDialogData,
  TaskDialogResult,
  TaskFormDialog,
} from './components/task-form-dialog/task-form-dialog';
import { FormsModule } from '@angular/forms';
import { Button } from 'primeng/button';
import { Select } from 'primeng/select';
import { Skeleton } from 'primeng/skeleton';
import { TableModule } from 'primeng/table';
import { Tag } from 'primeng/tag';
import { I18n, TranslatePipe, priorityKey, statusKey } from '../../core/i18n';
import { TASK_PRIORITIES, TASK_STATUSES, Task, TaskStatus } from '../../core/models';
import { TaskActions } from './task-actions';
import { UserApi } from '../../core/services/user-api';
import { TaskStore } from '../../core/store/task-store';
import { dueLabel, isOverdue } from '../../core/utils/task';
import { EmptyState } from '../../shared/components/empty-state/empty-state';
import { PriorityBadge } from '../../shared/components/priority-badge/priority-badge';
import { UserAvatar } from '../../shared/components/user-avatar/user-avatar';

type TagSeverity = 'info' | 'warn' | 'success';

const STATUS_SEVERITY: Record<TaskStatus, TagSeverity> = {
  todo: 'info',
  in_progress: 'warn',
  done: 'success',
};

interface TaskRow extends Task {
  statusLabel: string;
  severity: TagSeverity;
  dueText: string;
  overdue: boolean;
}

@Component({
  selector: 'app-tasks',
  imports: [
    DatePipe,
    FormsModule,
    TableModule,
    Select,
    Button,
    Tag,
    Skeleton,
    PriorityBadge,
    UserAvatar,
    EmptyState,
    TranslatePipe,
  ],
  templateUrl: './tasks.html',
  styleUrl: './tasks.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Tasks {
  private readonly dialogService = inject(DialogService);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly store = inject(TaskStore);
  protected readonly actions = inject(TaskActions);
  protected readonly userApi = inject(UserApi);
  protected readonly i18n = inject(I18n);

  protected readonly statusOptions = computed(() => [
    { label: this.i18n.t('status.allStatuses'), value: 'all' },
    ...TASK_STATUSES.map((value) => ({ label: this.i18n.t(statusKey(value)), value })),
  ]);

  protected readonly priorityOptions = computed(() =>
    TASK_PRIORITIES.map((value) => ({ label: this.i18n.t(priorityKey(value)), value })),
  );

  protected readonly rows = computed<TaskRow[]>(() =>
    this.store.filteredTasks().map((task) => ({
      ...task,
      statusLabel: this.i18n.t(statusKey(task.status)),
      severity: STATUS_SEVERITY[task.status],
      dueText: this.i18n.translate(dueLabel(task)),
      overdue: isOverdue(task),
    })),
  );

  protected readonly hasFilters = computed(() => {
    const { search, status, priority, assigneeId } = this.store.filters();
    return !!search || status !== 'all' || !!priority || !!assigneeId;
  });

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

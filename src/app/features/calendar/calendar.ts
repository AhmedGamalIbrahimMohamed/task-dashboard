import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DialogService } from 'primeng/dynamicdialog';
import {
  TaskDialogData,
  TaskDialogResult,
  TaskFormDialog,
} from '../tasks/components/task-form-dialog/task-form-dialog';
import { I18n, TranslatePipe } from '../../core/i18n';
import { Task } from '../../core/models';
import { TaskStore } from '../../core/store/task-store';
import { dueLabel, isOverdue } from '../../core/utils/task';
import { EmptyState } from '../../shared/components/empty-state/empty-state';
import { PriorityBadge } from '../../shared/components/priority-badge/priority-badge';

interface DayGroup {
  date: string;
  label: string;
  overdue: boolean;
  tasks: Task[];
}

@Component({
  selector: 'app-calendar',
  imports: [DatePipe, PriorityBadge, EmptyState, TranslatePipe],
  templateUrl: './calendar.html',
  styleUrl: './calendar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Calendar {
  private readonly dialogService = inject(DialogService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly store = inject(TaskStore);
  protected readonly i18n = inject(I18n);

  protected readonly groups = computed<DayGroup[]>(() => {
    const open = this.store
      .tasks()
      .filter((task) => task.status !== 'done')
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate));

    const byDate = new Map<string, Task[]>();
    open.forEach((task) => byDate.set(task.dueDate, [...(byDate.get(task.dueDate) ?? []), task]));

    return [...byDate.entries()].map(([date, tasks]) => ({
      date,
      tasks,
      label: this.i18n.translate(dueLabel(tasks[0])),
      overdue: isOverdue(tasks[0]),
    }));
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

import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DialogService } from 'primeng/dynamicdialog';
import type {
  TaskDialogData,
  TaskDialogResult,
} from '../../features/tasks/components/task-form-dialog/task-form-dialog';
import { Task } from '../../core/models';
import { RouterOutlet } from '@angular/router';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { Drawer } from 'primeng/drawer';
import { Toast } from 'primeng/toast';
import { I18n, TranslatePipe } from '../../core/i18n';
import { TaskStore } from '../../core/store/task-store';
import { Header } from '../header/header';
import { Sidebar } from '../sidebar/sidebar';

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, Header, Sidebar, Drawer, Toast, ConfirmDialog, TranslatePipe],
  templateUrl: './shell.html',
  styleUrl: './shell.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Shell {
  private readonly dialogService = inject(DialogService);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly store = inject(TaskStore);
  protected readonly menuOpen = signal(false);
  private readonly i18n = inject(I18n);
  protected readonly isRtl = computed(() => this.i18n.direction() === 'rtl');

  onSearch(search: string): void {
    this.store.updateFilters({ search });
  }

  onNewTask(): void {
    this.menuOpen.set(false);
    this.openDialog();
  }

  async openDialog(task?: Task, viewOnly = false): Promise<void> {
    const { TaskFormDialog } =
      await import('../../features/tasks/components/task-form-dialog/task-form-dialog');
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

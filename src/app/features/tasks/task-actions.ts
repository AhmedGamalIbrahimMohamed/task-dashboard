import { Injectable, inject } from '@angular/core';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Observable, tap } from 'rxjs';
import { I18n, TranslationKey } from '../../core/i18n';
import { Task, TaskDraft } from '../../core/models';
import { TaskStore } from '../../core/store/task-store';

@Injectable({ providedIn: 'root' })
export class TaskActions {
  private readonly store = inject(TaskStore);
  private readonly confirmation = inject(ConfirmationService);
  private readonly messages = inject(MessageService);
  private readonly i18n = inject(I18n);

  save(task: Task | undefined, draft: TaskDraft): Observable<Task> {
    const request = task ? this.store.update(task, draft) : this.store.create(draft);
    return request.pipe(
      tap(() => this.notify(task ? 'toast.updated' : 'toast.created', draft.title)),
    );
  }

  confirmDelete(task: Task): void {
    this.confirmation.confirm({
      header: this.i18n.t('confirm.deleteHeader'),
      message: this.i18n.t('confirm.deleteMessage', { title: task.title }),
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: this.i18n.t('actions.delete'),
      rejectLabel: this.i18n.t('actions.cancel'),
      acceptButtonStyleClass: 'p-button-danger',
      rejectButtonStyleClass: 'p-button-text p-button-secondary',
      accept: () =>
        this.store.delete(task).subscribe(() => this.notify('toast.deleted', task.title)),
    });
  }

  private notify(summary: TranslationKey, detail: string): void {
    this.messages.add({ severity: 'success', summary: this.i18n.t(summary), detail, life: 3000 });
  }
}

import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormControl,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Button } from 'primeng/button';
import { Chip } from 'primeng/chip';
import { DatePicker } from 'primeng/datepicker';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { InputText } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { Textarea } from 'primeng/textarea';
import { map } from 'rxjs';
import { I18n, TranslatePipe, TranslationKey, priorityKey, statusKey } from '../../../../core/i18n';
import {
  TASK_PRIORITIES,
  TASK_STATUSES,
  Task,
  TaskDraft,
  TaskPriority,
  TaskStatus,
} from '../../../../core/models';
import { UserApi } from '../../../../core/services/user-api';
import { parseDateKey, toDateKey } from '../../../../core/utils/date';
import {
  noWhitespaceValidator,
  notPastDateValidator,
  uniqueItemsValidator,
} from '../../../../core/validators/task-validators';
import { TaskActions } from '../../task-actions';

export interface TaskDialogData {
  task?: Task;
  viewOnly?: boolean;
}

export interface TaskDialogResult {
  success: boolean;
  task?: Task;
}

export const MAX_TAGS = 5;

const ERROR_KEYS: Record<string, TranslationKey> = {
  required: 'errors.required',
  minlength: 'errors.minlength',
  maxlength: 'errors.maxlength',
  whitespace: 'errors.whitespace',
  pastDate: 'errors.pastDate',
  duplicate: 'errors.duplicate',
};

@Component({
  selector: 'app-task-form-dialog',
  imports: [
    ReactiveFormsModule,
    Button,
    InputText,
    Textarea,
    Select,
    DatePicker,
    Chip,
    TranslatePipe,
  ],
  templateUrl: './task-form-dialog.html',
  styleUrl: './task-form-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskFormDialog {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly ref = inject(DynamicDialogRef);
  private readonly actions = inject(TaskActions);
  private readonly i18n = inject(I18n);
  protected readonly userApi = inject(UserApi);

  private readonly data: TaskDialogData = inject(DynamicDialogConfig).data ?? {};
  protected readonly task: Task | undefined = this.data.task;
  protected readonly viewOnly = !!this.data.viewOnly;
  protected readonly saving = signal(false);

  protected readonly statuses = computed(() =>
    TASK_STATUSES.map((value) => ({ label: this.i18n.t(statusKey(value)), value })),
  );
  protected readonly priorities = computed(() =>
    TASK_PRIORITIES.map((value) => ({ label: this.i18n.t(priorityKey(value)), value })),
  );
  protected readonly maxTags = MAX_TAGS;

  readonly tagInput = new FormControl('', { nonNullable: true });
  readonly form = this.fb.group({
    title: [
      '',
      [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(80),
        noWhitespaceValidator,
      ],
    ],
    description: ['', Validators.maxLength(300)],
    status: this.fb.control<TaskStatus>('todo', Validators.required),
    priority: this.fb.control<TaskPriority>('medium', Validators.required),
    dueDate: this.fb.control<Date | null>(null, Validators.required),
    assigneeId: ['', Validators.required],
    tags: this.fb.array<string>([], uniqueItemsValidator()),
  });

  protected readonly isValid = toSignal(this.form.statusChanges.pipe(map(() => this.form.valid)), {
    initialValue: this.form.valid,
  });

  constructor() {
    this.form.controls.status.valueChanges
      .pipe(takeUntilDestroyed(inject(DestroyRef)))
      .subscribe(() => this.updateDueDateValidators());

    this.fill(this.task);

    if (this.viewOnly) {
      this.form.disable();
      this.tagInput.disable();
    }
  }

  get tags() {
    return this.form.controls.tags;
  }

  addTag(event?: Event): void {
    event?.preventDefault();
    const value = this.tagInput.value.trim();
    if (!value || this.tags.length >= MAX_TAGS) return;

    this.tags.push(this.fb.control(value));
    this.tags.markAsDirty();
    this.tagInput.reset();
  }

  removeTag(index: number): void {
    this.tags.removeAt(index);
  }

  errorFor(control: AbstractControl): string | null {
    if (!control.errors || !(control.touched || control.dirty)) return null;
    const [key, value] = Object.entries(control.errors)[0];
    const errorKey = ERROR_KEYS[key];
    return errorKey
      ? this.i18n.t(errorKey, { count: value?.requiredLength ?? 0 })
      : this.i18n.t('errors.invalid');
  }

  submit(): void {
    if (this.viewOnly || this.saving()) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.actions.save(this.task, this.toDraft()).subscribe({
      next: (task) => this.ref.close({ success: true, task } satisfies TaskDialogResult),
      error: () => this.saving.set(false),
    });
  }

  close(): void {
    this.ref.close();
  }

  private toDraft(): TaskDraft {
    const value = this.form.getRawValue();
    const assignee =
      this.userApi.users().find((user) => user.id === value.assigneeId) ?? this.task!.assignee;

    return {
      title: value.title.trim(),
      description: value.description.trim(),
      status: value.status,
      priority: value.priority,
      dueDate: toDateKey(value.dueDate!),
      assignee,
      tags: value.tags,
    };
  }

  private fill(task: Task | undefined): void {
    task?.tags.forEach((tag) => this.tags.push(this.fb.control(tag)));
    this.form.reset({
      title: task?.title ?? '',
      description: task?.description ?? '',
      status: task?.status ?? 'todo',
      priority: task?.priority ?? 'medium',
      dueDate: task ? parseDateKey(task.dueDate) : null,
      assigneeId: task?.assignee.id ?? '',
    });
    this.updateDueDateValidators();
  }

  /**
   * "No past date" is only for new tasks that are not done.
   * Old tasks can be overdue and done tasks can have any date,
   * so we check again every time the status changes.
   */
  private updateDueDateValidators(): void {
    const control = this.form.controls.dueDate;
    const needsFutureDate = !this.task && this.form.controls.status.value !== 'done';

    control.setValidators(
      needsFutureDate ? [Validators.required, notPastDateValidator] : Validators.required,
    );
    control.updateValueAndValidity();
  }
}

import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { Menu } from 'primeng/menu';
import { I18n, TranslatePipe, priorityKey, statusKey } from '../../../../core/i18n';
import { TASK_PRIORITIES, TASK_STATUSES, TaskFilters, TaskPriority } from '../../../../core/models';

@Component({
  selector: 'app-filter-bar',
  imports: [Menu, TranslatePipe],
  templateUrl: './filter-bar.html',
  styleUrl: './filter-bar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FilterBar {
  private readonly i18n = inject(I18n);

  readonly status = input.required<TaskFilters['status']>();
  readonly priority = input<TaskPriority | null>(null);
  readonly statusChange = output<TaskFilters['status']>();
  readonly priorityChange = output<TaskPriority | null>();
  readonly newTask = output<void>();

  protected readonly tabs = (['all', ...TASK_STATUSES] as const).map((value) => ({
    value,
    key: statusKey(value),
  }));

  protected readonly priorityLabel = computed(() => {
    const priority = this.priority();
    return this.i18n.t(priority ? priorityKey(priority) : 'priority.label');
  });

  protected readonly priorityItems = computed<MenuItem[]>(() => [
    { label: this.i18n.t('priority.all'), command: () => this.priorityChange.emit(null) },
    ...TASK_PRIORITIES.map((priority) => ({
      label: this.i18n.t(priorityKey(priority)),
      styleClass: priority === this.priority() ? 'fw-semibold' : '',
      command: () => this.priorityChange.emit(priority),
    })),
  ]);
}

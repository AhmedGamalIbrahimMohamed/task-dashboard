import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { I18n, priorityKey } from '../../../core/i18n';
import { TaskPriority } from '../../../core/models';

@Component({
  selector: 'app-priority-badge',
  template: '{{ label() }}',
  styleUrl: './priority-badge.scss',
  host: {
    '[class]': '"badge-" + priority()',
    '[attr.aria-label]': 'ariaLabel()',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PriorityBadge {
  private readonly i18n = inject(I18n);

  readonly priority = input.required<TaskPriority>();
  protected readonly label = computed(() => this.i18n.t(priorityKey(this.priority())));
  protected readonly ariaLabel = computed(() =>
    this.i18n.t('priority.badge', { value: this.label() }),
  );
}

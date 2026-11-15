import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { Menu } from 'primeng/menu';
import { I18n, TranslatePipe } from '../../../core/i18n';
import { Task } from '../../../core/models';
import { dueLabel, firstName, isOverdue } from '../../../core/utils/task';
import { Icon, IconName } from '../icon/icon';
import { PriorityBadge } from '../priority-badge/priority-badge';
import { UserAvatar } from '../user-avatar/user-avatar';

@Component({
  selector: 'app-task-card',
  imports: [Menu, Icon, PriorityBadge, UserAvatar, TranslatePipe],
  templateUrl: './task-card.html',
  styleUrl: './task-card.scss',
  host: {
    '[class]': '"status-" + task().status',
    '[class.overdue]': 'overdue()',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskCard {
  private readonly i18n = inject(I18n);

  readonly task = input.required<Task>();
  readonly view = output<Task>();
  readonly edit = output<Task>();
  readonly remove = output<Task>();

  protected readonly overdue = computed(() => isOverdue(this.task()));
  protected readonly dueText = computed(() => this.i18n.translate(dueLabel(this.task())));
  protected readonly assigneeName = computed(() => firstName(this.task().assignee.name));
  protected readonly metaIcon = computed<IconName>(() => {
    if (this.task().status === 'done') return 'check';
    return this.overdue() ? 'warning' : 'calendar';
  });

  protected readonly menuItems = computed<MenuItem[]>(() => [
    {
      label: this.i18n.t('actions.view'),
      icon: 'pi pi-eye',
      command: () => this.view.emit(this.task()),
    },
    {
      label: this.i18n.t('actions.edit'),
      icon: 'pi pi-pencil',
      command: () => this.edit.emit(this.task()),
    },
    {
      label: this.i18n.t('actions.delete'),
      icon: 'pi pi-trash',
      command: () => this.remove.emit(this.task()),
    },
  ]);
}

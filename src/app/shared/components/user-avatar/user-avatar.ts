import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { initials } from '../../../core/utils/task';

@Component({
  selector: 'app-user-avatar',
  template: '{{ label() }}',
  styleUrl: './user-avatar.scss',
  host: {
    role: 'img',
    '[attr.aria-label]': 'name()',
    '[style.--avatar-size.px]': 'size()',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserAvatar {
  readonly name = input.required<string>();
  readonly size = input(20);
  protected readonly label = computed(() => initials(this.name()));
}

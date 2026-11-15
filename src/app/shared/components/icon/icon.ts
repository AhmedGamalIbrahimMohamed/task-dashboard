import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type IconName =
  | 'bell'
  | 'calendar'
  | 'chart'
  | 'check'
  | 'clipboard'
  | 'progress'
  | 'search'
  | 'settings'
  | 'team'
  | 'trend'
  | 'warning';

@Component({
  selector: 'app-icon',
  template: '<img [src]="src()" alt="" [width]="size()" [height]="size()" draggable="false" />',
  styleUrl: './icon.scss',
  host: { 'aria-hidden': 'true' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Icon {
  readonly name = input.required<IconName>();
  readonly size = input(16);
  protected readonly src = computed(() => `icons/${this.name()}.png`);
}

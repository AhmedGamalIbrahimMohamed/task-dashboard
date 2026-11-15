import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TranslatePipe, TranslationKey } from '../../../core/i18n';
import { Icon, IconName } from '../icon/icon';

@Component({
  selector: 'app-empty-state',
  imports: [Icon, TranslatePipe],
  template: `
    <section class="empty-state app-card fade-in">
      <app-icon [name]="icon()" [size]="40" />
      <h1 class="empty-state__title">{{ titleKey() | t }}</h1>
      @if (messageKey(); as message) {
        <p class="empty-state__message">{{ message | t }}</p>
      }
      <ng-content />
    </section>
  `,
  styleUrl: './empty-state.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmptyState {
  readonly icon = input<IconName>('clipboard');
  readonly titleKey = input<TranslationKey>('empty.title');
  readonly messageKey = input<TranslationKey | null>(null);
}

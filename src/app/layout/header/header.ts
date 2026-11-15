import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { I18n, TranslatePipe } from '../../core/i18n';
import { Icon } from '../../shared/components/icon/icon';

@Component({
  selector: 'app-header',
  imports: [Icon, TranslatePipe],
  templateUrl: './header.html',
  styleUrl: './header.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Header {
  protected readonly i18n = inject(I18n);

  readonly search = input('');
  readonly userInitials = input('JD');
  readonly searchChange = output<string>();
  readonly menuToggle = output<void>();

  onSearch(event: Event): void {
    this.searchChange.emit((event.target as HTMLInputElement).value);
  }
}

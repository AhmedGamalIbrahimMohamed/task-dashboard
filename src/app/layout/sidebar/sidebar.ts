import { ChangeDetectionStrategy, Component, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TranslatePipe, TranslationKey } from '../../core/i18n';
import { Icon, IconName } from '../../shared/components/icon/icon';

export interface NavItem {
  label: TranslationKey;
  icon: IconName;
  iconSize: number;
  path: string;
}

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive, Icon, TranslatePipe],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Sidebar {
  readonly newTask = output<void>();
  readonly navigate = output<void>();

  readonly items: NavItem[] = [
    { label: 'nav.dashboard', icon: 'chart', iconSize: 9, path: '/dashboard' },
    { label: 'nav.tasks', icon: 'check', iconSize: 16, path: '/tasks' },
    { label: 'nav.calendar', icon: 'calendar', iconSize: 9, path: '/calendar' },
    { label: 'nav.analytics', icon: 'trend', iconSize: 9, path: '/analytics' },
    { label: 'nav.team', icon: 'team', iconSize: 9, path: '/team' },
    { label: 'nav.settings', icon: 'settings', iconSize: 15, path: '/settings' },
  ];
}

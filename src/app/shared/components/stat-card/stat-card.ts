import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { Statistic } from '../../../core/models';
import { Icon, IconName } from '../icon/icon';

const STAT_ICONS: Record<string, { name: IconName; size: number }> = {
  '📊': { name: 'chart', size: 12 },
  '✅': { name: 'check', size: 21 },
  '🔄': { name: 'progress', size: 12 },
  '⚠️': { name: 'warning', size: 24 },
};

@Component({
  selector: 'app-stat-card',
  imports: [Icon],
  templateUrl: './stat-card.html',
  styleUrl: './stat-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatCard {
  readonly stat = input.required<Statistic>();

  protected readonly icon = computed(() => STAT_ICONS[this.stat().icon] ?? STAT_ICONS['📊']);
}

import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { ChartData, ChartOptions } from 'chart.js';
import { UIChart } from 'primeng/chart';
import { I18n, TranslatePipe, priorityKey, statusKey } from '../../../../core/i18n';
import { TASK_PRIORITIES, TASK_STATUSES, Task } from '../../../../core/models';

const PRIORITY_COLORS = ['#d32f2f', '#f57c00', '#388e3c'];
const STATUS_COLORS = ['#1976d2', '#ff6f00', '#388e3c'];

@Component({
  selector: 'app-task-charts',
  imports: [UIChart, TranslatePipe],
  templateUrl: './task-charts.html',
  styleUrl: './task-charts.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskCharts {
  private readonly i18n = inject(I18n);

  readonly tasks = input.required<Task[]>();

  protected readonly priorityData = computed<ChartData<'doughnut'>>(() => ({
    labels: TASK_PRIORITIES.map((priority) => this.i18n.t(priorityKey(priority))),
    datasets: [
      {
        data: TASK_PRIORITIES.map(
          (priority) => this.tasks().filter((task) => task.priority === priority).length,
        ),
        backgroundColor: PRIORITY_COLORS,
        borderWidth: 0,
      },
    ],
  }));

  protected readonly statusData = computed<ChartData<'bar'>>(() => ({
    labels: TASK_STATUSES.map((status) => this.i18n.t(statusKey(status))),
    datasets: [
      {
        label: this.i18n.t('analytics.dataset'),
        data: TASK_STATUSES.map(
          (status) => this.tasks().filter((task) => task.status === status).length,
        ),
        backgroundColor: STATUS_COLORS,
        borderRadius: 6,
        maxBarThickness: 48,
      },
    ],
  }));

  protected readonly doughnutOptions: ChartOptions<'doughnut'> = {
    maintainAspectRatio: false,
    cutout: '65%',
    plugins: { legend: { position: 'bottom' } },
  };

  protected readonly barOptions: ChartOptions<'bar'> = {
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true, ticks: { precision: 0 } } },
  };
}

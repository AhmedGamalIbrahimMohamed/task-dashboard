import { CdkDrag, CdkDragDrop, CdkDropList, CdkDropListGroup } from '@angular/cdk/drag-drop';
import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { TranslatePipe, TranslationKey, statusKey } from '../../../../core/i18n';
import { TASK_STATUSES, Task, TaskMove, TaskStatus } from '../../../../core/models';
import { TaskCard } from '../../../../shared/components/task-card/task-card';

interface BoardColumn {
  status: TaskStatus;
  key: TranslationKey;
  tasks: Task[];
}

@Component({
  selector: 'app-task-board',
  imports: [CdkDropListGroup, CdkDropList, CdkDrag, TaskCard, TranslatePipe],
  templateUrl: './task-board.html',
  styleUrl: './task-board.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskBoard {
  readonly tasks = input.required<Task[]>();
  readonly statuses = input<TaskStatus[]>(TASK_STATUSES);
  readonly move = output<TaskMove>();
  readonly view = output<Task>();
  readonly edit = output<Task>();
  readonly remove = output<Task>();

  protected readonly columns = computed<BoardColumn[]>(() =>
    TASK_STATUSES.filter((status) => this.statuses().includes(status)).map((status) => ({
      status,
      key: statusKey(status),
      tasks: this.tasks().filter((task) => task.status === status),
    })),
  );

  onDrop(event: CdkDragDrop<TaskStatus, TaskStatus, Task>): void {
    if (event.previousContainer === event.container && event.previousIndex === event.currentIndex) {
      return;
    }
    this.move.emit({
      task: event.item.data,
      status: event.container.data,
      index: event.currentIndex,
    });
  }
}

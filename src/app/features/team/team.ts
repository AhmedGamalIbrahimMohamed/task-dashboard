import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Button } from 'primeng/button';
import { Skeleton } from 'primeng/skeleton';
import { TranslatePipe } from '../../core/i18n';
import { Assignee } from '../../core/models';
import { UserApi } from '../../core/services/user-api';
import { TaskStore } from '../../core/store/task-store';
import { isOverdue } from '../../core/utils/task';
import { UserAvatar } from '../../shared/components/user-avatar/user-avatar';

interface Member extends Assignee {
  open: number;
  done: number;
  overdue: number;
}

@Component({
  selector: 'app-team',
  imports: [Button, Skeleton, UserAvatar, TranslatePipe],
  templateUrl: './team.html',
  styleUrl: './team.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Team {
  private readonly store = inject(TaskStore);
  private readonly router = inject(Router);
  protected readonly userApi = inject(UserApi);

  protected readonly members = computed<Member[]>(() => {
    const tasks = this.store.tasks();
    return this.userApi.users().map((user) => {
      const own = tasks.filter((task) => task.assignee.id === user.id);
      return {
        ...user,
        open: own.filter((task) => task.status !== 'done').length,
        done: own.filter((task) => task.status === 'done').length,
        overdue: own.filter((task) => isOverdue(task)).length,
      };
    });
  });

  viewTasks(member: Member): void {
    this.store.resetFilters();
    this.store.updateFilters({ assigneeId: member.id });
    this.router.navigate(['/tasks']);
  }
}

import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { I18n, TranslatePipe, TranslationKey } from '../../../../core/i18n';
import { Activity, ActivityType } from '../../../../core/models';
import { Icon, IconName } from '../../../../shared/components/icon/icon';
import { UserAvatar } from '../../../../shared/components/user-avatar/user-avatar';

@Component({
  selector: 'app-activity-feed',
  imports: [DatePipe, Icon, UserAvatar, TranslatePipe],
  templateUrl: './activity-feed.html',
  styleUrl: './activity-feed.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActivityFeed {
  protected readonly i18n = inject(I18n);

  readonly activities = input.required<Activity[]>();

  protected readonly verbs: Record<ActivityType, TranslationKey> = {
    created: 'activity.created',
    updated: 'activity.updated',
    completed: 'activity.completed',
    deleted: 'activity.deleted',
  };

  protected readonly icons: Record<ActivityType, IconName> = {
    created: 'clipboard',
    updated: 'progress',
    completed: 'check',
    deleted: 'warning',
  };
}

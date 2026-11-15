import { Injectable } from '@angular/core';
import { InMemoryDbService } from 'angular-in-memory-web-api';
import statisticsData from '../../../../data-fetching/statistics.json';
import tasksData from '../../../../data-fetching/tasks.json';
import { Assignee, Statistic, Task } from '../models';

@Injectable()
export class InMemoryData implements InMemoryDbService {
  createDb() {
    const tasks = tasksData.tasks as Task[];
    const statistics = statisticsData.statistics as Statistic[];
    const users = [...new Map(tasks.map((task) => [task.assignee.id, task.assignee])).values()];

    return { tasks, statistics, users: users as Assignee[] };
  }

  genId(collection: { id: string }[], collectionName: string): string {
    const prefix = collectionName.replace(/s$/, '');
    const max = collection.reduce((highest, item) => {
      const number = Number(item.id.split('-').pop());
      return Number.isNaN(number) ? highest : Math.max(highest, number);
    }, 0);
    return `${prefix}-${String(max + 1).padStart(3, '0')}`;
  }
}

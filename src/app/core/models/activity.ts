export type ActivityType = 'created' | 'updated' | 'completed' | 'deleted';

export interface Activity {
  id: string;
  type: ActivityType;
  taskTitle: string;
  userName: string;
  date: string;
}

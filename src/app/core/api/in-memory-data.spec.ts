import { InMemoryData } from './in-memory-data';

describe('InMemoryData', () => {
  const db = new InMemoryData();

  it('exposes tasks, statistics and unique users', () => {
    const data = db.createDb();
    const userIds = data.users.map((user) => user.id);

    expect(data.tasks.length).toBeGreaterThan(0);
    expect(data.statistics).toHaveLength(4);
    expect(new Set(userIds).size).toBe(userIds.length);
  });

  it('generates sequential ids per collection', () => {
    expect(db.genId([{ id: 'task-009' }, { id: 'task-017' }], 'tasks')).toBe('task-018');
    expect(db.genId([], 'tasks')).toBe('task-001');
    expect(db.genId([{ id: 'custom' }], 'users')).toBe('user-001');
  });
});

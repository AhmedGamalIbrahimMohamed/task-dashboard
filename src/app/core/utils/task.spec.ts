import { makeTask } from '../../../testing/task-factory';
import { dueLabel, firstName, initials, isOverdue, matchesSearch } from './task';

describe('task utils', () => {
  const today = new Date(2026, 10, 13);

  it('detects overdue tasks only when they are not done', () => {
    expect(isOverdue(makeTask({ dueDate: '2026-11-12' }), today)).toBe(true);
    expect(isOverdue(makeTask({ dueDate: '2026-11-13' }), today)).toBe(false);
    expect(isOverdue(makeTask({ dueDate: '2026-11-12', status: 'done' }), today)).toBe(false);
  });

  it.each([
    ['2026-11-11', { key: 'due.overdue', params: { count: 2 } }],
    ['2026-11-13', { key: 'due.today' }],
    ['2026-11-14', { key: 'due.tomorrow' }],
    ['2026-11-15', { key: 'due.inDays', params: { count: 2 } }],
    ['2026-11-20', { key: 'due.inWeeks', params: { count: 1 } }],
  ])('describes due date %s', (dueDate, label) => {
    expect(dueLabel(makeTask({ dueDate }), today)).toEqual(label);
  });

  it.each([
    [undefined, { key: 'due.completed' }],
    ['2026-11-13T09:00:00', { key: 'due.completedToday' }],
    ['2026-11-12T09:00:00', { key: 'due.completedYesterday' }],
    ['2026-11-09T09:00:00', { key: 'due.completedDaysAgo', params: { count: 4 } }],
  ])('describes completion date %s', (completedAt, label) => {
    expect(dueLabel(makeTask({ status: 'done', completedAt }), today)).toEqual(label);
  });

  it('extracts names and initials', () => {
    expect(firstName('Sarah Smith')).toBe('Sarah');
    expect(initials('sarah jane smith')).toBe('SJ');
    expect(initials('Mike')).toBe('M');
  });

  it('matches search terms against title and description', () => {
    const task = makeTask({ title: 'Fix login', description: 'Mobile devices issue' });
    expect(matchesSearch(task, '')).toBe(true);
    expect(matchesSearch(task, '  LOGIN ')).toBe(true);
    expect(matchesSearch(task, 'mobile')).toBe(true);
    expect(matchesSearch(task, 'payment')).toBe(false);
  });
});

import { daysFromToday, parseDateKey, startOfDay, toDateKey } from './date';

describe('date utils', () => {
  const today = new Date(2026, 10, 13, 15, 30);

  it('strips the time part of a date', () => {
    expect(startOfDay(today)).toEqual(new Date(2026, 10, 13));
  });

  it('converts between dates and date keys', () => {
    expect(toDateKey(new Date(2026, 0, 5))).toBe('2026-01-05');
    expect(parseDateKey('2026-01-05')).toEqual(new Date(2026, 0, 5));
    expect(parseDateKey('2026-01-05T10:00:00.000Z')).toEqual(new Date(2026, 0, 5));
  });

  it('counts days relative to today', () => {
    expect(daysFromToday('2026-11-13', today)).toBe(0);
    expect(daysFromToday('2026-11-20', today)).toBe(7);
    expect(daysFromToday('2026-11-10', today)).toBe(-3);
    expect(daysFromToday(new Date(2026, 10, 14, 23), today)).toBe(1);
  });
});

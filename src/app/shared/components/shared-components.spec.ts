import { settle } from '../../../testing/http-testing';
import { TestBed } from '@angular/core/testing';
import { Statistic } from '../../core/models';
import { EmptyState } from './empty-state/empty-state';
import { Icon } from './icon/icon';
import { PriorityBadge } from './priority-badge/priority-badge';
import { StatCard } from './stat-card/stat-card';
import { UserAvatar } from './user-avatar/user-avatar';

describe('shared components', () => {
  it('renders the priority badge with its color class', async () => {
    const fixture = TestBed.createComponent(PriorityBadge);
    fixture.componentRef.setInput('priority', 'high');
    await settle();

    const host: HTMLElement = fixture.nativeElement;
    expect(host.textContent).toBe('High');
    expect(host.classList).toContain('badge-high');
    expect(host.getAttribute('aria-label')).toBe('Priority High');
  });

  it('renders avatar initials with an accessible name', async () => {
    const fixture = TestBed.createComponent(UserAvatar);
    fixture.componentRef.setInput('name', 'Sarah Smith');
    fixture.componentRef.setInput('size', 32);
    await settle();

    const host: HTMLElement = fixture.nativeElement;
    expect(host.textContent).toBe('SS');
    expect(host.getAttribute('aria-label')).toBe('Sarah Smith');
    expect(host.style.getPropertyValue('--avatar-size')).toBe('32px');
  });

  it('renders the empty state content', async () => {
    const fixture = TestBed.createComponent(EmptyState);
    fixture.componentRef.setInput('titleKey', 'nav.settings');
    fixture.componentRef.setInput('messageKey', 'settings.message');
    await settle();

    const host: HTMLElement = fixture.nativeElement;
    expect(host.querySelector('h1')?.textContent).toBe('Settings');
    expect(host.textContent).toContain('Workspace settings will be available soon.');
  });

  it('renders the default empty state title without a message', async () => {
    const fixture = TestBed.createComponent(EmptyState);
    await settle();

    expect(fixture.nativeElement.querySelector('h1').textContent).toBe('Nothing here yet');
    expect(fixture.nativeElement.querySelector('p')).toBeNull();
  });

  describe('StatCard', () => {
    const stat: Statistic = {
      id: 'stat-001',
      title: 'Total Tasks',
      icon: '📊',
      value: 17,
      change: '+12',
      changeLabel: 'this week',
      changeType: 'positive',
      color: '#1976D2',
    };

    it('renders the statistic', async () => {
      const fixture = TestBed.createComponent(StatCard);
      fixture.componentRef.setInput('stat', stat);
      await settle();

      const host: HTMLElement = fixture.nativeElement;
      expect(host.querySelector('.stat-card__value')?.textContent).toBe('17');
      expect(host.querySelector('.stat-card__change')?.textContent?.trim()).toBe('+12 this week');
      expect(host.querySelector('.stat-card__change--positive')).toBeTruthy();
    });

    it('hides a zero change', async () => {
      const fixture = TestBed.createComponent(StatCard);
      fixture.componentRef.setInput('stat', {
        ...stat,
        change: '0',
        changeLabel: 'Same as yesterday',
        changeType: 'neutral',
      });
      await settle();

      const change = fixture.nativeElement.querySelector('.stat-card__change') as HTMLElement;
      expect(change.textContent?.trim()).toBe('Same as yesterday');
    });
  });
});

describe('Icon and stat icon fallback', () => {
  it('renders the exported Figma icon image', async () => {
    const fixture = TestBed.createComponent(Icon);
    fixture.componentRef.setInput('name', 'bell');
    fixture.componentRef.setInput('size', 20);
    await settle();

    const img = fixture.nativeElement.querySelector('img') as HTMLImageElement;
    expect(img.getAttribute('src')).toBe('icons/bell.png');
    expect(img.getAttribute('width')).toBe('20');
    expect(fixture.nativeElement.getAttribute('aria-hidden')).toBe('true');
  });

  it('falls back to the chart icon for unknown statistics', async () => {
    const fixture = TestBed.createComponent(StatCard);
    fixture.componentRef.setInput('stat', {
      id: 'stat-x',
      title: 'Other',
      icon: '?',
      value: 1,
      change: '+1',
      changeLabel: 'today',
      changeType: 'positive',
      color: '',
    });
    await settle();

    expect(fixture.nativeElement.querySelector('img').getAttribute('src')).toBe('icons/chart.png');
  });
});

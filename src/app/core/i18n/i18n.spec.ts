import { ChangeDetectionStrategy, Component, DOCUMENT } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Title } from '@angular/platform-browser';
import { Router, TitleStrategy, provideRouter } from '@angular/router';
import { PrimeNG } from 'primeng/config';
import { settle } from '../../../testing/http-testing';
import { I18n, LANGUAGE_STORAGE_KEY, priorityKey, statusKey } from './i18n';
import { TranslatedTitleStrategy } from './title-strategy';
import { TranslatePipe } from './translate-pipe';
import { ar } from './translations/ar';
import { en } from './translations/en';

@Component({
  imports: [TranslatePipe],
  template: `<p>{{ 'due.inDays' | t: { count: 3 } }}</p>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class PipeHost {}

@Component({ template: '', changeDetection: ChangeDetectionStrategy.OnPush })
class EmptyPage {}

describe('I18n', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('provides an Arabic translation for every English key', () => {
    expect(Object.keys(ar).sort()).toEqual(Object.keys(en).sort());
  });

  it('starts in English and translates with parameters', () => {
    const i18n = TestBed.inject(I18n);

    expect(i18n.language()).toBe('en');
    expect(i18n.t('confirm.deleteMessage', { title: 'Report' })).toContain('"Report"');
    expect(i18n.t('header.signedInAs')).toBe('Signed in as {name}');
  });

  it('restores the saved language', () => {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, 'ar');

    expect(TestBed.inject(I18n).language()).toBe('ar');
  });

  it('follows an Arabic browser language when nothing is saved', () => {
    vi.spyOn(navigator, 'language', 'get').mockReturnValue('ar-EG');

    expect(TestBed.inject(I18n).language()).toBe('ar');
  });

  it('falls back to English when storage is blocked', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    const i18n = TestBed.inject(I18n);

    i18n.toggleLanguage();
    TestBed.tick();

    expect(i18n.language()).toBe('ar');
  });

  it('switches to Arabic with RTL direction and saves the choice', () => {
    const i18n = TestBed.inject(I18n);
    const root = TestBed.inject(DOCUMENT).documentElement;

    i18n.toggleLanguage();
    TestBed.tick();

    expect(root.lang).toBe('ar');
    expect(root.dir).toBe('rtl');
    expect(i18n.locale()).toBe('ar');
    expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe('ar');
    expect(TestBed.inject(PrimeNG).translation.today).toBe('اليوم');

    i18n.setLanguage('en');
    TestBed.tick();

    expect(root.dir).toBe('ltr');
    expect(TestBed.inject(PrimeNG).translation.today).not.toBe('اليوم');
  });

  it('uses the right plural form for each language', () => {
    const i18n = TestBed.inject(I18n);

    expect(i18n.t('due.overdue', { count: 1 })).toBe('Overdue by 1 day');
    expect(i18n.t('due.overdue', { count: 3 })).toBe('Overdue by 3 days');

    i18n.setLanguage('ar');
    expect(i18n.t('due.overdue', { count: 1 })).toBe('متأخرة بيوم واحد');
    expect(i18n.t('due.overdue', { count: 2 })).toBe('متأخرة بيومين');
    expect(i18n.t('due.overdue', { count: 5 })).toBe('متأخرة 5 أيام');
    expect(i18n.t('due.overdue', { count: 11 })).toBe('متأخرة 11 يومًا');
    expect(i18n.t('board.count', { count: 0 })).toBe('لا توجد مهام');
    expect(i18n.t('due.overdue')).toBe('متأخرة {count} يوم');
  });

  it('translates structured labels and builds keys', () => {
    const i18n = TestBed.inject(I18n);

    expect(i18n.translate({ key: 'due.inWeeks', params: { count: 2 } })).toBe('Due in 2 weeks');
    expect(i18n.translate({ key: 'due.today' })).toBe('Due today');
    expect(i18n.t(statusKey('in_progress'))).toBe('In Progress');
    expect(i18n.t(priorityKey('low'))).toBe('Low');
    expect(i18n.has('nav.tasks')).toBe(true);
    expect(i18n.has('stats.unknown.title')).toBe(false);
  });

  it('updates templates through the pipe when the language changes', async () => {
    const fixture = TestBed.createComponent(PipeHost);
    await settle();
    expect(fixture.nativeElement.textContent).toBe('Due in 3 days');

    TestBed.inject(I18n).setLanguage('ar');
    await settle();

    expect(fixture.nativeElement.textContent).toBe('تستحق خلال 3 أيام');
  });

  it('translates page titles and keeps them in sync with the language', async () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: 'tasks', title: 'nav.tasks', component: EmptyPage },
          { path: 'raw', title: 'Not a key', component: EmptyPage },
        ]),
        { provide: TitleStrategy, useClass: TranslatedTitleStrategy },
      ],
    });
    const router = TestBed.inject(Router);
    const title = TestBed.inject(Title);

    await router.navigateByUrl('/tasks');
    await settle();
    expect(title.getTitle()).toBe('Tasks | Task Manager');

    TestBed.inject(I18n).setLanguage('ar');
    await settle();
    expect(title.getTitle()).toBe('المهام | مدير المهام');

    await router.navigateByUrl('/raw');
    await settle();
    expect(title.getTitle()).toBe('مدير المهام');
  });
});

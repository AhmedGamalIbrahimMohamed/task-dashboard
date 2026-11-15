import { By } from '@angular/platform-browser';
import { TestBed } from '@angular/core/testing';
import { mockTaskDialog, provideAppTesting, respond, settle } from '../../testing/http-testing';
import { App } from '../app';
import { I18n } from '../core/i18n';
import { TaskStore } from '../core/store/task-store';
import { Header } from './header/header';
import { Shell } from './shell/shell';
import { Sidebar } from './sidebar/sidebar';

describe('layout', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ providers: provideAppTesting() }).compileComponents();
  });

  it('emits search and menu events from the header', async () => {
    const fixture = TestBed.createComponent(Header);
    const search = vi.fn();
    const toggle = vi.fn();
    fixture.componentInstance.searchChange.subscribe(search);
    fixture.componentInstance.menuToggle.subscribe(toggle);
    await settle();

    const input = fixture.nativeElement.querySelector('#global-search') as HTMLInputElement;
    input.value = 'login';
    input.dispatchEvent(new Event('input'));
    (fixture.nativeElement.querySelector('[aria-label="Open navigation"]') as HTMLElement).click();

    expect(search).toHaveBeenCalledWith('login');
    expect(toggle).toHaveBeenCalled();
  });

  it('switches the whole layout to Arabic from the header', async () => {
    localStorage.clear();
    const fixture = TestBed.createComponent(App);
    await respond('api/tasks', []);
    const button = fixture.nativeElement.querySelector('.header__language') as HTMLElement;
    expect(button.textContent?.trim()).toBe('العربية');

    button.click();
    await settle();

    expect(button.textContent?.trim()).toBe('English');
    expect(fixture.nativeElement.querySelector('.header__title').textContent).toBe('مدير المهام');
    expect(fixture.nativeElement.querySelector('.sidebar__cta').textContent).toContain(
      'مهمة جديدة',
    );
    expect(document.documentElement.dir).toBe('rtl');

    TestBed.inject(I18n).setLanguage('en');
    await settle();
  });

  it('renders navigation links and the new task button', async () => {
    const fixture = TestBed.createComponent(Sidebar);
    const newTask = vi.fn();
    fixture.componentInstance.newTask.subscribe(newTask);
    await settle();

    const links = fixture.nativeElement.querySelectorAll('a.nav-item');
    (fixture.nativeElement.querySelector('.sidebar__cta') as HTMLElement).click();

    expect(links).toHaveLength(6);
    expect(links[0].getAttribute('href')).toBe('/dashboard');
    expect(newTask).toHaveBeenCalled();
  });

  it('connects the shell to the store and actions', async () => {
    const fixture = TestBed.createComponent(App);
    const store = TestBed.inject(TaskStore);
    const open = mockTaskDialog({ success: true });
    const reload = vi.spyOn(store, 'reload');
    await respond('api/tasks', []);
    const shell: Shell = fixture.debugElement.query(By.directive(Shell)).componentInstance;

    const input = fixture.nativeElement.querySelector('#global-search') as HTMLInputElement;
    input.value = 'budget';
    input.dispatchEvent(new Event('input'));
    expect(store.filters().search).toBe('budget');

    const opening = vi.spyOn(shell, 'openDialog');
    shell['menuOpen'].set(true);
    (fixture.nativeElement.querySelector('.sidebar__cta') as HTMLElement).click();
    expect(shell['menuOpen']()).toBe(false);
    await opening.mock.results[0].value;

    expect(open).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ header: 'New Task' }),
    );
    expect(reload).toHaveBeenCalled();
  });

  it('bootstraps the root component', async () => {
    const fixture = TestBed.createComponent(App);
    await settle();

    expect(fixture.nativeElement.querySelector('app-shell')).toBeTruthy();
  });
});

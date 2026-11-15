import { Injectable, effect, inject, signal } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';
import { I18n } from './i18n';

/**
 * Route title is a translation key (title: 'nav.tasks').
 * Sets the tab title to "Page | App name" and changes it when the language changes.
 */
@Injectable({ providedIn: 'root' })
export class TranslatedTitleStrategy extends TitleStrategy {
  private readonly i18n = inject(I18n);
  private readonly title = inject(Title);
  private readonly pageKey = signal<string | undefined>(undefined);

  constructor() {
    super();
    effect(() => {
      const key = this.pageKey();
      const appName = this.i18n.t('app.name');
      const page = key && this.i18n.has(key) ? this.i18n.t(key) : undefined;
      this.title.setTitle(page ? `${page} | ${appName}` : appName);
    });
  }

  override updateTitle(snapshot: RouterStateSnapshot): void {
    this.pageKey.set(this.buildTitle(snapshot));
  }
}

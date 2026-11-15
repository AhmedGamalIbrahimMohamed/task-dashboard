import { DOCUMENT, Injectable, computed, effect, inject, signal } from '@angular/core';
import { PrimeNG } from 'primeng/config';
import { TaskPriority, TaskStatus } from '../models/task';
import { primeNgArabic } from './primeng-ar';
import { Language, PluralForms, Translatable, Translation, TranslationParams } from './translation';
import { ar } from './translations/ar';
import { en, TranslationKey } from './translations/en';

export const LANGUAGE_STORAGE_KEY = 'task-manager.language';

const DICTIONARIES: Record<Language, Record<TranslationKey, Translation>> = { en, ar };
const LOCALES: Record<Language, string> = { en: 'en-US', ar: 'ar' };

export function statusKey(status: TaskStatus | 'all'): TranslationKey {
  return `status.${status}`;
}

export function priorityKey(priority: TaskPriority): TranslationKey {
  return `priority.${priority}`;
}

@Injectable({ providedIn: 'root' })
export class I18n {
  private readonly document = inject(DOCUMENT);
  private readonly primeng = inject(PrimeNG);
  private readonly primeNgDefaults = { ...this.primeng.translation };

  readonly language = signal<Language>(this.initialLanguage());
  readonly locale = computed(() => LOCALES[this.language()]);
  readonly direction = computed(() => (this.language() === 'ar' ? 'rtl' : 'ltr'));

  constructor() {
    effect(() => {
      const language = this.language();
      const root = this.document.documentElement;
      root.lang = language;
      root.dir = this.direction();
      this.primeng.setTranslation(language === 'ar' ? primeNgArabic : this.primeNgDefaults);
      try {
        localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
      } catch {
        return;
      }
    });
  }

  setLanguage(language: Language): void {
    this.language.set(language);
  }

  toggleLanguage(): void {
    this.language.update((language) => (language === 'en' ? 'ar' : 'en'));
  }

  has(key: string): key is TranslationKey {
    return key in en;
  }

  /**
   * Get the text for a key in the current language.
   * If the text has plural forms we pick one with params.count
   * (Intl.PluralRules knows the arabic rules: one, two, few, many...).
   * {name} is replaced from params.
   *
   * @example t('due.overdue', { count: 2 }) // 'Overdue by 2 days' / 'متأخرة بيومين'
   */
  t(key: TranslationKey, params: TranslationParams = {}): string {
    const value = DICTIONARIES[this.language()][key] ?? key;
    const text =
      typeof value === 'string' ? value : this.pluralize(value, Number(params['count'] ?? 0));

    return text.replace(/\{(\w+)\}/g, (match, name: string) =>
      name in params ? String(params[name]) : match,
    );
  }

  translate({ key, params }: Translatable): string {
    return this.t(key, params);
  }

  private pluralize(forms: PluralForms, count: number): string {
    const rule = new Intl.PluralRules(this.locale()).select(count);
    return forms[rule] ?? forms.other;
  }

  private initialLanguage(): Language {
    try {
      const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (saved === 'en' || saved === 'ar') return saved;
    } catch {
      return 'en';
    }
    return this.document.defaultView?.navigator.language.startsWith('ar') ? 'ar' : 'en';
  }
}

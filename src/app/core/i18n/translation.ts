import type { TranslationKey } from './translations/en';

export type PluralForms = Partial<Record<Intl.LDMLPluralRule, string>> & { other: string };

export type Translation = string | PluralForms;

export type Language = 'en' | 'ar';

export type TranslationParams = Record<string, string | number>;

export interface Translatable {
  key: TranslationKey;
  params?: TranslationParams;
}

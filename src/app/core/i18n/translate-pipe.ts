import { Pipe, PipeTransform, inject } from '@angular/core';
import { I18n } from './i18n';
import { TranslationParams } from './translation';
import { TranslationKey } from './translations/en';

@Pipe({ name: 't', pure: false })
export class TranslatePipe implements PipeTransform {
  private readonly i18n = inject(I18n);

  transform(key: TranslationKey, params?: TranslationParams): string {
    return this.i18n.t(key, params);
  }
}

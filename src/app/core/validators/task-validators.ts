import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { daysFromToday } from '../utils/date';

export function noWhitespaceValidator(control: AbstractControl<string>): ValidationErrors | null {
  const value = control.value ?? '';
  return value.length > 0 && value.trim().length === 0 ? { whitespace: true } : null;
}

export function notPastDateValidator(
  control: AbstractControl<Date | null>,
): ValidationErrors | null {
  const value = control.value;
  if (!value) return null;
  return daysFromToday(value) < 0 ? { pastDate: true } : null;
}

export function uniqueItemsValidator(): ValidatorFn {
  return (control: AbstractControl<string[]>): ValidationErrors | null => {
    const values = (control.value ?? []).map((item) => item.trim().toLowerCase());
    return new Set(values).size !== values.length ? { duplicate: true } : null;
  };
}

import { FormControl } from '@angular/forms';
import {
  noWhitespaceValidator,
  notPastDateValidator,
  uniqueItemsValidator,
} from './task-validators';

describe('task validators', () => {
  it('rejects whitespace only values', () => {
    expect(noWhitespaceValidator(new FormControl('   ') as FormControl<string>)).toEqual({
      whitespace: true,
    });
    expect(noWhitespaceValidator(new FormControl('Task') as FormControl<string>)).toBeNull();
    expect(noWhitespaceValidator(new FormControl('') as FormControl<string>)).toBeNull();
  });

  it('rejects dates in the past', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    expect(notPastDateValidator(new FormControl<Date | null>(yesterday))).toEqual({
      pastDate: true,
    });
    expect(notPastDateValidator(new FormControl<Date | null>(new Date()))).toBeNull();
    expect(notPastDateValidator(new FormControl<Date | null>(null))).toBeNull();
  });

  it('rejects duplicate items ignoring case', () => {
    const validator = uniqueItemsValidator();
    expect(validator(new FormControl(['QA', 'qa ']))).toEqual({ duplicate: true });
    expect(validator(new FormControl(['QA', 'Design']))).toBeNull();
    expect(validator(new FormControl(null))).toBeNull();
  });
});

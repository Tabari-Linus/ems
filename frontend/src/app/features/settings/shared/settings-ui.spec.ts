import { countLabel, fieldError, sentenceCase, statusPillValue } from './settings-ui';

describe('settings-ui helpers', () => {
  const state = (touched: boolean, messages: string[]) => () => ({
    touched: () => touched,
    errors: () => messages.map((message) => ({ message })),
  });

  it('shows a field error only once the field is touched', () => {
    expect(fieldError(state(false, ['Company name is required']))).toBeNull();
    expect(fieldError(state(true, ['Company name is required', 'other']))).toBe(
      'Company name is required',
    );
    expect(fieldError(state(true, []))).toBeNull();
  });

  it('maps backend statuses onto employee-status pills', () => {
    expect(statusPillValue('ACTIVE')).toBe('ACTIVE');
    expect(statusPillValue('pending')).toBe('PENDING');
    expect(statusPillValue('SUSPENDED')).toBeNull();
    expect(statusPillValue(null)).toBeNull();
  });

  it('pluralises counts', () => {
    expect(countLabel(1, 'company', 'companies')).toBe('1 company');
    expect(countLabel(0, 'company', 'companies')).toBe('0 companies');
    expect(countLabel(3, 'office', 'offices')).toBe('3 offices');
  });

  it('turns enum values into sentence case', () => {
    expect(sentenceCase('SENIOR')).toBe('Senior');
    expect(sentenceCase('PREFER_NOT_TO_SAY')).toBe('Prefer not to say');
    expect(sentenceCase(undefined)).toBe('');
  });
});

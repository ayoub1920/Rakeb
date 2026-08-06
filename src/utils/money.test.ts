import { dinarsToMillimes, formatMillimes, millimesToDinars } from './money';

describe('formatMillimes', () => {
  it('renders millimes as dinars with three decimals', () => {
    expect(formatMillimes(15_800)).toBe('15,800 DT');
  });

  it('pads the millimes part', () => {
    expect(formatMillimes(15_080)).toBe('15,080 DT');
    expect(formatMillimes(15_008)).toBe('15,008 DT');
  });

  it('groups thousands', () => {
    expect(formatMillimes(1_500_000)).toBe('1 500,000 DT');
  });

  it('handles zero and negative amounts (refunds)', () => {
    expect(formatMillimes(0)).toBe('0,000 DT');
    expect(formatMillimes(-2_500)).toBe('-2,500 DT');
  });

  it('omits the currency when asked', () => {
    expect(formatMillimes(15_800, { withCurrency: false })).toBe('15,800');
  });

  it('drops an empty millimes part in compact mode', () => {
    expect(formatMillimes(15_000, { compact: true })).toBe('15 DT');
    // Only when it is actually empty.
    expect(formatMillimes(15_800, { compact: true })).toBe('15,800 DT');
  });

  it('rejects a non-finite amount instead of rendering NaN', () => {
    expect(() => formatMillimes(Number.NaN)).toThrow();
  });
});

describe('millimes conversion', () => {
  it('round-trips a user-entered dinar amount', () => {
    expect(dinarsToMillimes(15.8)).toBe(15_800);
    expect(millimesToDinars(15_800)).toBe(15.8);
  });

  it('rounds away float error from an input field', () => {
    expect(dinarsToMillimes(15.7999999999)).toBe(15_800);
  });
});

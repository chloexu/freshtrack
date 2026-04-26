import { getFreshnessBucket, getFreshnessLabel } from '../constants/freshness';

beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date('2026-04-24'));
});
afterEach(() => jest.useRealTimers());

describe('getFreshnessBucket', () => {
  it('returns urgent for 1 day away', () => {
    expect(getFreshnessBucket('2026-04-25')).toBe('urgent');
  });
  it('returns urgent for 2 days away', () => {
    expect(getFreshnessBucket('2026-04-26')).toBe('urgent');
  });
  it('returns soon for 3 days away', () => {
    expect(getFreshnessBucket('2026-04-27')).toBe('soon');
  });
  it('returns soon for 6 days away', () => {
    expect(getFreshnessBucket('2026-04-30')).toBe('soon');
  });
  it('returns fresh for 7 days away', () => {
    expect(getFreshnessBucket('2026-05-01')).toBe('fresh');
  });
  it('returns urgent for today (0 days)', () => {
    expect(getFreshnessBucket('2026-04-24')).toBe('urgent');
  });
});

describe('getFreshnessLabel', () => {
  it('returns "today" for today', () => {
    expect(getFreshnessLabel('2026-04-24')).toBe('today');
  });
  it('returns "tomorrow" for 1 day away', () => {
    expect(getFreshnessLabel('2026-04-25')).toBe('tomorrow');
  });
  it('returns "5d" for 5 days away', () => {
    expect(getFreshnessLabel('2026-04-29')).toBe('5d');
  });
});

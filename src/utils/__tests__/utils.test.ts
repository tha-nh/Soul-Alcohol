import { formatDuration } from '../format';
import { generateId } from '../id';

describe('formatDuration', () => {
  it.each([
    [0, '00:00:00'],
    [59, '00:00:59'],
    [60, '00:01:00'],
    [3661, '01:01:01'],
    [11922, '03:18:42'],
  ])('formats %i seconds as %s', (seconds, expected) => {
    expect(formatDuration(seconds)).toBe(expected);
  });

  it('drops fractional seconds instead of rounding up', () => {
    expect(formatDuration(59.9)).toBe('00:00:59');
  });
});

describe('generateId', () => {
  it('returns an RFC4122 v4 shaped id', () => {
    expect(generateId()).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });

  it('does not repeat across many calls', () => {
    const ids = new Set(Array.from({ length: 500 }, () => generateId()));
    expect(ids.size).toBe(500);
  });
});

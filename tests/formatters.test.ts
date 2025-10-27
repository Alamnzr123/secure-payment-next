import { describe, it, expect } from "vitest";
import { formatDateMMDDYYYY, formatCountdown, secondsUntil } from "../src/utils/formatters";

describe('formatters', () => {
  it('formats ISO date to MM-DD-YYYY', () => {
    expect(formatDateMMDDYYYY('2023-10-10T00:00:00.000Z')).toBe('10-10-2023');
  });

  it('formats countdown seconds', () => {
    expect(formatCountdown(5)).toBe('5s');
    expect(formatCountdown(65)).toBe('1m 5s');
    expect(formatCountdown(3665)).toBe('1h 1m 5s');
  });

  it('secondsUntil returns non-negative number', () => {
    const secs = secondsUntil(new Date(Date.now() + 2000).toISOString());
    expect(secs).toBeGreaterThanOrEqual(0);
  });
});

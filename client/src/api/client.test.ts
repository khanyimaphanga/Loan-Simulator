import { describe, expect, it, vi } from 'vitest';
import { eligibilityRequest } from '../test/fixtures';
import { api, ApiError, isAbortError } from './client';

describe('api client', () => {
  it('passes cancelled requests through as aborts, so they are never shown as connection errors', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new DOMException('The operation was aborted.', 'AbortError'))));
    await expect(api.eligibility(eligibilityRequest)).rejects.toSatisfy(isAbortError);
  });

  it('turns a network failure into a readable error', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new TypeError('Failed to fetch'))));
    await expect(api.eligibility(eligibilityRequest)).rejects.toThrow(ApiError);
  });
});

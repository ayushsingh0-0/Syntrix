import { describe, it, expect } from 'vitest';
import { getErrorMessage } from '../utils/error';

describe('Frontend Error Utility Suite', () => {
  it('should extract error message from standard Axios-like response payload', () => {
    const mockAxiosError = {
      response: {
        data: {
          message: 'Invalid credentials provided',
        },
      },
    };

    const result = getErrorMessage(mockAxiosError, 'Default fallback message');
    expect(result).toBe('Invalid credentials provided');
  });

  it('should extract message from generic Error object', () => {
    const error = new Error('Network timeout');
    const result = getErrorMessage(error, 'Default fallback');
    expect(result).toBe('Network timeout');
  });

  it('should return fallback message when unknown error structure is provided', () => {
    const result = getErrorMessage(null, 'Custom fallback error');
    expect(result).toBe('Custom fallback error');
  });
});

import { AxiosError } from 'axios';
import type { ApiErrorResponse } from '../types';

export function getErrorMessage(err: unknown, fallback = 'An unexpected error occurred'): string {
  if (err instanceof AxiosError) {
    const data = err.response?.data as ApiErrorResponse | undefined;
    if (data?.message) return data.message;
  }
  if (err instanceof Error) {
    return err.message;
  }
  return fallback;
}

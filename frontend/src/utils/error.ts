import axios from 'axios';
import type { ApiErrorResponse } from '../types';

export function getErrorMessage(err: unknown, fallback = 'An unexpected error occurred'): string {
  if (axios.isAxiosError(err) || (typeof err === 'object' && err !== null && 'response' in err)) {
    const data = (err as { response?: { data?: ApiErrorResponse } }).response?.data;
    if (data?.message) return data.message;
  }
  if (err instanceof Error) {
    return err.message;
  }
  return fallback;
}

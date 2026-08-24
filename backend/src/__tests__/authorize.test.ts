import { describe, it, expect, vi } from 'vitest';
import { authorize } from '../middleware/authorize.middleware';
import { ApiError } from '../utils/ApiError';
import type { Request, Response } from 'express';

describe('Role Authorization Middleware', () => {
  it('should call next(ApiError 401) when user is not present in res.locals', () => {
    const req = {} as Request;
    const res = { locals: {} } as Response;
    const next = vi.fn();

    const middleware = authorize('ADMIN');
    middleware(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(ApiError));
    const err = next.mock.calls[0][0];
    expect(err.statusCode).toBe(401);
  });

  it('should call next(ApiError 403) when user role is not allowed', () => {
    const req = {} as Request;
    const res = {
      locals: {
        user: { id: 'user-1', role: 'USER' },
      },
    } as unknown as Response;
    const next = vi.fn();

    const middleware = authorize('ADMIN');
    middleware(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(ApiError));
    const err = next.mock.calls[0][0];
    expect(err.statusCode).toBe(403);
  });

  it('should call next() with no errors when user role matches allowed roles', () => {
    const req = {} as Request;
    const res = {
      locals: {
        user: { id: 'user-1', role: 'ADMIN' },
      },
    } as unknown as Response;
    const next = vi.fn();

    const middleware = authorize('ADMIN', 'USER');
    middleware(req, res, next);

    expect(next).toHaveBeenCalledWith();
  });
});

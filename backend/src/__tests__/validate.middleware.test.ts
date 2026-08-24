import { describe, it, expect, vi } from 'vitest';
import { validate } from '../middleware/validate.middleware';
import { z } from 'zod';
import type { Request, Response } from 'express';

describe('Validation Middleware Suite', () => {
  const testSchema = z.object({
    name: z.string().min(2),
    age: z.number().min(18),
  });

  it('should call next() with parsed data when input is valid', () => {
    const req = {
      body: { name: 'Ayush', age: 24 },
    } as Request;
    const res = {} as Response;
    const next = vi.fn();

    const middleware = validate(testSchema);
    middleware(req, res, next);

    expect(next).toHaveBeenCalledWith();
    expect(req.body).toEqual({ name: 'Ayush', age: 24 });
  });

  it('should forward ZodError to next(error) when input is invalid', () => {
    const req = {
      body: { name: 'A', age: 16 },
    } as Request;
    const res = {} as Response;
    const next = vi.fn();

    const middleware = validate(testSchema);
    middleware(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(z.ZodError));
  });
});

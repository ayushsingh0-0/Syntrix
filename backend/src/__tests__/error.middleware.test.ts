import { describe, it, expect, vi } from 'vitest';
import errorHandler from '../middleware/error.middleware';
import { ApiError } from '../utils/ApiError';
import { z } from 'zod';
import type { Request, Response } from 'express';

describe('Centralized Error Handling Middleware', () => {
  const mockReq = {
    method: 'POST',
    url: '/api/v1/test',
    originalUrl: '/api/v1/test',
  } as Request;

  it('should return custom status code and message for ApiError', () => {
    const error = new ApiError(404, 'Project resource not found');
    const jsonMock = vi.fn();
    const statusMock = vi.fn().mockReturnValue({ json: jsonMock });

    const mockRes = {
      status: statusMock,
    } as unknown as Response;

    errorHandler(error, mockReq, mockRes, vi.fn());

    expect(statusMock).toHaveBeenCalledWith(404);
    expect(jsonMock).toHaveBeenCalledWith({
      success: false,
      message: 'Project resource not found',
    });
  });

  it('should return 400 with validation issues for Zod errors', () => {
    const schema = z.object({ email: z.string().email() });
    const result = schema.safeParse({ email: 'not-an-email' });

    if (!result.success) {
      const jsonMock = vi.fn();
      const statusMock = vi.fn().mockReturnValue({ json: jsonMock });
      const mockRes = { status: statusMock } as unknown as Response;

      errorHandler(result.error, mockReq, mockRes, vi.fn());

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          errors: expect.any(Array),
        })
      );
    }
  });

  it('should return 500 Internal Server Error for unhandled generic errors', () => {
    const genericError = new Error('Database connection lost');
    const jsonMock = vi.fn();
    const statusMock = vi.fn().mockReturnValue({ json: jsonMock });
    const mockRes = { status: statusMock } as unknown as Response;

    errorHandler(genericError, mockReq, mockRes, vi.fn());

    expect(statusMock).toHaveBeenCalledWith(500);
    expect(jsonMock).toHaveBeenCalledWith({
      success: false,
      message: 'Internal Server Error',
    });
  });
});

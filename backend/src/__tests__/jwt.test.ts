import { describe, it, expect } from 'vitest';
import { generateAccessToken, verifyAccessToken } from '../utils/jwt';
import { UserRole } from '../generated/prisma/client';

describe('JWT Token Utility Suite', () => {
  it('should generate a valid signed JWT access token for a given user', () => {
    const userId = 'user-test-123';
    const role: UserRole = 'USER';

    const token = generateAccessToken(userId, role);
    expect(token).toBeDefined();
    expect(typeof token).toBe('string');
    expect(token.split('.').length).toBe(3);
  });

  it('should successfully verify and decode a valid JWT access token', () => {
    const userId = 'user-test-456';
    const role: UserRole = 'ADMIN';

    const token = generateAccessToken(userId, role);
    const decoded = verifyAccessToken(token);

    expect(decoded).toBeDefined();
    expect(decoded.userId).toBe(userId);
    expect(decoded.role).toBe(role);
  });

  it('should throw an ApiError when verifying a malformed token', () => {
    expect(() => {
      verifyAccessToken('invalid.token.payload');
    }).toThrow();
  });
});

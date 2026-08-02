import { describe, it, expect } from 'vitest';
import { loginSchema, registerSchema } from '@/lib/validations/auth';
import { createGuestSchema, rsvpSchema } from '@/lib/validations/guest';

describe('loginSchema', () => {
  it('accepts valid email and password', () => {
    const result = loginSchema.safeParse({ email: 'test@example.com', password: 'password123' });
    expect(result.success).toBe(true);
  });

  it('rejects invalid email', () => {
    const result = loginSchema.safeParse({ email: 'notanemail', password: 'password123' });
    expect(result.success).toBe(false);
  });

  it('rejects short password', () => {
    const result = loginSchema.safeParse({ email: 'test@example.com', password: '12345' });
    expect(result.success).toBe(false);
  });
});

describe('registerSchema', () => {
  it('accepts valid registration data', () => {
    const result = registerSchema.safeParse({
      name: 'Budi Santoso',
      email: 'budi@example.com',
      password: 'password123',
      confirmPassword: 'password123',
    });
    expect(result.success).toBe(true);
  });

  it('rejects mismatched passwords', () => {
    const result = registerSchema.safeParse({
      name: 'Budi Santoso',
      email: 'budi@example.com',
      password: 'password123',
      confirmPassword: 'different',
    });
    expect(result.success).toBe(false);
  });
});

describe('createGuestSchema', () => {
  it('accepts valid guest data', () => {
    const result = createGuestSchema.safeParse({
      name: 'Siti Rahayu',
      invitationId: 'cuid123',
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty name', () => {
    const result = createGuestSchema.safeParse({ name: '', invitationId: 'cuid123' });
    expect(result.success).toBe(false);
  });
});

describe('rsvpSchema', () => {
  it('accepts attending with guest count', () => {
    const result = rsvpSchema.safeParse({
      name: 'Siti',
      status: 'ATTENDING',
      guestCount: 2,
    });
    expect(result.success).toBe(true);
  });

  it('accepts not attending', () => {
    const result = rsvpSchema.safeParse({
      name: 'Siti',
      status: 'NOT_ATTENDING',
    });
    expect(result.success).toBe(true);
  });
});

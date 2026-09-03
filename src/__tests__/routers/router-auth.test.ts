import { describe, it, expect, vi } from 'vitest';
import { appRouter } from '@/server/root';
import { createCallerFactory } from '@/server/trpc';
import type { PrismaClient } from '@prisma/client';

const createCaller = createCallerFactory(appRouter);

describe('tRPC Routers Authorization & Protection', () => {
  const mockPrisma = {
    user: {
      findUnique: vi.fn(),
      count: vi.fn().mockResolvedValue(10),
    },
    invitation: {
      count: vi.fn().mockResolvedValue(5),
    },
    guest: {
      count: vi.fn().mockResolvedValue(20),
    },
    wish: {
      count: vi.fn().mockResolvedValue(15),
    },
    payment: {
      findFirst: vi.fn(),
    },
    promoCode: {
      findUnique: vi.fn(),
    },
  } as unknown as PrismaClient;

  it('rejects unauthenticated user accessing protectedProcedure', async () => {
    const caller = createCaller({
      session: null,
      prisma: mockPrisma,
      ip: '127.0.0.1',
    });

    await expect(caller.invitation.list()).rejects.toThrow(/UNAUTHORIZED/);
  });

  it('rejects non-admin user accessing adminProcedure with FORBIDDEN', async () => {
    const caller = createCaller({
      session: {
        user: {
          id: 'user-regular',
          name: 'Regular User',
          email: 'user@example.com',
          role: 'USER',
          subscriptionTier: 'FREE',
        },
        expires: '9999-12-31',
      },
      prisma: mockPrisma,
      ip: '127.0.0.1',
    });

    await expect(caller.admin.getStats()).rejects.toThrow(/FORBIDDEN/);
  });

  it('allows ADMIN user to access adminProcedure', async () => {
    const caller = createCaller({
      session: {
        user: {
          id: 'admin-1',
          name: 'Admin User',
          email: 'admin@example.com',
          role: 'ADMIN',
          subscriptionTier: 'BUSINESS',
        },
        expires: '9999-12-31',
      },
      prisma: mockPrisma,
      ip: '127.0.0.1',
    });

    const stats = await caller.admin.getStats();
    expect(stats).toEqual({
      totalUsers: 10,
      totalInvitations: 5,
      totalGuests: 20,
      totalWishes: 15,
      publishedInvitations: 5,
    });
  });

  it('prevents promo code reuse if user already redeemed it', async () => {
    const caller = createCaller({
      session: {
        user: {
          id: 'user-1',
          name: 'Regular User',
          email: 'user@example.com',
          role: 'USER',
          subscriptionTier: 'FREE',
        },
        expires: '9999-12-31',
      },
      prisma: {
        ...mockPrisma,
        promoCode: {
          findUnique: vi.fn().mockResolvedValue({
            code: 'DISKON100',
            discountType: 'PERCENTAGE',
            discountValue: 100,
            maxUses: 10,
            currentUses: 1,
            validFrom: new Date(Date.now() - 10000),
            validUntil: new Date(Date.now() + 100000),
            applicablePlans: '[]',
            isActive: true,
          }),
        },
        payment: {
          findFirst: vi.fn().mockResolvedValue({ id: 'pay_past', status: 'PAID' }),
        },
      } as unknown as PrismaClient,
      ip: '127.0.0.1',
    });

    await expect(
      caller.payment.previewPromo({
        plan: 'STARTER',
        code: 'DISKON100',
      })
    ).rejects.toThrow(/Anda sudah pernah menggunakan kode promo ini/);
  });
});


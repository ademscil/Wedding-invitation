import { z } from 'zod';

export const createGuestSchema = z.object({
  invitationId: z.string(),
  name: z.string().min(1, 'Nama tamu wajib diisi'),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  groupName: z.string().optional(),
});

export const rsvpSchema = z.object({
  name: z.string().min(1, 'Nama wajib diisi'),
  status: z.enum(['ATTENDING', 'NOT_ATTENDING', 'MAYBE']),
  guestCount: z.number().min(1).max(10).default(1),
  session: z.string().optional(),
  dietaryNotes: z.string().optional(),
});

export const wishSchema = z.object({
  guestName: z.string().min(1, 'Nama wajib diisi'),
  message: z.string().min(1, 'Ucapan wajib diisi').max(500, 'Ucapan maksimal 500 karakter'),
});

export type CreateGuestInput = z.infer<typeof createGuestSchema>;
export type RsvpInput = z.infer<typeof rsvpSchema>;
export type WishInput = z.infer<typeof wishSchema>;

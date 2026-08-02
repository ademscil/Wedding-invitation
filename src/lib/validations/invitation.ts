import { z } from 'zod';

export const eventSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Nama acara wajib diisi'),
  date: z.string().min(1, 'Tanggal wajib diisi'),
  startTime: z.string().min(1, 'Waktu mulai wajib diisi'),
  endTime: z.string().optional(),
  venue: z.string().min(1, 'Tempat wajib diisi'),
  address: z.string().min(1, 'Alamat wajib diisi'),
  mapUrl: z.string().optional(),
});

export const bankAccountSchema = z.object({
  id: z.string(),
  bankName: z.string().min(1, 'Nama bank wajib diisi'),
  accountNumber: z.string().min(1, 'Nomor rekening wajib diisi'),
  accountHolder: z.string().min(1, 'Nama pemilik rekening wajib diisi'),
});

export const galleryImageSchema = z.object({
  id: z.string(),
  url: z.string().url(),
  caption: z.string().optional(),
});

export const loveStorySchema = z.object({
  id: z.string(),
  year: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  image: z.string().optional(),
});

export const invitationSettingsSchema = z.object({
  primaryColor: z.string().optional(),
  secondaryColor: z.string().optional(),
  fontFamily: z.string().optional(),
  musicUrl: z.string().optional(),
  showCountdown: z.boolean().optional().default(true),
  showLoveStory: z.boolean().optional().default(true),
  showGallery: z.boolean().optional().default(true),
  showRsvp: z.boolean().optional().default(true),
  showGift: z.boolean().optional().default(true),
  showGuestbook: z.boolean().optional().default(true),
  showMaps: z.boolean().optional().default(true),
  showDressCode: z.boolean().optional().default(false),
  showStreaming: z.boolean().optional().default(false),
});

export const createInvitationSchema = z.object({
  templateId: z.string().optional(),
  brideName: z.string().min(1, 'Nama mempelai wanita wajib diisi'),
  groomName: z.string().min(1, 'Nama mempelai pria wajib diisi'),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/, 'Slug hanya boleh huruf kecil, angka, dan strip'),
});

export const updateInvitationSchema = z.object({
  templateId: z.string().optional(),
  brideName: z.string().optional(),
  groomName: z.string().optional(),
  brideParents: z.string().optional(),
  groomParents: z.string().optional(),
  bridePhoto: z.string().optional(),
  groomPhoto: z.string().optional(),
  weddingDate: z.string().optional(),
  slug: z.string().regex(/^[a-z0-9-]+$/).optional(),
  quote: z.string().optional(),
  dressCode: z.string().optional(),
  streamingUrl: z.string().optional(),
  settings: invitationSettingsSchema.optional(),
  events: z.array(eventSchema).optional(),
  bankAccounts: z.array(bankAccountSchema).optional(),
  galleryImages: z.array(galleryImageSchema).optional(),
  loveStory: z.array(loveStorySchema).optional(),
});

export type CreateInvitationInput = z.infer<typeof createInvitationSchema>;
export type UpdateInvitationInput = z.infer<typeof updateInvitationSchema>;

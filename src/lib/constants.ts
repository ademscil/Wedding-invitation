export const APP_NAME = 'WedInvite';
export const APP_DESCRIPTION = 'Platform undangan pernikahan digital premium';

export const SUBSCRIPTION_TIERS = {
  FREE: {
    name: 'Gratis',
    price: 0,
    maxInvitations: 1,
    maxGuests: 50,
    maxGalleryImages: 5,
    maxEvents: 1,
    maxBankAccounts: 0,
    hasLoveStory: false,
    hasCustomMusic: false,
    hasCustomDomain: false,
    hasWatermark: true,
    hasAnalytics: false,
    hasBroadcast: false,
    hasExport: false,
    hasQrCheckin: false,
    duration: '3 bulan',
  },
  STARTER: {
    name: 'Starter',
    price: 99000,
    maxInvitations: 3,
    maxGuests: 200,
    maxGalleryImages: 15,
    maxEvents: 2,
    maxBankAccounts: 1,
    hasLoveStory: true,
    hasCustomMusic: false,
    hasCustomDomain: false,
    hasWatermark: true,
    hasAnalytics: true,
    hasBroadcast: false,
    hasExport: false,
    hasQrCheckin: false,
    duration: '6 bulan',
  },
  PREMIUM: {
    name: 'Premium',
    price: 199000,
    maxInvitations: 10,
    maxGuests: 500,
    maxGalleryImages: 30,
    maxEvents: 3,
    maxBankAccounts: 3,
    hasLoveStory: true,
    hasCustomMusic: true,
    hasCustomDomain: true,
    hasWatermark: false,
    hasAnalytics: true,
    hasBroadcast: true,
    hasExport: true,
    hasQrCheckin: false,
    duration: '12 bulan',
  },
  BUSINESS: {
    name: 'Business',
    price: 499000,
    maxInvitations: -1, // unlimited
    maxGuests: -1,
    maxGalleryImages: -1,
    maxEvents: -1,
    maxBankAccounts: -1,
    hasLoveStory: true,
    hasCustomMusic: true,
    hasCustomDomain: true,
    hasWatermark: false,
    hasAnalytics: true,
    hasBroadcast: true,
    hasExport: true,
    hasQrCheckin: true,
    duration: 'Lifetime (2 tahun)',
  },
} as const;

export type SubscriptionTier = keyof typeof SUBSCRIPTION_TIERS;

export const TEMPLATE_CATEGORIES = [
  { value: 'ELEGANT', label: 'Elegant' },
  { value: 'MODERN', label: 'Modern' },
  { value: 'MINIMALIST', label: 'Minimalist' },
  { value: 'ISLAMIC', label: 'Islami' },
  { value: 'CHRISTIAN', label: 'Kristen' },
  { value: 'RUSTIC', label: 'Rustic' },
  { value: 'TRADITIONAL', label: 'Tradisional' },
  { value: 'CHINESE', label: 'Chinese' },
] as const;

export const RSVP_STATUS = {
  PENDING: { label: 'Menunggu', color: 'bg-yellow-100 text-yellow-800' },
  ATTENDING: { label: 'Hadir', color: 'bg-green-100 text-green-800' },
  NOT_ATTENDING: { label: 'Tidak Hadir', color: 'bg-red-100 text-red-800' },
  MAYBE: { label: 'Mungkin', color: 'bg-blue-100 text-blue-800' },
} as const;

export const INVITATION_STATUS = {
  DRAFT: { label: 'Draft', color: 'bg-gray-100 text-gray-800' },
  PUBLISHED: { label: 'Published', color: 'bg-green-100 text-green-800' },
  ARCHIVED: { label: 'Archived', color: 'bg-yellow-100 text-yellow-800' },
  EXPIRED: { label: 'Expired', color: 'bg-red-100 text-red-800' },
} as const;

export const GUEST_GROUPS = [
  'Keluarga',
  'Teman',
  'Kantor',
  'Tetangga',
  'Lainnya',
] as const;

export const BANKS = [
  { name: 'BCA', code: 'bca' },
  { name: 'Mandiri', code: 'mandiri' },
  { name: 'BNI', code: 'bni' },
  { name: 'BRI', code: 'bri' },
  { name: 'CIMB Niaga', code: 'cimb' },
  { name: 'Bank Syariah Indonesia', code: 'bsi' },
  { name: 'Bank Jago', code: 'jago' },
  { name: 'Permata', code: 'permata' },
] as const;

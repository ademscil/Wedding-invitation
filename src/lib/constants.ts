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
    hasWatermark: true,
    hasAnalytics: false,
    hasBroadcast: false,
    hasExport: false,
    hasQrCheckin: false,
    hasEventPlanner: false,
    duration: '3 bulan',
    durationMonths: 3,
  },
  STARTER: {
    name: 'Starter',
    price: 49000,
    maxInvitations: 1,
    maxGuests: 300,
    maxGalleryImages: 15,
    maxEvents: 2,
    maxBankAccounts: 2,
    hasLoveStory: true,
    hasCustomMusic: true,
    hasWatermark: true,
    hasAnalytics: true,
    hasBroadcast: false,
    hasExport: false,
    hasQrCheckin: false,
    hasEventPlanner: true,
    duration: '6 bulan',
    durationMonths: 6,
  },
  PREMIUM: {
    name: 'Premium',
    price: 99000,
    maxInvitations: 5,
    maxGuests: 1000,
    maxGalleryImages: 30,
    maxEvents: 4,
    maxBankAccounts: 4,
    hasLoveStory: true,
    hasCustomMusic: true,
    hasWatermark: false,
    hasAnalytics: true,
    hasBroadcast: true,
    hasExport: true,
    hasQrCheckin: true,
    hasEventPlanner: true,
    duration: '12 bulan',
    durationMonths: 12,
  },
  BUSINESS: {
    name: 'Business',
    price: 299000,
    maxInvitations: -1, // unlimited
    maxGuests: -1,
    maxGalleryImages: -1,
    maxEvents: -1,
    maxBankAccounts: -1,
    hasLoveStory: true,
    hasCustomMusic: true,
    hasWatermark: false,
    hasAnalytics: true,
    hasBroadcast: true,
    hasExport: true,
    hasQrCheckin: true,
    hasEventPlanner: true,
    duration: 'Lifetime (2 tahun)',
    durationMonths: 24,
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

export const PLANNER_CATEGORIES = [
  { value: 'VENUE', label: 'Tempat' },
  { value: 'CATERING', label: 'Katering' },
  { value: 'DECOR', label: 'Dekorasi' },
  { value: 'ATTIRE', label: 'Busana & Rias' },
  { value: 'DOCUMENTATION', label: 'Dokumentasi' },
  { value: 'ENTERTAINMENT', label: 'Hiburan' },
  { value: 'OTHER', label: 'Lainnya' },
] as const;

export const VENDOR_STATUS = {
  CONTACTED: { label: 'Dihubungi', color: 'bg-gray-100 text-gray-800' },
  NEGOTIATING: { label: 'Negosiasi', color: 'bg-blue-100 text-blue-800' },
  BOOKED: { label: 'Dibooking', color: 'bg-yellow-100 text-yellow-800' },
  PAID: { label: 'Lunas', color: 'bg-green-100 text-green-800' },
  CANCELLED: { label: 'Batal', color: 'bg-red-100 text-red-800' },
} as const;

export const CHECKLIST_PHASES = [
  { value: '12_MONTHS', label: '12 bulan sebelum' },
  { value: '6_MONTHS', label: '6 bulan sebelum' },
  { value: '3_MONTHS', label: '3 bulan sebelum' },
  { value: '1_MONTH', label: '1 bulan sebelum' },
  { value: '1_WEEK', label: '1 minggu sebelum' },
  { value: 'DAY_OF', label: 'Hari-H' },
  { value: 'GENERAL', label: 'Umum' },
] as const;

import type { Invitation, Guest, Wish, Template, User } from '@prisma/client';

export type InvitationWithRelations = Invitation & {
  template: Template | null;
  guests: Guest[];
  wishes: Wish[];
  _count?: {
    guests: number;
    wishes: number;
    analyticsEvents: number;
  };
};

export type InvitationSettings = {
  primaryColor?: string;
  secondaryColor?: string;
  fontFamily?: string;
  musicUrl?: string;
  showCountdown?: boolean;
  showLoveStory?: boolean;
  showGallery?: boolean;
  showRsvp?: boolean;
  showGift?: boolean;
  showGuestbook?: boolean;
  showMaps?: boolean;
  showDressCode?: boolean;
  showStreaming?: boolean;
};

export type InvitationEvent = {
  id: string;
  name: string;
  date: string;
  startTime: string;
  endTime?: string;
  venue: string;
  address: string;
  mapUrl?: string;
};

export type BankAccount = {
  id: string;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
};

export type GalleryImage = {
  id: string;
  url: string;
  caption?: string;
};

export type LoveStoryEntry = {
  id: string;
  year: string;
  title: string;
  description: string;
  image?: string;
};

export type SafeUser = Omit<User, 'hashedPassword'>;

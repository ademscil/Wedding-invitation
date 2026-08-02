import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  InvitationEvent,
  BankAccount,
  GalleryImage,
  LoveStoryEntry,
  InvitationSettings,
} from '@/types';

interface BuilderState {
  currentStep: number;
  invitationId: string | null;
  templateId: string | null;
  brideName: string;
  groomName: string;
  brideParents: string;
  groomParents: string;
  bridePhoto: string;
  groomPhoto: string;
  weddingDate: string;
  slug: string;
  quote: string;
  dressCode: string;
  streamingUrl: string;
  events: InvitationEvent[];
  bankAccounts: BankAccount[];
  galleryImages: GalleryImage[];
  loveStory: LoveStoryEntry[];
  settings: InvitationSettings;

  setStep: (step: number) => void;
  setInvitationId: (id: string) => void;
  setTemplateId: (id: string) => void;
  setCoupleInfo: (data: Partial<BuilderState>) => void;
  setEvents: (events: InvitationEvent[]) => void;
  setBankAccounts: (accounts: BankAccount[]) => void;
  setGalleryImages: (images: GalleryImage[]) => void;
  setLoveStory: (entries: LoveStoryEntry[]) => void;
  setSettings: (settings: Partial<InvitationSettings>) => void;
  setField: <K extends keyof BuilderState>(
    key: K,
    value: BuilderState[K]
  ) => void;
  reset: () => void;
}

const initialState = {
  currentStep: 0,
  invitationId: null,
  templateId: null,
  brideName: '',
  groomName: '',
  brideParents: '',
  groomParents: '',
  bridePhoto: '',
  groomPhoto: '',
  weddingDate: '',
  slug: '',
  quote: '',
  dressCode: '',
  streamingUrl: '',
  events: [],
  bankAccounts: [],
  galleryImages: [],
  loveStory: [],
  settings: {
    showCountdown: true,
    showLoveStory: true,
    showGallery: true,
    showRsvp: true,
    showGift: true,
    showGuestbook: true,
    showMaps: true,
    showDressCode: false,
    showStreaming: false,
  },
};

export const useBuilderStore = create<BuilderState>()(
  persist(
    (set) => ({
      ...initialState,

      setStep: (step) => set({ currentStep: step }),
      setInvitationId: (id) => set({ invitationId: id }),
      setTemplateId: (id) => set({ templateId: id }),
      setCoupleInfo: (data) => set(data),
      setEvents: (events) => set({ events }),
      setBankAccounts: (accounts) => set({ bankAccounts: accounts }),
      setGalleryImages: (images) => set({ galleryImages: images }),
      setLoveStory: (entries) => set({ loveStory: entries }),
      setSettings: (settings) =>
        set((state) => ({
          settings: { ...state.settings, ...settings },
        })),
      setField: (key, value) => set({ [key]: value }),
      reset: () => set(initialState),
    }),
    {
      name: 'wedinvite-builder',
    }
  )
);

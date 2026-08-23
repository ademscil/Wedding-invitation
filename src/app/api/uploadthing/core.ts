import { createUploadthing, type FileRouter } from 'uploadthing/next';
import { UploadThingError } from 'uploadthing/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const f = createUploadthing();

async function requireUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    throw new UploadThingError('Unauthorized');
  }
  return session.user;
}

export const ourFileRouter = {
  invitationImage: f({ image: { maxFileSize: '4MB', maxFileCount: 30 } })
    .middleware(async () => {
      const user = await requireUser();
      return { userId: user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      return { uploadedBy: metadata.userId, url: file.url };
    }),
  invitationMusic: f({ audio: { maxFileSize: '8MB', maxFileCount: 1 } })
    .middleware(async () => {
      const user = await requireUser();
      return { userId: user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      return { uploadedBy: metadata.userId, url: file.url };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;

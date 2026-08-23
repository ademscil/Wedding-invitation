'use client';

import { UploadButton as RawUploadButton } from '@/lib/uploadthing';
import type { ComponentProps } from 'react';
import { cn } from '@/lib/utils';

type RawProps = ComponentProps<typeof RawUploadButton>;

// Wraps UploadThing's UploadButton with consistent brand styling so it matches
// the rest of the design system instead of UploadThing's default look.
export function ThemedUploadButton({
  label = 'Upload File',
  className,
  ...props
}: Omit<RawProps, 'appearance' | 'content'> & { label?: string; className?: string }) {
  return (
    <RawUploadButton
      {...props}
      className={cn('ut-button:!h-10 ut-button:!w-auto', className)}
      content={{
        button: ({ isUploading }) => (isUploading ? 'Mengunggah...' : label),
      }}
      appearance={{
        button:
          'inline-flex items-center justify-center whitespace-nowrap rounded-md !bg-primary px-4 !text-sm !font-medium text-primary-foreground transition-colors hover:!bg-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ut-uploading:cursor-not-allowed ut-uploading:opacity-60 after:!bg-primary-800',
        container: 'flex w-max flex-col items-start gap-1',
        allowedContent: 'text-xs text-muted-foreground',
      }}
    />
  );
}

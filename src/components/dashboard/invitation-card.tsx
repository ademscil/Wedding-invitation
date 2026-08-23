'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Edit,
  Eye,
  Share2,
  Trash2,
  Copy,
  Users,
  BarChart3,
  Calendar,
  Heart,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { formatDate } from '@/lib/utils';
import { INVITATION_STATUS } from '@/lib/constants';
import { trpc } from '@/lib/trpc/client';

interface InvitationCardProps {
  invitation: {
    id: string;
    slug: string;
    brideName: string;
    groomName: string;
    weddingDate: Date | string | null;
    status: string;
    template?: { name: string; thumbnail: string | null } | null;
    _count: {
      guests: number;
      wishes: number;
      analyticsEvents: number;
    };
  };
}

export function InvitationCard({ invitation }: InvitationCardProps) {
  const router = useRouter();
  const utils = trpc.useUtils();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const deleteMutation = trpc.invitation.delete.useMutation({
    onSuccess: () => {
      toast.success('Undangan berhasil dihapus');
      utils.invitation.list.invalidate();
      setShowDeleteConfirm(false);
    },
    onError: () => {
      toast.error('Gagal menghapus undangan');
    },
  });

  const duplicateMutation = trpc.invitation.duplicate.useMutation({
    onSuccess: (copy) => {
      toast.success('Undangan disalin. Sekarang tinggal diubah seperlunya.');
      utils.invitation.list.invalidate();
      // Straight into the copy: duplicating is always a prelude to editing.
      router.push(`/dashboard/invitations/${copy.id}`);
    },
    onError: (error) => {
      toast.error(error.message || 'Gagal menyalin undangan');
    },
  });

  const statusConfig =
    INVITATION_STATUS[invitation.status as keyof typeof INVITATION_STATUS] ||
    INVITATION_STATUS.DRAFT;

  const handleShare = async () => {
    const url = `${window.location.origin}/${invitation.slug}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Link undangan disalin!');
    } catch {
      toast.error('Gagal menyalin link');
    }
  };

  const handleDelete = () => {
    setShowDeleteConfirm(true);
  };

  return (
    <Card className="group overflow-hidden transition-shadow hover:shadow-md">
      {/* Template thumbnail placeholder */}
      <div className="relative h-40 bg-gradient-to-br from-primary/10 to-primary/5">
        <div className="flex h-full items-center justify-center">
          <Heart className="h-12 w-12 text-primary/30" />
        </div>
        <div className="absolute right-2 top-2">
          <Badge
            variant={invitation.status === 'PUBLISHED' ? 'success' : 'secondary'}
            className="text-xs"
          >
            {statusConfig.label}
          </Badge>
        </div>
      </div>

      <CardHeader className="pb-2">
        <Link
          href={`/dashboard/invitations/${invitation.id}`}
          className="hover:underline"
        >
          <h3 className="truncate text-lg font-semibold">
            {invitation.brideName && invitation.groomName
              ? `${invitation.brideName} & ${invitation.groomName}`
              : 'Undangan Baru'}
          </h3>
        </Link>
        {invitation.weddingDate && (
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" />
            {formatDate(invitation.weddingDate, 'short')}
          </div>
        )}
      </CardHeader>

      <CardContent className="pb-3">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Users className="h-3.5 w-3.5" />
            {invitation._count.guests} tamu
          </span>
          <span className="flex items-center gap-1">
            <BarChart3 className="h-3.5 w-3.5" />
            {invitation._count.analyticsEvents} views
          </span>
        </div>
      </CardContent>

      <CardFooter className="gap-1 border-t bg-muted/30 px-3 py-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() =>
            router.push(`/dashboard/invitations/${invitation.id}`)
          }
        >
          <Edit className="mr-1 h-3.5 w-3.5" />
          Edit
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => window.open(`/${invitation.slug}`, '_blank')}
        >
          <Eye className="mr-1 h-3.5 w-3.5" />
          Preview
        </Button>
        <Button variant="ghost" size="sm" onClick={handleShare}>
          <Share2 className="mr-1 h-3.5 w-3.5" />
          Share
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => duplicateMutation.mutate({ id: invitation.id })}
          disabled={duplicateMutation.isLoading}
          title="Buat salinan undangan ini"
        >
          <Copy className="mr-1 h-3.5 w-3.5" />
          {duplicateMutation.isLoading ? 'Menyalin...' : 'Salin'}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="ml-auto text-destructive hover:text-destructive"
          onClick={handleDelete}
          disabled={deleteMutation.isLoading}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </CardFooter>

      <ConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title="Hapus Undangan?"
        description={`Undangan ${invitation.brideName} & ${invitation.groomName} beserta seluruh data tamu, ucapan, dan riwayatnya akan dihapus permanen. Tindakan ini tidak bisa dibatalkan.`}
        confirmLabel="Ya, Hapus"
        isLoading={deleteMutation.isLoading}
        onConfirm={() => deleteMutation.mutate({ id: invitation.id })}
      />
    </Card>
  );
}

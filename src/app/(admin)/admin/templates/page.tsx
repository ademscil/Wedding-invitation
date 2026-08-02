'use client';

import { trpc } from '@/lib/trpc/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/utils';

export default function AdminTemplatesPage() {
  const { data: templates, isLoading, refetch } = trpc.admin.listTemplates.useQuery();
  const updateTemplate = trpc.admin.updateTemplate.useMutation({
    onSuccess: () => { toast.success('Template diperbarui'); refetch(); },
    onError: () => toast.error('Gagal memperbarui template'),
  });

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Manajemen Template</h1>
        <p className="text-sm text-muted-foreground">{templates?.length ?? 0} template terdaftar</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Template</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12" />)}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-3 pr-4 font-medium">Nama</th>
                    <th className="pb-3 pr-4 font-medium">Kategori</th>
                    <th className="pb-3 pr-4 font-medium">Component</th>
                    <th className="pb-3 pr-4 font-medium">Premium</th>
                    <th className="pb-3 pr-4 font-medium">Harga</th>
                    <th className="pb-3 font-medium">Aktif</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {templates?.map((tpl) => (
                    <tr key={tpl.id} className="hover:bg-muted/50">
                      <td className="py-3 pr-4 font-medium">{tpl.name}</td>
                      <td className="py-3 pr-4 text-xs text-muted-foreground">{tpl.category}</td>
                      <td className="py-3 pr-4 font-mono text-xs">{tpl.componentName}</td>
                      <td className="py-3 pr-4">
                        <input
                          type="checkbox"
                          checked={tpl.isPremium}
                          onChange={(e) =>
                            updateTemplate.mutate({ id: tpl.id, isPremium: e.target.checked })
                          }
                          className="h-4 w-4 rounded"
                        />
                      </td>
                      <td className="py-3 pr-4 text-xs">
                        {tpl.isPremium ? formatCurrency(tpl.price ?? 0) : 'Gratis'}
                      </td>
                      <td className="py-3">
                        <input
                          type="checkbox"
                          checked={tpl.isActive}
                          onChange={(e) =>
                            updateTemplate.mutate({ id: tpl.id, isActive: e.target.checked })
                          }
                          className="h-4 w-4 rounded"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

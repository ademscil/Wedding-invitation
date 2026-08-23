'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Wallet,
  Store,
  ListChecks,
  AlertTriangle,
  Sparkles,
  Users,
  Armchair,
} from 'lucide-react';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { toast } from 'sonner';
import { trpc } from '@/lib/trpc/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { InvitationTabs } from '@/components/dashboard/invitation-tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useFeature, FeatureLocked } from '@/components/dashboard/feature-gate';
import { SeatingPanel } from '@/components/dashboard/seating-panel';
import { formatCurrency } from '@/lib/utils';
import {
  PLANNER_CATEGORIES,
  VENDOR_STATUS,
  CHECKLIST_PHASES,
} from '@/lib/constants';

type Tab = 'budget' | 'vendors' | 'checklist' | 'seating';

type Category = (typeof PLANNER_CATEGORIES)[number]['value'];
type VendorStatusKey = keyof typeof VENDOR_STATUS;
type Phase = (typeof CHECKLIST_PHASES)[number]['value'];

const categoryLabel = (value: string) =>
  PLANNER_CATEGORIES.find((c) => c.value === value)?.label ?? value;

const phaseLabel = (value: string) =>
  CHECKLIST_PHASES.find((p) => p.value === value)?.label ?? value;

/** Parses a rupiah input, tolerating separators the user types. */
function parseMoney(value: string): number {
  const digits = value.replace(/[^\d]/g, '');
  return digits ? Number.parseInt(digits, 10) : 0;
}

function SummaryTile({
  icon: Icon,
  label,
  value,
  hint,
  tone,
}: {
  icon: typeof Wallet;
  label: string;
  value: string;
  hint?: string;
  tone?: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-start gap-3 pt-6">
        <div className="rounded-full bg-muted p-2.5">
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className={`truncate text-lg font-semibold ${tone ?? ''}`}>{value}</p>
          {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

export default function PlannerPage() {
  const { id } = useParams<{ id: string }>();
  const hasPlanner = useFeature('hasEventPlanner');
  const enabled = !!id && hasPlanner === true;

  const [tab, setTab] = useState<Tab>('budget');
  const [confirmDelete, setConfirmDelete] = useState<
    { kind: 'budget' | 'vendors' | 'checklist'; id: string; label: string } | null
  >(null);

  const utils = trpc.useUtils();

  const { data: summary } = trpc.planner.getSummary.useQuery(
    { invitationId: id },
    { enabled }
  );
  const { data: budget, isLoading: budgetLoading } =
    trpc.planner.listBudget.useQuery({ invitationId: id }, { enabled });
  const { data: vendors, isLoading: vendorsLoading } =
    trpc.planner.listVendors.useQuery({ invitationId: id }, { enabled });
  const { data: checklist, isLoading: checklistLoading } =
    trpc.planner.listChecklist.useQuery({ invitationId: id }, { enabled });

  /**
   * `refetchType: 'all'` matters here: the four lists live behind a tab, so the
   * inactive ones are only marked stale by a plain invalidate and would keep
   * showing the previous result until the panel remounts.
   */
  const refresh = () =>
    Promise.all([
      utils.planner.getSummary.invalidate({ invitationId: id }, { refetchType: 'all' }),
      utils.planner.listBudget.invalidate({ invitationId: id }, { refetchType: 'all' }),
      utils.planner.listVendors.invalidate({ invitationId: id }, { refetchType: 'all' }),
      utils.planner.listChecklist.invalidate({ invitationId: id }, { refetchType: 'all' }),
    ]);

  const onError = (error: { message: string }) =>
    toast.error(error.message || 'Terjadi kesalahan');

  const createBudget = trpc.planner.createBudget.useMutation({
    onSuccess: () => {
      toast.success('Item anggaran ditambahkan');
      refresh();
    },
    onError,
  });
  /**
   * Toggles are applied to the cache first and rolled back on failure.
   * Without this the checkbox is driven purely by server state, so it visibly
   * snaps back to its old value until the refetch lands.
   */
  const updateBudget = trpc.planner.updateBudget.useMutation({
    onMutate: async (vars) => {
      await utils.planner.listBudget.cancel({ invitationId: id });
      const previous = utils.planner.listBudget.getData({ invitationId: id });
      utils.planner.listBudget.setData({ invitationId: id }, (old) =>
        old?.map((item) => (item.id === vars.id ? { ...item, ...vars } : item))
      );
      return { previous };
    },
    onError: (error, _vars, context) => {
      if (context?.previous) {
        utils.planner.listBudget.setData({ invitationId: id }, context.previous);
      }
      onError(error);
    },
    onSettled: refresh,
  });
  const deleteBudget = trpc.planner.deleteBudget.useMutation({
    onSuccess: () => {
      toast.success('Item anggaran dihapus');
      refresh();
    },
    onError,
  });

  const createVendor = trpc.planner.createVendor.useMutation({
    onSuccess: () => {
      toast.success('Vendor ditambahkan');
      refresh();
    },
    onError,
  });
  const updateVendor = trpc.planner.updateVendor.useMutation({
    onMutate: async (vars) => {
      await utils.planner.listVendors.cancel({ invitationId: id });
      const previous = utils.planner.listVendors.getData({ invitationId: id });
      utils.planner.listVendors.setData({ invitationId: id }, (old) =>
        old?.map((v) => (v.id === vars.id ? { ...v, ...vars } : v))
      );
      return { previous };
    },
    onError: (error, _vars, context) => {
      if (context?.previous) {
        utils.planner.listVendors.setData({ invitationId: id }, context.previous);
      }
      onError(error);
    },
    onSettled: refresh,
  });
  const deleteVendor = trpc.planner.deleteVendor.useMutation({
    onSuccess: () => {
      toast.success('Vendor dihapus');
      refresh();
    },
    onError,
  });

  const createChecklist = trpc.planner.createChecklist.useMutation({
    onSuccess: () => {
      toast.success('Tugas ditambahkan');
      refresh();
    },
    onError,
  });
  const updateChecklist = trpc.planner.updateChecklist.useMutation({
    onMutate: async (vars) => {
      await utils.planner.listChecklist.cancel({ invitationId: id });
      const previous = utils.planner.listChecklist.getData({ invitationId: id });
      utils.planner.listChecklist.setData({ invitationId: id }, (old) =>
        old?.map((task) =>
          task.id === vars.id
            ? { ...task, ...vars, dueDate: task.dueDate }
            : task
        )
      );
      return { previous };
    },
    onError: (error, _vars, context) => {
      if (context?.previous) {
        utils.planner.listChecklist.setData(
          { invitationId: id },
          context.previous
        );
      }
      onError(error);
    },
    onSettled: refresh,
  });
  const deleteChecklist = trpc.planner.deleteChecklist.useMutation({
    onSuccess: () => {
      toast.success('Tugas dihapus');
      refresh();
    },
    onError,
  });
  const seedChecklist = trpc.planner.seedChecklist.useMutation({
    onSuccess: (result) => {
      if (result.alreadySeeded) {
        toast.info('Checklist sudah berisi tugas.');
        return;
      }
      toast.success(`${result.created} tugas standar dimuat`);
      refresh();
    },
    onError,
  });

  // Draft state for the inline "add" rows
  const [budgetForm, setBudgetForm] = useState({
    name: '',
    category: 'VENUE' as Category,
    estimatedCost: '',
  });
  const [vendorForm, setVendorForm] = useState({
    name: '',
    category: 'VENUE' as Category,
    phone: '',
    price: '',
  });
  const [taskForm, setTaskForm] = useState({
    title: '',
    phase: 'GENERAL' as Phase,
    dueDate: '',
  });

  if (hasPlanner === false) {
    return (
      <div className="p-6">
        <FeatureLocked
          title="Event Planner belum tersedia"
          description="Kelola anggaran, vendor, dan checklist persiapan pernikahan dalam satu tempat."
          requiredPlan="Starter"
        />
      </div>
    );
  }

  const handleDelete = () => {
    if (!confirmDelete) return;
    const { kind, id: rowId } = confirmDelete;
    if (kind === 'budget') deleteBudget.mutate({ id: rowId });
    if (kind === 'vendors') deleteVendor.mutate({ id: rowId });
    if (kind === 'checklist') deleteChecklist.mutate({ id: rowId });
    setConfirmDelete(null);
  };

  const tabs: Array<{ key: Tab; label: string; icon: typeof Wallet }> = [
    { key: 'budget', label: 'Anggaran', icon: Wallet },
    { key: 'vendors', label: 'Vendor', icon: Store },
    { key: 'checklist', label: 'Checklist', icon: ListChecks },
    { key: 'seating', label: 'Denah Kursi', icon: Armchair },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href={`/dashboard/invitations/${id}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold sm:text-2xl">Event Planner</h1>
          <p className="text-sm text-muted-foreground">
            Anggaran, vendor, dan checklist persiapan
          </p>
        </div>
      </div>

      <InvitationTabs invitationId={id} active="planner" />

      {/* Page navigation */}
      <div className="flex gap-1 rounded-lg border bg-muted/50 p-1">
        <Link
          href={`/dashboard/invitations/${id}`}
          className="flex-1 rounded-md px-4 py-2 text-center text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          Detail
        </Link>
        <Link
          href={`/dashboard/invitations/${id}/guests`}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-md px-4 py-2 text-center text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <Users className="h-4 w-4" />
          Tamu
        </Link>
        <span className="flex flex-1 items-center justify-center gap-1.5 rounded-md bg-white px-4 py-2 text-center text-sm font-medium shadow-sm">
          <ListChecks className="h-4 w-4" />
          Planner
        </span>
      </div>

      {/* Summary */}
      {summary && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryTile
            icon={Wallet}
            label="Total anggaran"
            value={formatCurrency(summary.budget.totalActual)}
            hint={`Estimasi ${formatCurrency(summary.budget.totalEstimated)}`}
            tone={summary.budget.variance > 0 ? 'text-amber-600' : undefined}
          />
          <SummaryTile
            icon={Wallet}
            label="Belum dibayar"
            value={formatCurrency(summary.budget.totalOutstanding)}
            hint={`Lunas ${formatCurrency(summary.budget.totalPaid)}`}
          />
          <SummaryTile
            icon={Store}
            label="Vendor dibooking"
            value={`${summary.vendors.booked} / ${summary.vendors.total}`}
            hint={`Komitmen ${formatCurrency(summary.vendors.committedCost)}`}
          />
          <SummaryTile
            icon={ListChecks}
            label="Progres checklist"
            value={`${summary.checklist.progress}%`}
            hint={
              summary.checklist.overdue > 0
                ? `${summary.checklist.overdue} tugas lewat tenggat`
                : `${summary.checklist.done} dari ${summary.checklist.total} selesai`
            }
            tone={summary.checklist.overdue > 0 ? 'text-red-600' : undefined}
          />
        </div>
      )}

      {summary && summary.budget.variance > 0 && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            Biaya aktual melebihi estimasi awal sebesar{' '}
            <strong>{formatCurrency(summary.budget.variance)}</strong>.
          </span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg border bg-muted/50 p-1">
        {tabs.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setTab(item.key)}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              tab === item.key
                ? 'bg-white shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </button>
        ))}
      </div>

      {/* ------------------------------ Budget ----------------------------- */}
      {tab === 'budget' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Anggaran</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                name="budget-name"
                placeholder="Nama item (mis. Sewa gedung)"
                value={budgetForm.name}
                onChange={(e) =>
                  setBudgetForm((f) => ({ ...f, name: e.target.value }))
                }
                className="sm:flex-1"
              />
              <select
                name="budget-category"
                aria-label="Kategori anggaran"
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                value={budgetForm.category}
                onChange={(e) =>
                  setBudgetForm((f) => ({
                    ...f,
                    category: e.target.value as Category,
                  }))
                }
              >
                {PLANNER_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
              <Input
                name="budget-estimate"
                placeholder="Estimasi biaya"
                inputMode="numeric"
                value={budgetForm.estimatedCost}
                onChange={(e) =>
                  setBudgetForm((f) => ({ ...f, estimatedCost: e.target.value }))
                }
                className="sm:w-44"
              />
              <Button
                onClick={() => {
                  if (!budgetForm.name.trim()) {
                    toast.error('Nama item wajib diisi');
                    return;
                  }
                  createBudget.mutate({
                    invitationId: id,
                    name: budgetForm.name.trim(),
                    category: budgetForm.category,
                    estimatedCost: parseMoney(budgetForm.estimatedCost),
                  });
                  setBudgetForm({
                    name: '',
                    category: budgetForm.category,
                    estimatedCost: '',
                  });
                }}
                disabled={createBudget.isPending}
              >
                <Plus className="mr-1.5 h-4 w-4" />
                Tambah
              </Button>
            </div>

            {budgetLoading ? (
              <Skeleton className="h-24 rounded-lg" />
            ) : !budget?.length ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Belum ada item anggaran.
              </p>
            ) : (
              <div className="divide-y rounded-lg border">
                {budget.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-wrap items-center gap-3 p-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{item.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {categoryLabel(item.category)}
                      </p>
                    </div>
                    <div className="text-right text-sm">
                      <p className="font-medium">
                        {formatCurrency(item.actualCost ?? item.estimatedCost)}
                      </p>
                      {item.actualCost !== null &&
                        item.actualCost !== item.estimatedCost && (
                          <p className="text-xs text-muted-foreground line-through">
                            {formatCurrency(item.estimatedCost)}
                          </p>
                        )}
                    </div>
                    <label className="flex cursor-pointer items-center gap-1.5 text-sm">
                      <input
                        type="checkbox"
                        aria-label={`Tandai ${item.name} lunas`}
                        checked={item.isPaid}
                        onChange={(e) =>
                          updateBudget.mutate({
                            id: item.id,
                            isPaid: e.target.checked,
                          })
                        }
                        className="h-4 w-4"
                      />
                      Lunas
                    </label>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        setConfirmDelete({
                          kind: 'budget',
                          id: item.id,
                          label: item.name,
                        })
                      }
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ------------------------------ Vendors ---------------------------- */}
      {tab === 'vendors' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Vendor</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                name="vendor-name"
                placeholder="Nama vendor"
                value={vendorForm.name}
                onChange={(e) =>
                  setVendorForm((f) => ({ ...f, name: e.target.value }))
                }
                className="sm:flex-1"
              />
              <select
                name="vendor-category"
                aria-label="Kategori vendor"
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                value={vendorForm.category}
                onChange={(e) =>
                  setVendorForm((f) => ({
                    ...f,
                    category: e.target.value as Category,
                  }))
                }
              >
                {PLANNER_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
              <Input
                name="vendor-phone"
                autoComplete="tel"
                placeholder="No. HP"
                value={vendorForm.phone}
                onChange={(e) =>
                  setVendorForm((f) => ({ ...f, phone: e.target.value }))
                }
                className="sm:w-40"
              />
              <Input
                name="vendor-price"
                placeholder="Harga"
                inputMode="numeric"
                value={vendorForm.price}
                onChange={(e) =>
                  setVendorForm((f) => ({ ...f, price: e.target.value }))
                }
                className="sm:w-36"
              />
              <Button
                onClick={() => {
                  if (!vendorForm.name.trim()) {
                    toast.error('Nama vendor wajib diisi');
                    return;
                  }
                  createVendor.mutate({
                    invitationId: id,
                    name: vendorForm.name.trim(),
                    category: vendorForm.category,
                    phone: vendorForm.phone.trim() || undefined,
                    price: vendorForm.price
                      ? parseMoney(vendorForm.price)
                      : undefined,
                    status: 'CONTACTED',
                  });
                  setVendorForm({
                    name: '',
                    category: vendorForm.category,
                    phone: '',
                    price: '',
                  });
                }}
                disabled={createVendor.isPending}
              >
                <Plus className="mr-1.5 h-4 w-4" />
                Tambah
              </Button>
            </div>

            {vendorsLoading ? (
              <Skeleton className="h-24 rounded-lg" />
            ) : !vendors?.length ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Belum ada vendor.
              </p>
            ) : (
              <div className="divide-y rounded-lg border">
                {vendors.map((vendor) => (
                  <div
                    key={vendor.id}
                    className="flex flex-wrap items-center gap-3 p-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{vendor.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {categoryLabel(vendor.category)}
                        {vendor.phone && ` · ${vendor.phone}`}
                      </p>
                    </div>
                    {vendor.price !== null && (
                      <p className="text-sm font-medium">
                        {formatCurrency(vendor.price)}
                      </p>
                    )}
                    <select
                      aria-label={`Status vendor ${vendor.name}`}
                      className="h-9 rounded-md border border-input bg-background px-2 text-xs"
                      value={vendor.status}
                      onChange={(e) =>
                        updateVendor.mutate({
                          id: vendor.id,
                          status: e.target.value as VendorStatusKey,
                        })
                      }
                    >
                      {Object.entries(VENDOR_STATUS).map(([key, cfg]) => (
                        <option key={key} value={key}>
                          {cfg.label}
                        </option>
                      ))}
                    </select>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        setConfirmDelete({
                          kind: 'vendors',
                          id: vendor.id,
                          label: vendor.name,
                        })
                      }
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ----------------------------- Checklist --------------------------- */}
      {tab === 'checklist' && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-lg">Checklist Persiapan</CardTitle>
            {!checklist?.length && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => seedChecklist.mutate({ invitationId: id })}
                disabled={seedChecklist.isPending}
              >
                <Sparkles className="mr-1.5 h-4 w-4" />
                Muat checklist standar
              </Button>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                name="task-title"
                placeholder="Tugas baru"
                value={taskForm.title}
                onChange={(e) =>
                  setTaskForm((f) => ({ ...f, title: e.target.value }))
                }
                className="sm:flex-1"
              />
              <select
                name="task-phase"
                aria-label="Fase tugas"
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                value={taskForm.phase}
                onChange={(e) =>
                  setTaskForm((f) => ({ ...f, phase: e.target.value as Phase }))
                }
              >
                {CHECKLIST_PHASES.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
              <Input
                type="date"
                name="task-due-date"
                aria-label="Tenggat tugas"
                value={taskForm.dueDate}
                onChange={(e) =>
                  setTaskForm((f) => ({ ...f, dueDate: e.target.value }))
                }
                className="sm:w-44"
              />
              <Button
                onClick={() => {
                  if (!taskForm.title.trim()) {
                    toast.error('Judul tugas wajib diisi');
                    return;
                  }
                  createChecklist.mutate({
                    invitationId: id,
                    title: taskForm.title.trim(),
                    phase: taskForm.phase,
                    dueDate: taskForm.dueDate || undefined,
                  });
                  setTaskForm({
                    title: '',
                    phase: taskForm.phase,
                    dueDate: '',
                  });
                }}
                disabled={createChecklist.isPending}
              >
                <Plus className="mr-1.5 h-4 w-4" />
                Tambah
              </Button>
            </div>

            {checklistLoading ? (
              <Skeleton className="h-24 rounded-lg" />
            ) : !checklist?.length ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Belum ada tugas. Muat checklist standar untuk memulai.
              </p>
            ) : (
              <div className="divide-y rounded-lg border">
                {checklist.map((task) => {
                  const overdue =
                    !task.isDone &&
                    task.dueDate &&
                    new Date(task.dueDate) < new Date();

                  return (
                    <div
                      key={task.id}
                      className="flex flex-wrap items-center gap-3 p-3"
                    >
                      <input
                        type="checkbox"
                        aria-label={`Tandai ${task.title} selesai`}
                        checked={task.isDone}
                        onChange={(e) =>
                          updateChecklist.mutate({
                            id: task.id,
                            isDone: e.target.checked,
                          })
                        }
                        className="h-4 w-4 shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <p
                          className={`truncate ${
                            task.isDone
                              ? 'text-muted-foreground line-through'
                              : 'font-medium'
                          }`}
                        >
                          {task.title}
                        </p>
                        <p
                          className={`text-xs ${
                            overdue ? 'font-medium text-red-600' : 'text-muted-foreground'
                          }`}
                        >
                          {phaseLabel(task.phase)}
                          {task.dueDate &&
                            ` · ${format(new Date(task.dueDate), 'd MMM yyyy', {
                              locale: localeId,
                            })}`}
                          {overdue && ' · lewat tenggat'}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          setConfirmDelete({
                            kind: 'checklist',
                            id: task.id,
                            label: task.title,
                          })
                        }
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {tab === 'seating' && (
        <SeatingPanel invitationId={id} enabled={enabled} />
      )}

      <ConfirmDialog
        open={!!confirmDelete}
        onOpenChange={(open) => !open && setConfirmDelete(null)}
        title="Hapus item ini?"
        description={
          confirmDelete
            ? `"${confirmDelete.label}" akan dihapus permanen.`
            : ''
        }
        confirmLabel="Hapus"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </div>
  );
}

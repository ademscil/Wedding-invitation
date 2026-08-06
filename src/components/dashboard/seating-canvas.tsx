'use client';

import { useRef, useState } from 'react';
import { Users } from 'lucide-react';

export type CanvasTable = {
  id: string;
  name: string;
  capacity: number;
  shape: string;
  positionX: number;
  positionY: number;
  occupied: number;
};

/**
 * Drag-positionable floor plan.
 *
 * Coordinates are stored as percentages of the canvas, so a layout arranged on
 * a desktop still reads correctly on a phone. Uses pointer events directly —
 * they cover mouse and touch without pulling in a drag library.
 */
export function SeatingCanvas({
  tables,
  selectedId,
  onSelect,
  onMove,
}: {
  tables: CanvasTable[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onMove: (id: string, x: number, y: number) => void;
}) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  // Local overrides while a drag is in flight, so the table tracks the pointer
  // without waiting for the server round-trip.
  const [preview, setPreview] = useState<Record<string, { x: number; y: number }>>(
    {}
  );

  const positionFromEvent = (clientX: number, clientY: number) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return null;

    const x = Math.round(((clientX - rect.left) / rect.width) * 100);
    const y = Math.round(((clientY - rect.top) / rect.height) * 100);

    // Clamp so a table can never be dragged out of view.
    return {
      x: Math.min(96, Math.max(4, x)),
      y: Math.min(94, Math.max(6, y)),
    };
  };

  const handlePointerDown = (
    event: React.PointerEvent<HTMLButtonElement>,
    id: string
  ) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragging(id);
    onSelect(id);
  };

  const handlePointerMove = (
    event: React.PointerEvent<HTMLButtonElement>,
    id: string
  ) => {
    if (dragging !== id) return;
    const next = positionFromEvent(event.clientX, event.clientY);
    if (next) setPreview((p) => ({ ...p, [id]: next }));
  };

  const handlePointerUp = (
    event: React.PointerEvent<HTMLButtonElement>,
    id: string
  ) => {
    if (dragging !== id) return;
    event.currentTarget.releasePointerCapture(event.pointerId);
    setDragging(null);

    const final = preview[id];
    if (final) {
      onMove(id, final.x, final.y);
      setPreview((p) => {
        const next = { ...p };
        delete next[id];
        return next;
      });
    }
  };

  return (
    <div
      ref={canvasRef}
      className="relative h-[460px] w-full overflow-hidden rounded-lg border bg-[repeating-linear-gradient(45deg,transparent,transparent_12px,rgba(0,0,0,0.02)_12px,rgba(0,0,0,0.02)_24px)] bg-muted/20"
    >
      {tables.length === 0 && (
        <p className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
          Belum ada meja. Tambahkan meja untuk mulai menyusun denah.
        </p>
      )}

      <span className="absolute left-1/2 top-3 -translate-x-1/2 rounded-full bg-background px-3 py-1 text-[11px] font-medium tracking-wide text-muted-foreground shadow-sm">
        PELAMINAN
      </span>

      {tables.map((table) => {
        const pos = preview[table.id] ?? {
          x: table.positionX,
          y: table.positionY,
        };
        const isFull = table.occupied >= table.capacity;
        const isSelected = selectedId === table.id;

        return (
          <button
            key={table.id}
            type="button"
            onPointerDown={(e) => handlePointerDown(e, table.id)}
            onPointerMove={(e) => handlePointerMove(e, table.id)}
            onPointerUp={(e) => handlePointerUp(e, table.id)}
            onPointerCancel={(e) => handlePointerUp(e, table.id)}
            style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
            className={`absolute flex -translate-x-1/2 -translate-y-1/2 cursor-grab touch-none flex-col items-center justify-center border-2 bg-background text-center shadow-sm transition-colors active:cursor-grabbing ${
              table.shape === 'RECTANGLE'
                ? 'h-16 w-28 rounded-lg'
                : 'h-24 w-24 rounded-full'
            } ${
              isSelected
                ? 'border-primary ring-2 ring-primary/30'
                : isFull
                  ? 'border-green-500/70'
                  : 'border-border'
            }`}
            title={`${table.name} — ${table.occupied}/${table.capacity} kursi`}
          >
            <span className="max-w-[85%] truncate px-1 text-xs font-semibold">
              {table.name}
            </span>
            <span
              className={`flex items-center gap-1 text-[11px] ${
                isFull ? 'text-green-600' : 'text-muted-foreground'
              }`}
            >
              <Users className="h-3 w-3" />
              {table.occupied}/{table.capacity}
            </span>
          </button>
        );
      })}
    </div>
  );
}

import { useEffect, useState } from "react";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { makeChartCardItem } from "@/data/slide-templates";
import type { ChartCardElement, ChartCardItem } from "@/types/presentation";

type ChartCardItemsEditorProps = {
  element: ChartCardElement;
  onPatch: (patch: Partial<ChartCardElement>) => void;
};

function DraftInput({
  value,
  onCommit,
  placeholder,
  className,
}: {
  value: string;
  onCommit: (v: string) => void;
  placeholder?: string;
  className?: string;
}) {
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);
  return (
    <Input
      value={draft}
      placeholder={placeholder}
      className={`h-7 px-1.5 text-xs ${className ?? ""}`}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => draft !== value && onCommit(draft)}
      onKeyDown={(e) => {
        if (e.key === "Enter") e.currentTarget.blur();
      }}
    />
  );
}

/** Edição dos indicadores do painel lateral: rótulo, valor, legenda e destaque. */
export function ChartCardItemsEditor({ element, onPatch }: ChartCardItemsEditorProps) {
  const update = (id: string, changes: Partial<ChartCardItem>) => {
    onPatch({
      items: element.items.map((item) => (item.id === id ? { ...item, ...changes } : item)),
    });
  };

  const remove = (id: string) => {
    onPatch({ items: element.items.filter((item) => item.id !== id) });
  };

  const move = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= element.items.length) return;
    const items = [...element.items];
    const current = items[index] as ChartCardItem;
    items[index] = items[target] as ChartCardItem;
    items[target] = current;
    onPatch({ items });
  };

  const add = () => {
    onPatch({
      items: [
        ...element.items,
        makeChartCardItem({
          label: `Indicador ${element.items.length + 1}`,
          value: "R$ 0,00",
          ...(element.variant === "kpi" ? { note: "Observação" } : {}),
        }),
      ],
    });
  };

  return (
    <div className="space-y-2">
      {element.items.map((item, index) => (
        <div key={item.id} className="space-y-1.5 rounded-md border border-border p-2">
          <div className="flex items-center gap-1.5">
            <DraftInput
              value={item.label}
              onCommit={(v) => update(item.id, { label: v })}
              placeholder="Rótulo"
              className="flex-1 font-medium"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-7 shrink-0 text-muted-foreground"
              title="Mover para cima"
              disabled={index === 0}
              onClick={() => move(index, -1)}
            >
              <ArrowUp className="size-3.5" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-7 shrink-0 text-muted-foreground"
              title="Mover para baixo"
              disabled={index === element.items.length - 1}
              onClick={() => move(index, 1)}
            >
              <ArrowDown className="size-3.5" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-7 shrink-0 text-muted-foreground hover:text-destructive"
              title="Remover indicador"
              onClick={() => remove(item.id)}
            >
              <Trash2 className="size-3.5" />
            </Button>
          </div>

          <DraftInput
            value={item.value}
            onCommit={(v) => update(item.id, { value: v })}
            placeholder="R$ 0,00"
            className="font-semibold tabular-nums"
          />

          {element.variant === "kpi" ? (
            <DraftInput
              value={item.note ?? ""}
              onCommit={(v) => update(item.id, { note: v })}
              placeholder="Legenda (opcional)"
            />
          ) : null}

          <div className="flex items-center justify-between gap-2">
            <Label className="text-xs text-muted-foreground">Destaque / total</Label>
            <Switch
              checked={Boolean(item.emphasis)}
              onCheckedChange={(v) => update(item.id, { emphasis: v })}
            />
          </div>
        </div>
      ))}

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-7 w-full text-xs"
        onClick={add}
      >
        <Plus className="size-3.5" />
        Indicador
      </Button>
    </div>
  );
}

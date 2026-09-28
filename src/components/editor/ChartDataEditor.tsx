import { useEffect, useState } from "react";
import { ClipboardPaste, Plus, Trash2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { makeSeries, parseChartTable, seriesColorAt } from "@/lib/chart-data";
import type { ChartElement, ChartSeries } from "@/types/presentation";
import { cn } from "@/lib/utils";

const SWATCHES = Array.from({ length: 6 }, (_, i) => seriesColorAt(i));

const TABLE_HINT =
  "Cole a tabela da planilha. A primeira linha é o cabeçalho com os nomes das séries e a primeira coluna são as categorias. Aceita tabulação, ponto e vírgula ou vírgula como separador.";

type ChartDataEditorProps = {
  element: ChartElement;
  onPatch: (patch: Partial<ChartElement>) => void;
};

function TextDraft({
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
      className={cn("h-7 px-1.5 text-xs", className)}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => draft !== value && onCommit(draft)}
      onKeyDown={(e) => {
        if (e.key === "Enter") e.currentTarget.blur();
      }}
    />
  );
}

function NumberDraft({ value, onCommit }: { value: number; onCommit: (v: number) => void }) {
  const [draft, setDraft] = useState(String(value));
  useEffect(() => setDraft(String(value)), [value]);
  return (
    <Input
      type="number"
      value={draft}
      className="h-7 px-1.5 text-center text-xs tabular-nums"
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => {
        const parsed = Number(draft);
        const next = Number.isFinite(parsed) ? parsed : value;
        if (next !== value) onCommit(next);
        setDraft(String(next));
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") e.currentTarget.blur();
      }}
    />
  );
}

function SeriesEditor({ element, onPatch }: ChartDataEditorProps) {
  const update = (id: string, changes: Partial<ChartSeries>) => {
    onPatch({
      series: element.series.map((s) => (s.id === id ? { ...s, ...changes } : s)),
    });
  };

  const remove = (id: string) => {
    if (element.series.length <= 1) return;
    onPatch({ series: element.series.filter((s) => s.id !== id) });
  };

  const add = () => {
    const index = element.series.length;
    onPatch({
      series: [
        ...element.series,
        makeSeries(
          index,
          `Série ${index + 1}`,
          element.categories.map(() => 0),
        ),
      ],
    });
  };

  return (
    <div className="space-y-2">
      {element.series.map((serie) => (
        <div key={serie.id} className="space-y-1.5 rounded-md border border-border p-2">
          <div className="flex items-center gap-1.5">
            <TextDraft
              value={serie.name}
              onCommit={(v) => update(serie.id, { name: v })}
              placeholder="Nome da série"
              className="flex-1 font-medium"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-7 shrink-0 text-muted-foreground hover:text-destructive"
              title="Remover série"
              disabled={element.series.length <= 1}
              onClick={() => remove(serie.id)}
            >
              <Trash2 className="size-3.5" />
            </Button>
          </div>
          <div className="flex items-center gap-1.5">
            {SWATCHES.map((swatch) => (
              <button
                key={swatch}
                type="button"
                title={swatch}
                onClick={() => update(serie.id, { color: swatch })}
                className={cn(
                  "size-4 rounded-full ring-1 ring-black/10 transition-transform hover:scale-110",
                  serie.color === swatch && "ring-2 ring-primary",
                )}
                style={{ background: swatch }}
              />
            ))}
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
        Série
      </Button>

      <p className="text-[10px] leading-relaxed text-muted-foreground">
        Em pizza e rosca apenas a primeira série é utilizada.
      </p>
    </div>
  );
}

function ValuesTable({ element, onPatch }: ChartDataEditorProps) {
  const categoryCount = element.categories.length;
  const template = `minmax(0, 1fr) repeat(${Math.max(element.series.length, 1)}, minmax(0, 0.85fr))`;

  const setCategory = (index: number, value: string) => {
    onPatch({
      categories: element.categories.map((c, i) => (i === index ? value : c)),
    });
  };

  const setValue = (serieId: string, index: number, value: number) => {
    onPatch({
      series: element.series.map((s) => {
        if (s.id !== serieId) return s;
        const values = [...s.values];
        while (values.length < element.categories.length) values.push(0);
        values[index] = value;
        return { ...s, values };
      }),
    });
  };

  const addCategory = () => {
    onPatch({
      categories: [...element.categories, `Item ${categoryCount + 1}`],
      series: element.series.map((s) => ({ ...s, values: [...s.values, 0] })),
    });
  };

  const removeCategory = (index: number) => {
    if (categoryCount <= 1) return;
    onPatch({
      categories: element.categories.filter((_, i) => i !== index),
      series: element.series.map((s) => ({ ...s, values: s.values.filter((_, i) => i !== index) })),
    });
  };

  return (
    <div className="space-y-2">
      <div className="-mx-1 overflow-x-auto px-1 pb-1">
        <div className="min-w-[240px] space-y-1.5">
          <div className="grid gap-1" style={{ gridTemplateColumns: template }}>
            <span className="px-1 text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
              Categoria
            </span>
            {element.series.map((serie) => (
              <span
                key={serie.id}
                title={serie.name}
                className="truncate text-center text-[10px] font-medium tracking-wide text-muted-foreground uppercase"
              >
                {serie.name}
              </span>
            ))}
          </div>

          {element.categories.map((category, index) => (
            <div key={index} className="group grid gap-1" style={{ gridTemplateColumns: template }}>
              <div className="flex items-center gap-0.5">
                <TextDraft
                  value={category}
                  onCommit={(v) => setCategory(index, v)}
                  placeholder="Rótulo"
                  className="min-w-0 flex-1"
                />
                {categoryCount > 1 ? (
                  <button
                    type="button"
                    title="Remover categoria"
                    onClick={() => removeCategory(index)}
                    className="shrink-0 rounded p-0.5 text-muted-foreground opacity-0 transition-opacity hover:text-destructive focus-visible:opacity-100 group-hover:opacity-100"
                  >
                    <X className="size-3" />
                  </button>
                ) : null}
              </div>
              {element.series.map((serie) => (
                <NumberDraft
                  key={serie.id}
                  value={serie.values[index] ?? 0}
                  onCommit={(v) => setValue(serie.id, index, v)}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-7 w-full text-xs"
        onClick={addCategory}
      >
        <Plus className="size-3.5" />
        Categoria
      </Button>
    </div>
  );
}

function PasteTable({ element, onPatch }: ChartDataEditorProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);

  const apply = () => {
    const parsed = parseChartTable(draft);
    if (!parsed) {
      setError("Cole ao menos uma linha de cabeçalho e uma linha de dados.");
      return;
    }
    setError(null);
    onPatch({
      categories: parsed.categories,
      series: parsed.series.map((serie, index) => makeSeries(index, serie.name, serie.values)),
    });
    setDraft("");
    setOpen(false);
  };

  if (!open) {
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-7 w-full text-xs"
        onClick={() => setOpen(true)}
      >
        <ClipboardPaste className="size-3.5" />
        Colar tabela da planilha
      </Button>
    );
  }

  return (
    <div className="space-y-2 rounded-md border border-border p-2">
      <p className="text-[10px] leading-relaxed text-muted-foreground">{TABLE_HINT}</p>
      <Textarea
        value={draft}
        rows={4}
        autoFocus
        placeholder={"Categoria\tSérie 1\tSérie 2\nJaneiro\t120\t80\nFevereiro\t150\t95"}
        className="resize-none font-mono text-[11px]"
        onChange={(e) => {
          setDraft(e.target.value);
          setError(null);
        }}
      />
      {error ? <p className="text-[11px] text-destructive">{error}</p> : null}
      <div className="flex gap-1.5">
        <Button type="button" size="sm" className="h-7 flex-1 text-xs" onClick={apply}>
          Aplicar
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-7 flex-1 text-xs"
          onClick={() => {
            setOpen(false);
            setDraft("");
            setError(null);
          }}
        >
          Cancelar
        </Button>
      </div>
    </div>
  );
}

export function ChartDataEditor(props: ChartDataEditorProps) {
  return (
    <div className="space-y-4">
      <SeriesEditor {...props} />
      <ValuesTable {...props} />
      <PasteTable {...props} />
    </div>
  );
}

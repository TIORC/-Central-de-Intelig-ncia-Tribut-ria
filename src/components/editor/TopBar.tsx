import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, Download, Loader2, Play, Plus, Redo2, Save, Trash2, Undo2 } from "lucide-react";

import type { EditorApi } from "@/hooks/use-presentation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

export type ZoomLevel = "fit" | number;

type TopBarProps = {
  api: EditorApi;
  zoom: ZoomLevel;
  onZoomChange: (z: ZoomLevel) => void;
  onPresent: () => void;
  onSave: () => void;
  onExport: () => void;
  exporting?: boolean;
};

const ZOOM_OPTIONS: { label: string; value: string }[] = [
  { label: "Ajustar", value: "fit" },
  { label: "50%", value: "50" },
  { label: "75%", value: "75" },
  { label: "100%", value: "100" },
  { label: "125%", value: "125" },
  { label: "150%", value: "150" },
  { label: "200%", value: "200" },
];

function NameEditor({ value, onCommit }: { value: string; onCommit: (v: string) => void }) {
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);
  return (
    <Input
      value={draft}
      className="h-8 w-56 font-display text-sm font-semibold"
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => {
        const clean = draft.trim();
        if (clean && clean !== value) onCommit(clean);
        else setDraft(value);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") e.currentTarget.blur();
      }}
    />
  );
}

export function TopBar({
  api,
  zoom,
  onZoomChange,
  onPresent,
  onSave,
  onExport,
  exporting = false,
}: TopBarProps) {
  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border bg-background px-3">
      <Button asChild variant="ghost" size="sm">
        <Link to="/apresentacoes">
          <ArrowLeft className="size-4" />
          Voltar
        </Link>
      </Button>

      <Separator orientation="vertical" className="h-6" />

      <NameEditor value={api.presentation.name} onCommit={api.renamePresentation} />

      <div className="ml-auto flex items-center gap-1.5">
        <Button
          variant="ghost"
          size="icon"
          title="Desfazer (Ctrl+Z)"
          disabled={!api.canUndo}
          onClick={api.undo}
        >
          <Undo2 className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          title="Refazer (Ctrl+Shift+Z)"
          disabled={!api.canRedo}
          onClick={api.redo}
        >
          <Redo2 className="size-4" />
        </Button>

        <Separator orientation="vertical" className="mx-1 h-6" />

        <Button variant="outline" size="sm" onClick={api.addSlide}>
          <Plus className="size-4" />
          Slide
        </Button>
        <Button
          variant="outline"
          size="icon"
          title="Excluir slide atual"
          disabled={api.presentation.slides.length <= 1}
          onClick={() => api.deleteSlide(api.currentIndex)}
        >
          <Trash2 className="size-4" />
        </Button>

        <Separator orientation="vertical" className="mx-1 h-6" />

        <Select
          value={String(zoom)}
          onValueChange={(v) => onZoomChange(v === "fit" ? "fit" : Number(v))}
        >
          <SelectTrigger className="h-8 w-[104px] text-xs" aria-label="Zoom">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ZOOM_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button variant="outline" size="sm" onClick={onPresent}>
          <Play className="size-4" />
          Apresentar
        </Button>
        <Button variant="outline" size="sm" onClick={onExport} disabled={exporting}>
          {exporting ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Download className="size-4" />
          )}
          PowerPoint
        </Button>
        <Button size="sm" onClick={onSave}>
          <Save className="size-4" />
          Salvar
        </Button>
      </div>
    </header>
  );
}

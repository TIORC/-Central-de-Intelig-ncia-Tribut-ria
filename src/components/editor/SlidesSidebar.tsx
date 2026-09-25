import { useState } from "react";
import { Copy, Plus, Trash2 } from "lucide-react";

import { SlideThumbnail } from "@/components/editor/SlideThumbnail";
import type { EditorApi } from "@/hooks/use-presentation";
import { Button } from "@/components/ui/button";

type SlidesSidebarProps = {
  api: EditorApi;
};

export function SlidesSidebar({ api }: SlidesSidebarProps) {
  const [dragging, setDragging] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  const handleDrop = (target: number) => {
    if (dragging !== null && dragging !== target) {
      api.moveSlide(dragging, target);
    }
    setDragging(null);
    setOverIndex(null);
  };

  return (
    <aside className="flex h-full w-full flex-col border-r border-border bg-background">
      <div className="flex items-center justify-between gap-2 border-b border-border p-3">
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Slides</p>
        <Button
          variant="outline"
          size="sm"
          className="h-7 gap-1 px-2 text-xs"
          onClick={api.addSlide}
        >
          <Plus className="size-3.5" />
          Adicionar
        </Button>
      </div>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3">
        {api.presentation.slides.map((slide, i) => (
          <div key={slide.id}>
            <div className="group relative">
              <SlideThumbnail
                slide={slide}
                active={i === api.currentIndex}
                dragOver={overIndex === i && dragging !== i}
                onPointerDown={() => api.selectSlide(i)}
                onDragStart={(e) => {
                  setDragging(i);
                  e.dataTransfer.effectAllowed = "move";
                  e.dataTransfer.setData("text/plain", String(i));
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  setOverIndex(i);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  handleDrop(i);
                }}
              />
              <div className="absolute top-1/2 right-1 flex -translate-y-1/2 flex-col gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                <button
                  type="button"
                  title="Duplicar slide"
                  onClick={(e) => {
                    e.stopPropagation();
                    api.duplicateSlide(i);
                  }}
                  className="flex size-6 items-center justify-center rounded bg-background/90 text-muted-foreground shadow ring-1 ring-border hover:text-foreground"
                >
                  <Copy className="size-3.5" />
                </button>
                <button
                  type="button"
                  title="Excluir slide"
                  onClick={(e) => {
                    e.stopPropagation();
                    api.deleteSlide(i);
                  }}
                  className="flex size-6 items-center justify-center rounded bg-background/90 text-muted-foreground shadow ring-1 ring-border hover:text-destructive"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            </div>
            <p className="mt-1 px-0.5 text-[11px] text-muted-foreground">
              {i + 1}. {slide.name}
            </p>
          </div>
        ))}
      </div>
    </aside>
  );
}

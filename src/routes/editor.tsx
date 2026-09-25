import { createFileRoute } from "@tanstack/react-router";
import { Grid2x2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { ElementToolbar } from "@/components/editor/ElementToolbar";
import { InspectorPanel } from "@/components/editor/InspectorPanel";
import { PresentationMode } from "@/components/editor/PresentationMode";
import { SlideCanvas } from "@/components/editor/SlideCanvas";
import { SlidesSidebar } from "@/components/editor/SlidesSidebar";
import { TopBar, type ZoomLevel } from "@/components/editor/TopBar";
import { usePresentation } from "@/hooks/use-presentation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SLIDE_HEIGHT, SLIDE_WIDTH } from "@/types/presentation";

type EditorSearch = { id?: string };

export const Route = createFileRoute("/editor")({
  validateSearch: (search: Record<string, unknown>): EditorSearch =>
    typeof search.id === "string" && search.id.length > 0 ? { id: search.id } : {},
  head: () => ({
    meta: [
      { title: "Editor de apresentação — Central de Inteligência Tributária" },
      {
        name: "description",
        content:
          "Editor visual de slides com miniaturas, canvas de edição, snap de alinhamento e painel de propriedades.",
      },
    ],
  }),
  component: Editor,
});

function Editor() {
  const { id } = Route.useSearch();
  const api = usePresentation(id);
  const [presenting, setPresenting] = useState(false);
  const [zoomState, setZoomState] = useState<ZoomLevel>("fit");
  const [showGrid, setShowGrid] = useState(true);
  const [exporting, setExporting] = useState(false);

  const canvasAreaRef = useRef<HTMLDivElement>(null);
  const [fitZoom, setFitZoom] = useState(0.5);

  useEffect(() => {
    const node = canvasAreaRef.current;
    if (!node) return;
    const update = () => {
      const w = node.clientWidth - 64;
      const h = node.clientHeight - 64;
      setFitZoom(Math.max(0.08, Math.min(w / SLIDE_WIDTH, h / SLIDE_HEIGHT)));
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const zoom = zoomState === "fit" ? fitZoom : zoomState;

  useEffect(() => {
    const isEditableTarget = (target: EventTarget | null) => {
      const el = target as HTMLElement | null;
      if (!el) return false;
      return (
        el.tagName === "INPUT" ||
        el.tagName === "TEXTAREA" ||
        el.tagName === "SELECT" ||
        el.isContentEditable
      );
    };

    const onKey = (e: KeyboardEvent) => {
      if (presenting) return;

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) api.redo();
        else api.undo();
        return;
      }

      if (e.key === "Delete" || e.key === "Backspace") {
        if (isEditableTarget(e.target)) return;
        if (api.selectedElementId) {
          e.preventDefault();
          api.deleteElement(api.selectedElementId);
        }
        return;
      }

      if (e.key === "Escape") {
        api.selectElement(null);
        api.cancelEdit();
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [api, presenting]);

  const handleSave = () => {
    api.save();
    toast.success("Apresentação salva", {
      description: id
        ? "As alterações foram salvas na apresentação aberta."
        : "As alterações foram salvas neste navegador.",
    });
  };

  const handleExport = async () => {
    setExporting(true);
    const toastId = toast.loading("Gerando arquivo PowerPoint…");

    try {
      const { exportPresentationToPptx } = await import("@/lib/export-pptx");
      const fileName = await exportPresentationToPptx(api.presentation);
      toast.success("PowerPoint gerado", { id: toastId, description: fileName });
    } catch (error) {
      toast.error("Não foi possível exportar", {
        id: toastId,
        description: error instanceof Error ? error.message : "Erro inesperado na exportação.",
      });
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="flex h-screen flex-col bg-muted/40">
      <TopBar
        api={api}
        zoom={zoomState}
        onZoomChange={setZoomState}
        onPresent={() => setPresenting(true)}
        onSave={handleSave}
        onExport={handleExport}
        exporting={exporting}
      />

      <div className="flex min-h-0 flex-1">
        <div className="w-56 shrink-0">
          <SlidesSidebar api={api} />
        </div>

        <div className="flex min-w-0 flex-1">
          <ElementToolbar api={api} />

          <div ref={canvasAreaRef} className="relative min-w-0 flex-1 overflow-auto">
            <div
              className="flex min-h-full min-w-full items-center justify-center p-8"
              style={{
                backgroundImage:
                  "radial-gradient(circle, rgba(120,120,130,0.18) 1px, transparent 1px)",
                backgroundSize: "22px 22px",
              }}
            >
              <SlideCanvas slide={api.currentSlide} zoom={zoom} api={api} showGrid={showGrid} />
            </div>

            <Button
              type="button"
              variant="outline"
              size="icon"
              title={showGrid ? "Ocultar grade" : "Mostrar grade"}
              className={cn(
                "absolute right-4 bottom-4 size-8 shadow-sm",
                showGrid && "border-primary text-primary",
              )}
              onClick={() => setShowGrid((v) => !v)}
            >
              <Grid2x2 className="size-4" />
            </Button>
          </div>
        </div>

        <div className="w-72 shrink-0 overflow-y-auto border-l border-border bg-background">
          <InspectorPanel api={api} />
        </div>
      </div>

      {presenting && (
        <PresentationMode
          presentation={api.presentation}
          startIndex={api.currentIndex}
          onClose={() => setPresenting(false)}
        />
      )}
    </div>
  );
}

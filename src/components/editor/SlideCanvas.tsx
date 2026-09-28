import { useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { Trash2 } from "lucide-react";

import { SlideElementView } from "@/components/editor/SlideElementView";
import { moveSnap, resizeSnap, elRect, type Rect } from "@/components/editor/snap";
import type { Guide } from "@/components/editor/snap";
import type { EditorApi } from "@/hooks/use-presentation";
import type { ElementTextField, Slide, SlideBackground, SlideElement } from "@/types/presentation";
import { SLIDE_HEIGHT, SLIDE_WIDTH } from "@/types/presentation";
import { cn } from "@/lib/utils";

type ResizeDir = "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w";

type DragState =
  | {
      mode: "move";
      id: string;
      pointerId: number;
      startX: number;
      startY: number;
      start: Rect;
      moved: boolean;
      field: ElementTextField | null;
    }
  | {
      mode: "resize";
      dir: ResizeDir;
      id: string;
      pointerId: number;
      startX: number;
      startY: number;
      start: Rect;
      moved: boolean;
    };

type SlideCanvasProps = {
  slide: Slide;
  zoom: number;
  api: EditorApi;
  showGrid?: boolean;
};

const HANDLES: { dir: ResizeDir; cls: string; cursor: string }[] = [
  {
    dir: "nw",
    cls: "left-0 top-0 -translate-x-1/2 -translate-y-1/2",
    cursor: "cursor-nwse-resize",
  },
  { dir: "n", cls: "left-1/2 top-0 -translate-x-1/2 -translate-y-1/2", cursor: "cursor-ns-resize" },
  {
    dir: "ne",
    cls: "right-0 top-0 translate-x-1/2 -translate-y-1/2",
    cursor: "cursor-nesw-resize",
  },
  { dir: "e", cls: "right-0 top-1/2 translate-x-1/2 -translate-y-1/2", cursor: "cursor-ew-resize" },
  {
    dir: "se",
    cls: "right-0 bottom-0 translate-x-1/2 translate-y-1/2",
    cursor: "cursor-nwse-resize",
  },
  {
    dir: "s",
    cls: "left-1/2 bottom-0 -translate-x-1/2 translate-y-1/2",
    cursor: "cursor-ns-resize",
  },
  {
    dir: "sw",
    cls: "left-0 bottom-0 -translate-x-1/2 -translate-y-1/2",
    cursor: "cursor-nesw-resize",
  },
  { dir: "w", cls: "left-0 top-1/2 -translate-x-1/2 -translate-y-1/2", cursor: "cursor-ew-resize" },
];

const DELETE_BUTTON_SIZE = 26;
const DELETE_BUTTON_GAP = 4;

/** Descobre qual campo de texto foi clicado a partir do marcador `data-field`. */
function fieldFromTarget(target: EventTarget | null): ElementTextField | null {
  const node = (target as HTMLElement | null)?.closest?.("[data-field]") as HTMLElement | null;
  const field = node?.dataset["field"] as ElementTextField | undefined;
  return field ?? null;
}

function backgroundStyle(bg: SlideBackground): CSSProperties {
  if (bg.type === "gradient") {
    return { background: `linear-gradient(${bg.angle}deg, ${bg.from}, ${bg.to})` };
  }
  return { background: bg.color };
}

export function SlideCanvas({ slide, zoom, api, showGrid = true }: SlideCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const slideRef = useRef(slide);
  const elementsRef = useRef(slide.elements);
  const apiRef = useRef(api);
  const zoomRef = useRef(zoom);
  const dragRef = useRef<DragState | null>(null);
  const editTimerRef = useRef<number | null>(null);
  const [guides, setGuides] = useState<Guide[]>([]);

  slideRef.current = slide;
  elementsRef.current = slide.elements;
  apiRef.current = api;
  zoomRef.current = zoom;

  const clearScheduledEdit = useCallback(() => {
    if (editTimerRef.current !== null) {
      window.clearTimeout(editTimerRef.current);
      editTimerRef.current = null;
    }
  }, []);

  /**
   * Abre a edição do texto só no próximo tick, quando o gesto de ponteiro já
   * terminou. Fazer isso durante o gesto corre contra o foco padrão do
   * navegador (o clique rouba o foco e o editor fecha na hora).
   */
  const scheduleEdit = useCallback(
    (id: string, field: ElementTextField) => {
      clearScheduledEdit();
      editTimerRef.current = window.setTimeout(() => {
        editTimerRef.current = null;
        const current = apiRef.current;
        if (current.editing) return;
        if (current.selectedElementId !== id) return;
        current.startEdit({ id, field });
      }, 0);
    },
    [clearScheduledEdit],
  );

  const getPos = useCallback((e: Pick<PointerEvent, "clientX" | "clientY">) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return {
      x: (e.clientX - rect.left) / zoomRef.current,
      y: (e.clientY - rect.top) / zoomRef.current,
    };
  }, []);

  const beginDrag = useCallback(
    (e: React.PointerEvent, id: string, mode: "move" | "resize", dir?: ResizeDir) => {
      e.preventDefault();
      e.stopPropagation();

      const currentSlide = apiRef.current.currentSlide;
      const element = currentSlide.elements.find((x) => x.id === id);
      if (!element) return;

      apiRef.current.selectElement(id);
      const p = getPos(e);
      const start = { x: element.x, y: element.y, w: element.w, h: element.h };
      dragRef.current =
        mode === "move"
          ? {
              mode,
              id,
              pointerId: e.pointerId,
              startX: p.x,
              startY: p.y,
              start,
              moved: false,
              field: fieldFromTarget(e.target),
            }
          : {
              mode,
              dir: dir as ResizeDir,
              id,
              pointerId: e.pointerId,
              startX: p.x,
              startY: p.y,
              start,
              moved: false,
            };

      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        // captura opcional em navegadores que não a suportam
      }
    },
    [getPos],
  );

  const endDrag = useCallback(
    (e?: Pick<PointerEvent, "currentTarget" | "pointerId">, canEdit = false) => {
      const d = dragRef.current;
      if (!d) return;

      dragRef.current = null;
      if (d.moved) {
        apiRef.current.commitTransaction();
      } else {
        apiRef.current.cancelTransaction();
        // Clique (sem arrasto) sobre um campo de texto entra direto na edição.
        if (canEdit && d.mode === "move" && d.field) scheduleEdit(d.id, d.field);
      }

      setGuides([]);

      const target = e?.currentTarget as Element | null;
      if (target) {
        try {
          target.releasePointerCapture(d.pointerId);
        } catch {
          // elemento já liberado ou navegador sem suporte
        }
      }
    },
    [scheduleEdit],
  );

  const handleMove = useCallback(
    (e: PointerEvent) => {
      const d = dragRef.current;
      if (!d || e.pointerId !== d.pointerId) return;

      e.preventDefault();
      const p = getPos(e);
      const dx = p.x - d.startX;
      const dy = p.y - d.startY;

      if (!d.moved && Math.hypot(dx, dy) < 2) return;

      if (!d.moved) {
        apiRef.current.beginTransaction();
        d.moved = true;
      }

      const currentSlide = slideRef.current;
      const others = currentSlide.elements.filter((x) => x.id !== d.id).map(elRect);

      if (d.mode === "move") {
        const {
          x,
          y,
          guides: g,
        } = moveSnap({ x: d.start.x + dx, y: d.start.y + dy, w: d.start.w, h: d.start.h }, others);
        apiRef.current.updateElement(d.id, { x, y }, false);
        setGuides(g);
      } else {
        const { rect, guides: g } = resizeSnap(d.start, d.dir, dx, dy, others);
        apiRef.current.updateElement(d.id, { x: rect.x, y: rect.y, w: rect.w, h: rect.h }, false);
        setGuides(g);
      }
    },
    [getPos],
  );

  const handleUp = useCallback(
    (e: PointerEvent) => {
      const d = dragRef.current;
      if (!d || e.pointerId !== d.pointerId) return;
      endDrag(e, true);
    },
    [endDrag],
  );

  // pointercancel chega quando o navegador interrompe o gesto (toque, rolagem,
  // captura de ponteiro): não pode abrir a edição de texto.
  const handleCancel = useCallback(
    (e: PointerEvent) => {
      const d = dragRef.current;
      if (!d || e.pointerId !== d.pointerId) return;
      endDrag(e);
    },
    [endDrag],
  );

  useEffect(() => {
    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
    window.addEventListener("pointercancel", handleCancel);
    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
      window.removeEventListener("pointercancel", handleCancel);
      clearScheduledEdit();
      dragRef.current = null;
      endDrag();
    };
  }, [clearScheduledEdit, endDrag, handleCancel, handleMove, handleUp]);

  const onElementPointerDown = (e: React.PointerEvent, id: string) => {
    clearScheduledEdit();
    const editing = api.editing;
    if (editing) {
      // Clique no mesmo campo em edição: mantém o cursor onde está.
      if (editing.id === id && fieldFromTarget(e.target) === editing.field) {
        e.stopPropagation();
        return;
      }
      // Clique em outro campo ou elemento: fecha a edição atual (o texto é
      // confirmado na desmontagem) e segue para o novo alvo.
      api.cancelEdit();
    }
    beginDrag(e, id, "move");
  };

  const onHandlePointerDown = (e: React.PointerEvent, dir: ResizeDir, id: string) => {
    beginDrag(e, id, "resize", dir);
  };

  const ordered = [...slide.elements].sort((a, b) => a.zIndex - b.zIndex);

  // O botão de excluir acompanha o zoom para ter sempre o mesmo tamanho na tela.
  const deleteSize = DELETE_BUTTON_SIZE / zoom;
  const deleteIconSize = (DELETE_BUTTON_SIZE * 0.55) / zoom;
  const deleteGap = DELETE_BUTTON_GAP / zoom;

  const deleteButtonPosition = (el: SlideElement): CSSProperties => {
    const fitsAbove = el.y >= deleteSize + deleteGap;
    const fitsBelow = el.y + el.h + deleteSize + deleteGap <= SLIDE_HEIGHT;
    if (fitsAbove) return { top: -(deleteSize + deleteGap), right: 0 };
    if (fitsBelow) return { top: el.h + deleteGap, right: 0 };
    return { top: 0, right: deleteSize * 0.9 };
  };

  return (
    <div
      className="relative overflow-hidden rounded-lg shadow-panel ring-1 ring-black/5"
      style={{ width: SLIDE_WIDTH * zoom, height: SLIDE_HEIGHT * zoom }}
    >
      <div
        ref={canvasRef}
        className="absolute left-0 top-0 touch-none select-none overflow-hidden"
        style={{
          width: SLIDE_WIDTH,
          height: SLIDE_HEIGHT,
          transform: `scale(${zoom})`,
          transformOrigin: "0 0",
          ...backgroundStyle(slide.background),
        }}
        onPointerDown={(e) => {
          if (e.target === e.currentTarget) api.selectElement(null);
        }}
      >
        {showGrid && (
          <svg
            className="pointer-events-none absolute inset-0"
            width={SLIDE_WIDTH}
            height={SLIDE_HEIGHT}
            style={{ zIndex: 0 }}
          >
            <defs>
              <pattern id="slide-guide-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path
                  d="M 40 0 L 0 0 0 40"
                  fill="none"
                  stroke="rgba(180,180,190,0.18)"
                  strokeWidth="1"
                />
              </pattern>
            </defs>
            <rect width={SLIDE_WIDTH} height={SLIDE_HEIGHT} fill="url(#slide-guide-grid)" />
          </svg>
        )}

        {guides.map((g, i) =>
          g.axis === "x" ? (
            <div
              key={`x-${i}`}
              className="pointer-events-none absolute bg-rose-400"
              style={{ left: g.pos, top: 0, bottom: 0, width: 1.5, zIndex: 1000 }}
            />
          ) : (
            <div
              key={`y-${i}`}
              className="pointer-events-none absolute bg-rose-400"
              style={{ top: g.pos, left: 0, right: 0, height: 1.5, zIndex: 1000 }}
            />
          ),
        )}

        {ordered.map((el) => {
          const selected = el.id === api.selectedElementId;
          return (
            <div
              key={el.id}
              className={cn(selected && api.editing?.id !== el.id && "cursor-move")}
              style={{
                position: "absolute",
                left: el.x,
                top: el.y,
                width: el.w,
                height: el.h,
                zIndex: el.zIndex,
                transform: `rotate(${el.rotate}deg)`,
                opacity: el.opacity,
              }}
              onPointerDown={(e) => onElementPointerDown(e, el.id)}
              onPointerUp={(e) => {
                e.stopPropagation();
                endDrag(e);
              }}
            >
              <SlideElementView el={el} editing={api.editing} api={api} />

              {selected && (
                <>
                  <div
                    className="pointer-events-none absolute inset-0 border-2 border-sky-500/80"
                    style={{ zIndex: 999 }}
                  />
                  {HANDLES.map((h) => (
                    <div
                      key={h.dir}
                      className={cn(
                        "absolute flex size-2.5 items-center justify-center rounded-[3px] border border-white bg-sky-500 shadow",
                        h.cursor,
                        h.cls,
                      )}
                      style={{ zIndex: 1000 }}
                      onPointerDown={(e) => onHandlePointerDown(e, h.dir, el.id)}
                    />
                  ))}
                </>
              )}

              {selected && !api.editing && (
                <button
                  type="button"
                  title="Excluir elemento"
                  aria-label="Excluir elemento"
                  className="absolute z-[1100] flex items-center justify-center rounded-md border border-border bg-background text-muted-foreground shadow-panel transition-colors hover:border-destructive hover:bg-destructive hover:text-destructive-foreground"
                  style={{
                    ...deleteButtonPosition(el),
                    width: deleteSize,
                    height: deleteSize,
                  }}
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    api.deleteElement(el.id);
                  }}
                >
                  <Trash2 style={{ width: deleteIconSize, height: deleteIconSize }} />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

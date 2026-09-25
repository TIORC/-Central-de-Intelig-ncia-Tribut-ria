import { useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";

import { SlideElementView, getDefaultEditTarget } from "@/components/editor/SlideElementView";
import { moveSnap, resizeSnap, elRect, type Rect } from "@/components/editor/snap";
import type { Guide } from "@/components/editor/snap";
import type { EditorApi } from "@/hooks/use-presentation";
import type { Slide, SlideBackground, SlideElement } from "@/types/presentation";
import { SLIDE_HEIGHT, SLIDE_WIDTH } from "@/types/presentation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

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

const TOOLBAR_WIDTH = 240;
const TOOLBAR_HEIGHT = 40;

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
  const [guides, setGuides] = useState<Guide[]>([]);

  slideRef.current = slide;
  elementsRef.current = slide.elements;
  apiRef.current = api;
  zoomRef.current = zoom;

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
          ? { mode, id, pointerId: e.pointerId, startX: p.x, startY: p.y, start, moved: false }
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

  const endDrag = useCallback((e?: Pick<PointerEvent, "currentTarget" | "pointerId">) => {
    const d = dragRef.current;
    if (!d) return;

    dragRef.current = null;
    if (d.moved) apiRef.current.commitTransaction();
    else apiRef.current.cancelTransaction();

    setGuides([]);

    const target = e?.currentTarget as Element | null;
    if (target) {
      try {
        target.releasePointerCapture(d.pointerId);
      } catch {
        // elemento já liberado ou navegador sem suporte
      }
    }
  }, []);

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
      endDrag(e);
    },
    [endDrag],
  );

  useEffect(() => {
    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
    window.addEventListener("pointercancel", handleUp);
    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
      window.removeEventListener("pointercancel", handleUp);
      endDrag();
    };
  }, [endDrag, handleMove, handleUp]);

  const onElementPointerDown = (e: React.PointerEvent, id: string) => {
    if (api.editing) {
      e.stopPropagation();
      return;
    }
    beginDrag(e, id, "move");
  };

  const onHandlePointerDown = (e: React.PointerEvent, dir: ResizeDir, id: string) => {
    beginDrag(e, id, "resize", dir);
  };

  const ordered = [...slide.elements].sort((a, b) => a.zIndex - b.zIndex);
  const selectedElement = slide.elements.find((el) => el.id === api.selectedElementId) ?? null;
  const selectedEditTarget = selectedElement ? getDefaultEditTarget(selectedElement) : null;

  const startSelectedEdit = () => {
    if (selectedEditTarget) api.startEdit(selectedEditTarget);
  };

  const clearSelectedText = () => {
    if (!selectedElement) return;
    const patch: Partial<SlideElement> =
      selectedElement.type === "text"
        ? { text: "" }
        : selectedElement.type === "card"
          ? { title: "", body: "" }
          : selectedElement.type === "stat"
            ? { value: "", label: "" }
            : {};
    if (Object.keys(patch).length > 0) {
      api.updateElement(selectedElement.id, patch, true);
      api.cancelEdit();
    }
  };

  const deleteSelectedElement = () => {
    if (selectedElement) api.deleteElement(selectedElement.id);
  };

  const toolbarWidth = 240;
  const toolbarHeight = 40;
  const toolbarLeft = Math.min(
    Math.max((selectedElement?.x ?? 0) * zoom, 0),
    Math.max(0, SLIDE_WIDTH * zoom - toolbarWidth),
  );
  const toolbarTop = selectedElement
    ? Math.min(
        Math.max(
          selectedElement.y * zoom > toolbarHeight + 8
            ? selectedElement.y * zoom - toolbarHeight - 8
            : selectedElement.y * zoom + selectedElement.h * zoom + 8,
          0,
        ),
        Math.max(0, SLIDE_HEIGHT * zoom - toolbarHeight),
      )
    : 0;

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
        {selectedElement && !api.editing && (
          <div
            className="absolute z-[1100] flex items-center gap-1 rounded-md border border-border bg-background p-1 shadow-panel"
            style={{ left: toolbarLeft, top: toolbarTop, width: toolbarWidth }}
            onPointerDown={(e) => e.stopPropagation()}
          >
            {selectedEditTarget && (
              <Button type="button" size="sm" onClick={startSelectedEdit}>
                Editar texto
              </Button>
            )}
            {selectedEditTarget && (
              <Button type="button" size="sm" variant="outline" onClick={clearSelectedText}>
                Limpar texto
              </Button>
            )}
            <Button type="button" size="sm" variant="outline" onClick={deleteSelectedElement}>
              Excluir
            </Button>
          </div>
        )}
      </div>
          );
        })}
      </div>
    </div>
  );
}

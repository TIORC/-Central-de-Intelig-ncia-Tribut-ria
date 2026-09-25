import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

import { SlideElementView } from "@/components/editor/SlideElementView";
import type { Presentation, Slide } from "@/types/presentation";
import { SLIDE_HEIGHT, SLIDE_WIDTH } from "@/types/presentation";
import { cn } from "@/lib/utils";

type PresentationModeProps = {
  presentation: Presentation;
  startIndex: number;
  onClose: () => void;
};

export function PresentationMode({ presentation, startIndex, onClose }: PresentationModeProps) {
  const [index, setIndex] = useState(startIndex);
  const outerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  const slide: Slide = presentation.slides[index] ?? (presentation.slides[0] as Slide);

  const slideCount = presentation.slides.length;

  const go = useCallback(
    (dir: 1 | -1) => {
      setIndex((prev) => {
        const next = prev + dir;
        if (next < 0 || next >= slideCount) return prev;
        return next;
      });
    },
    [slideCount],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " " || e.key === "Enter" || e.key === "PageDown") {
        e.preventDefault();
        go(1);
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        go(-1);
      } else if (e.key === "Home") {
        setIndex(0);
      } else if (e.key === "End") {
        setIndex(slideCount - 1);
      } else if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, onClose, slideCount]);

  useEffect(() => {
    const update = () => {
      const el = outerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const s = Math.min(rect.width / SLIDE_WIDTH, rect.height / SLIDE_HEIGHT);
      setScale(s);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, []);

  const ordered = [...slide.elements].sort((a, b) => a.zIndex - b.zIndex);

  return (
    <div
      ref={outerRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black p-6"
      onClick={() => go(1)}
    >
      <button
        type="button"
        aria-label="Slide anterior"
        className="absolute top-0 left-0 z-10 h-full w-1/4 cursor-w-resize"
        onClick={(e) => {
          e.stopPropagation();
          go(-1);
        }}
      />

      <div
        className="relative"
        style={{ width: SLIDE_WIDTH * scale, height: SLIDE_HEIGHT * scale }}
      >
        <button
          type="button"
          aria-label="Fechar apresentação"
          className="absolute top-2 right-2 flex size-9 items-center justify-center rounded-full bg-white/10 text-white/70 transition-colors hover:bg-white/20 hover:text-white"
          style={{ zIndex: 30 }}
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
        >
          <X className="size-5" />
        </button>

        <div
          className="overflow-hidden rounded-lg shadow-2xl"
          style={{
            width: SLIDE_WIDTH,
            height: SLIDE_HEIGHT,
            transform: `scale(${scale})`,
            transformOrigin: "0 0",
            background:
              slide.background.type === "gradient"
                ? `linear-gradient(${slide.background.angle}deg, ${slide.background.from}, ${slide.background.to})`
                : slide.background.color,
          }}
        >
          {ordered.map((el) => (
            <div
              key={el.id}
              className="absolute"
              style={{
                left: el.x,
                top: el.y,
                width: el.w,
                height: el.h,
                zIndex: el.zIndex,
                transform: `rotate(${el.rotate}deg)`,
                opacity: el.opacity,
              }}
            >
              <SlideElementView el={el} editing={null} interactive={false} />
            </div>
          ))}
        </div>
      </div>

      <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-3 text-white/60">
        <ChevronLeft className="hidden size-4 sm:block" />
        <span className="text-sm">
          {index + 1} de {presentation.slides.length} — {slide.name}
        </span>
        <ChevronRight className="hidden size-4 sm:block" />
      </div>

      <div
        className={cn(
          "absolute right-3 bottom-3 rounded-md border border-white/15 bg-white/10 px-2 py-1 text-[11px] text-white/50",
        )}
      >
        ← → navegar · Esc sair
      </div>
    </div>
  );
}

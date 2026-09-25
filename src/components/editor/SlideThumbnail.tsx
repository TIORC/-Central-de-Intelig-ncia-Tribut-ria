import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";

import { SlideElementView } from "@/components/editor/SlideElementView";
import type { Slide, SlideBackground } from "@/types/presentation";
import { SLIDE_HEIGHT, SLIDE_WIDTH } from "@/types/presentation";
import { cn } from "@/lib/utils";

function backgroundStyle(bg: SlideBackground): CSSProperties {
  if (bg.type === "gradient") {
    return { background: `linear-gradient(${bg.angle}deg, ${bg.from}, ${bg.to})` };
  }
  return { background: bg.color };
}

type SlideThumbnailProps = {
  slide: Slide;
  active?: boolean;
  dragOver?: boolean;
  className?: string;
  onPointerDown?: (e: React.PointerEvent) => void;
  onDragStart?: (e: React.DragEvent) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
};

export function SlideThumbnail({
  slide,
  active = false,
  dragOver = false,
  className,
  onPointerDown,
  onDragStart,
  onDragOver,
  onDrop,
}: SlideThumbnailProps) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.140625);

  useEffect(() => {
    const node = boxRef.current;
    if (!node) return;
    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width;
      if (width) setScale(width / SLIDE_WIDTH);
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const ordered = [...slide.elements].sort((a, b) => a.zIndex - b.zIndex);

  return (
    <div
      ref={boxRef}
      draggable={!!onDragStart}
      onPointerDown={onPointerDown}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      className={cn(
        "relative aspect-video w-full overflow-hidden rounded-md border transition-colors",
        dragOver && "border-accent",
        active
          ? "border-accent bg-accent/5 ring-2 ring-accent/60"
          : "border-border hover:border-primary/40",
        className,
      )}
    >
      <div
        className="absolute left-0 top-0 overflow-hidden"
        style={{
          width: SLIDE_WIDTH,
          height: SLIDE_HEIGHT,
          transform: `scale(${scale})`,
          transformOrigin: "0 0",
          ...backgroundStyle(slide.background),
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
  );
}

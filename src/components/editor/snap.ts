import type { SlideElement } from "@/types/presentation";
import { SLIDE_HEIGHT, SLIDE_WIDTH } from "@/types/presentation";

export type Rect = { x: number; y: number; w: number; h: number };
export type Guide = { axis: "x" | "y"; pos: number };

export const SNAP_THRESHOLD = 6;

export function elRect(el: SlideElement): Rect {
  return { x: el.x, y: el.y, w: el.w, h: el.h };
}

function xTargets(rects: Rect[]): number[] {
  const targets = [0, SLIDE_WIDTH / 2, SLIDE_WIDTH];
  for (const r of rects) targets.push(r.x, r.x + r.w / 2, r.x + r.w);
  return targets;
}

function yTargets(rects: Rect[]): number[] {
  const targets = [0, SLIDE_HEIGHT / 2, SLIDE_HEIGHT];
  for (const r of rects) targets.push(r.y, r.y + r.h / 2, r.y + r.h);
  return targets;
}

export function moveSnap(rect: Rect, others: Rect[]): { x: number; y: number; guides: Guide[] } {
  const xt = xTargets(others);
  const yt = yTargets(others);
  const guides: Guide[] = [];

  let sx = rect.x;
  let sy = rect.y;
  let bestDx = SNAP_THRESHOLD;
  let bestDy = SNAP_THRESHOLD;
  let offX = 0;
  let offY = 0;

  const xs = [rect.x, rect.x + rect.w / 2, rect.x + rect.w];
  const xOffsets = [0, rect.w / 2, rect.w];
  const ys = [rect.y, rect.y + rect.h / 2, rect.y + rect.h];
  const yOffsets = [0, rect.h / 2, rect.h];

  for (let i = 0; i < xs.length; i++) {
    const cand = xs[i] as number;
    for (const t of xt) {
      const d = Math.abs(cand - t);
      if (d <= bestDx) {
        bestDx = d;
        sx = rect.x + (t - cand);
        offX = xOffsets[i] as number;
      }
    }
  }
  for (let i = 0; i < ys.length; i++) {
    const cand = ys[i] as number;
    for (const t of yt) {
      const d = Math.abs(cand - t);
      if (d <= bestDy) {
        bestDy = d;
        sy = rect.y + (t - cand);
        offY = yOffsets[i] as number;
      }
    }
  }

  sx = Math.min(sx, SLIDE_WIDTH - rect.w);
  sy = Math.min(sy, SLIDE_HEIGHT - rect.h);
  sx = Math.max(sx, 0);
  sy = Math.max(sy, 0);

  if (bestDx < SNAP_THRESHOLD) guides.push({ axis: "x", pos: sx + offX });
  if (bestDy < SNAP_THRESHOLD) guides.push({ axis: "y", pos: sy + offY });

  return { x: sx, y: sy, guides };
}

export function edgeSnap(
  cur: number,
  delta: number,
  targets: number[],
  threshold = SNAP_THRESHOLD,
): { value: number; snapped: boolean } {
  const value = cur + delta;
  let best = value;
  let bestD = Infinity;
  for (const t of targets) {
    const d = Math.abs(value - t);
    if (d < bestD) {
      bestD = d;
      best = t;
    }
  }
  if (bestD <= threshold) return { value: best, snapped: true };
  return { value, snapped: false };
}

export function resizeSnap(
  start: Rect,
  dir: string,
  dx: number,
  dy: number,
  others: Rect[],
): { rect: Rect; guides: Guide[] } {
  const xt = xTargets(others);
  const yt = yTargets(others);
  const guides: Guide[] = [];
  const min = 24;

  let x = start.x;
  let y = start.y;
  let w = start.w;
  let h = start.h;

  if (dir.includes("e")) {
    const s = edgeSnap(start.x + start.w, dx, xt);
    w = Math.max(min, s.value - start.x);
    if (s.snapped) guides.push({ axis: "x", pos: start.x + w });
  } else if (dir.includes("w")) {
    const s = edgeSnap(start.x, dx, xt);
    const right = start.x + start.w;
    const nextX = Math.max(0, Math.min(s.value, right - min));
    x = nextX;
    w = right - nextX;
    if (s.snapped) guides.push({ axis: "x", pos: x });
  }

  if (dir.includes("s")) {
    const s = edgeSnap(start.y + start.h, dy, yt);
    h = Math.max(min, s.value - start.y);
    if (s.snapped) guides.push({ axis: "y", pos: start.y + h });
  } else if (dir.includes("n")) {
    const s = edgeSnap(start.y, dy, yt);
    const bottom = start.y + start.h;
    const nextY = Math.max(0, Math.min(s.value, bottom - min));
    y = nextY;
    h = bottom - nextY;
    if (s.snapped) guides.push({ axis: "y", pos: y });
  }

  x = Math.min(x, SLIDE_WIDTH - min);
  y = Math.min(y, SLIDE_HEIGHT - min);

  return { rect: { x, y, w, h }, guides };
}

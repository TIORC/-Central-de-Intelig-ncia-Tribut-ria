import type { Presentation, Slide, SlideElement } from "@/types/presentation";
import { SLIDE_HEIGHT, SLIDE_WIDTH } from "@/types/presentation";

// ---------------------------------------------------------------------------
// Exportação da apresentação interna para .pptx real (pptxgenjs).
// O canvas interno é 1280x720 px; o slide do PowerPoint é 10 x 5.625 in.
// Cores em oklch() (usadas na identidade Lumina) são convertidas para hex,
// porque o PowerPoint não entende oklch.
// ---------------------------------------------------------------------------

const INCH_WIDTH = 10;
const SCALE = INCH_WIDTH / SLIDE_WIDTH;
const INCH_HEIGHT = SLIDE_HEIGHT * SCALE;
const PX_TO_PT = 0.75;

type Rgb = { r: number; g: number; b: number; a: number };

const NAMED: Record<string, Rgb> = {
  white: { r: 255, g: 255, b: 255, a: 1 },
  black: { r: 0, g: 0, b: 0, a: 1 },
};

function clampByte(value: number): number {
  return Math.max(0, Math.min(255, Math.round(value)));
}

function linearToSrgb(value: number): number {
  return value <= 0.0031308 ? 12.92 * value : 1.055 * Math.pow(value, 1 / 2.4) - 0.055;
}

/** Converte oklch(L C H) para sRGB — usado nas cores da identidade Lumina. */
export function oklchToRgb(l: number, c: number, hDeg: number): Rgb {
  const h = (hDeg * Math.PI) / 180;
  const a = c * Math.cos(h);
  const b = c * Math.sin(h);

  const lPrime = l + 0.3963377774 * a + 0.2158037573 * b;
  const mPrime = l - 0.1055613458 * a - 0.0638541728 * b;
  const sPrime = l - 0.0894841775 * a - 1.291485548 * b;

  const lCubed = lPrime ** 3;
  const mCubed = mPrime ** 3;
  const sCubed = sPrime ** 3;

  const red = 4.0767416621 * lCubed - 3.3077115913 * mCubed + 0.2309699292 * sCubed;
  const green = -1.2684380046 * lCubed + 2.6097574011 * mCubed - 0.3413193965 * sCubed;
  const blue = -0.0041960863 * lCubed - 0.7034186147 * mCubed + 1.707614701 * sCubed;

  return {
    r: clampByte(linearToSrgb(red) * 255),
    g: clampByte(linearToSrgb(green) * 255),
    b: clampByte(linearToSrgb(blue) * 255),
    a: 1,
  };
}

function parseChannel(token: string, scale: number): number {
  const value = token.endsWith("%") ? Number(token.slice(0, -1)) / 100 : Number(token);
  return Number.isFinite(value) ? value * scale : 0;
}

export function parseColor(input?: string): Rgb | null {
  if (!input) return null;
  const value = input.trim().toLowerCase();

  if (NAMED[value]) return NAMED[value];

  if (value.startsWith("#")) {
    const hex = value.slice(1);
    if (hex.length === 3) {
      const r = hex.charAt(0);
      const g = hex.charAt(1);
      const b = hex.charAt(2);
      return {
        r: parseInt(r + r, 16),
        g: parseInt(g + g, 16),
        b: parseInt(b + b, 16),
        a: 1,
      };
    }
    if (hex.length >= 6) {
      return {
        r: parseInt(hex.slice(0, 2), 16),
        g: parseInt(hex.slice(2, 4), 16),
        b: parseInt(hex.slice(4, 6), 16),
        a: hex.length === 8 ? parseInt(hex.slice(6, 8), 16) / 255 : 1,
      };
    }
    return null;
  }

  const match = /^(rgba?|oklch)\(([^)]+)\)$/.exec(value);
  if (!match) return null;

  const parts = (match[2] ?? "")
    .split(/[\s,/]+/)
    .map((part) => part.trim())
    .filter(Boolean);

  if (match[1] === "oklch") {
    const rgb = oklchToRgb(
      parseChannel(parts[0] ?? "0", 1),
      parseChannel(parts[1] ?? "0", 1),
      parseChannel(parts[2]?.replace("deg", "") ?? "0", 1),
    );
    return { ...rgb, a: parts[3] ? Number(parts[3]) : 1 };
  }

  const alpha = parts[3] !== undefined ? Number(parts[3]) : 1;
  return {
    r: clampByte(parseChannel(parts[0] ?? "0", 255)),
    g: clampByte(parseChannel(parts[1] ?? "0", 255)),
    b: clampByte(parseChannel(parts[2] ?? "0", 255)),
    a: Number.isFinite(alpha) ? alpha : 1,
  };
}

/** Hex "RRGGBB" (sem #), formato aceito pelo pptxgenjs. */
export function hexOf(input?: string, fallback = "1B2540"): string {
  const rgb = parseColor(input);
  if (!rgb) return fallback;
  return [rgb.r, rgb.g, rgb.b].map((v) => v.toString(16).padStart(2, "0")).join("").toUpperCase();
}

/** Transparência 0-100 exigida pelo pptxgenjs. */
export function transparencyOf(input?: string, backgroundAlpha = 1): number {
  const rgb = parseColor(input);
  if (!rgb) return 0;
  const effective = rgb.a * backgroundAlpha;
  return Math.round((1 - effective) * 100);
}


type PptxCtor = (typeof import("pptxgenjs"))["default"];
type PptxInstance = InstanceType<PptxCtor>;
type PptxSlide = ReturnType<PptxInstance["addSlide"]>;

type TextEl = Extract<SlideElement, { type: "text" }>;
type CardEl = Extract<SlideElement, { type: "card" }>;
type StatEl = Extract<SlideElement, { type: "stat" }>;
type ImageEl = Extract<SlideElement, { type: "image" }>;
type ShapeEl = Extract<SlideElement, { type: "shape" }>;
type Background = Slide["background"];

const FONT_FACE = "Arial";
const TITLE_BAND = 0.34;

function rectOf(el: SlideElement) {
  return {
    x: el.x * SCALE,
    y: el.y * SCALE,
    w: Math.max(el.w * SCALE, 0.05),
    h: Math.max(el.h * SCALE, 0.05),
  };
}

function addTextElement(slide: PptxSlide, el: TextEl) {
  slide.addText(el.text, {
    ...rectOf(el),
    fontSize: el.fontSize * PX_TO_PT,
    bold: el.fontWeight >= 600,
    color: hexOf(el.color),
    transparency: transparencyOf(el.color),
    align: el.align,
    valign: "top",
    fontFace: FONT_FACE,
    margin: 0,
    ...(el.letterSpacing ? { charSpacing: el.letterSpacing * PX_TO_PT } : {}),
    ...(el.rotate ? { rotate: el.rotate } : {}),
  });
}

function addPanel(
  slide: PptxSlide,
  el: SlideElement,
  background: string,
  radius: number,
): ReturnType<typeof rectOf> {
  const rect = rectOf(el);
  slide.addShape("roundRect", {
    ...rect,
    fill: { color: hexOf(background, "2B3A63"), transparency: transparencyOf(background) },
    line: { color: hexOf(background, "2B3A63"), transparency: 100 },
    rectRadius: radius * SCALE,
  });
  return rect;
}

function addCardElement(slide: PptxSlide, el: CardEl) {
  const rect = addPanel(slide, el, el.background, el.radius);
  const pad = el.padding * SCALE;
  const innerX = rect.x + pad;
  const innerW = Math.max(rect.w - pad * 2, 0.4);
  const titleH = Math.min(0.4, rect.h / 3);

  slide.addText(el.title, {
    x: innerX,
    y: rect.y + pad,
    w: innerW,
    h: titleH,
    fontSize: el.titleSize * PX_TO_PT,
    bold: true,
    color: hexOf(el.titleColor),
    transparency: transparencyOf(el.titleColor),
    fontFace: FONT_FACE,
    valign: "top",
    margin: 0,
  });

  slide.addText(el.body, {
    x: innerX,
    y: rect.y + pad + titleH,
    w: innerW,
    h: Math.max(rect.h - pad * 2 - titleH, 0.3),
    fontSize: el.bodySize * PX_TO_PT,
    color: hexOf(el.bodyColor),
    transparency: transparencyOf(el.bodyColor),
    fontFace: FONT_FACE,
    valign: "top",
    margin: 0,
  });
}

function addStatElement(slide: PptxSlide, el: StatEl) {
  const rect = addPanel(slide, el, el.background, el.radius);
  const pad = el.padding * SCALE;
  const innerX = rect.x + pad;
  const innerW = Math.max(rect.w - pad * 2, 0.4);
  const valueH = Math.min(0.75, rect.h * 0.6);

  slide.addText(el.value, {
    x: innerX,
    y: rect.y + pad,
    w: innerW,
    h: valueH,
    fontSize: el.valueSize * PX_TO_PT,
    bold: true,
    color: hexOf(el.valueColor),
    transparency: transparencyOf(el.valueColor),
    fontFace: FONT_FACE,
    valign: "top",
    margin: 0,
  });

  slide.addText(el.label, {
    x: innerX,
    y: rect.y + pad + valueH,
    w: innerW,
    h: Math.max(rect.h - pad * 2 - valueH, 0.25),
    fontSize: el.labelSize * PX_TO_PT,
    color: hexOf(el.labelColor),
    transparency: transparencyOf(el.labelColor),
    fontFace: FONT_FACE,
    valign: "top",
    margin: 0,
  });
}

function addImageElement(slide: PptxSlide, el: ImageEl) {
  if (!el.src) return;
  const rect = rectOf(el);
  const source = el.src.startsWith("data:") ? { data: el.src } : { path: el.src };

  try {
    slide.addImage({ ...rect, ...source });
  } catch {
    // imagens remotas bloqueadas por CORS ou com URL inválida são ignoradas
  }
}

function addShapeElement(slide: PptxSlide, el: ShapeEl) {
  const rect = rectOf(el);
  const fill = { color: hexOf(el.color), transparency: transparencyOf(el.color) };
  const line = { color: hexOf(el.color), transparency: 100 };

  if (el.kind === "circle") {
    slide.addShape("ellipse", { ...rect, fill, line });
    return;
  }

  slide.addShape(el.kind === "bar" || el.kind === "line" ? "rect" : "roundRect", {
    ...rect,
    fill,
    line,
    ...(el.kind === "pill" ? { rectRadius: rect.h / 2 } : {}),
  });
}

function addBackground(slide: PptxSlide, background: Background) {
  // O PowerPoint não recebe oklch() nem gradiente por API: usamos a cor base
  // do gradiente como fundo sólido equivalente.
  const base = background.type === "solid" ? background.color : background.from;
  slide.background = { color: hexOf(base) };
}

function slugify(name: string): string {
  const slug = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
  return slug || "apresentacao";
}

/**
 * Gera e baixa um arquivo .pptx real a partir da apresentação do editor.
 * Devolve o nome do arquivo gerado.
 */
export async function exportPresentationToPptx(presentation: Presentation): Promise<string> {
  const imported = await import("pptxgenjs");
  const pptx = new imported.default();

  pptx.defineLayout({ name: "LUMINA_16_9", width: INCH_WIDTH, height: INCH_HEIGHT });
  pptx.layout = "LUMINA_16_9";
  pptx.title = presentation.name;
  pptx.author = "Lumina Consultoria";

  presentation.slides.forEach((slide) => {
    const target = pptx.addSlide();
    addBackground(target, slide.background);

    slide.elements.forEach((element) => {
      switch (element.type) {
        case "text":
          addTextElement(target, element);
          break;
        case "card":
          addCardElement(target, element);
          break;
        case "stat":
          addStatElement(target, element);
          break;
        case "image":
          addImageElement(target, element);
          break;
        case "shape":
          addShapeElement(target, element);
          break;
      }
    });
  });

  const fileName = `${slugify(presentation.name)}.pptx`;
  await pptx.writeFile({ fileName });
  return fileName;
}


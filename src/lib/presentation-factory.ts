import {
  PALETTE,
  makeShape,
  makeText,
  uid,
} from "@/data/slide-templates";
import type { Presentation, Slide } from "@/types/presentation";
import { SLIDE_WIDTH } from "@/types/presentation";

/** Apresentação vazia (1 slide) usada quando o cadastro é feito sem arquivo. */
export function newPresentation(name: string): Presentation {
  const slide: Slide = {
    id: uid("slide"),
    name: "Slide 1",
    background: { type: "solid", color: PALETTE.primary },
    elements: [
      makeShape("bar", { x: 0, y: 0, w: SLIDE_WIDTH, h: 8, color: PALETTE.gold, zIndex: 10 }),
      makeText({
        x: 76,
        y: 150,
        w: 1000,
        h: 30,
        text: "CENTRAL DE INTELIGÊNCIA TRIBUTÁRIA",
        fontSize: 16,
        fontWeight: 600,
        letterSpacing: 2,
        color: PALETTE.gold,
        zIndex: 11,
      }),
      makeText({
        x: 76,
        y: 205,
        w: 1120,
        h: 150,
        text: name,
        fontSize: 48,
        fontWeight: 700,
        color: PALETTE.white,
        zIndex: 12,
      }),
    ],
  };

  return { id: uid("pres"), name, slides: [slide] };
}

import { BarChart3, Image as ImageIcon, Minus, Square, Type } from "lucide-react";

import {
  makeCard,
  makeImage,
  makeShape,
  makeStat,
  makeText,
  PALETTE,
} from "@/data/slide-templates";
import type { EditorApi } from "@/hooks/use-presentation";
import { SLIDE_WIDTH } from "@/types/presentation";
import { cn } from "@/lib/utils";

type ElementToolbarProps = {
  api: EditorApi;
  className?: string;
};

const centerX = (w: number) => (SLIDE_WIDTH - w) / 2;

export function ElementToolbar({ api, className }: ElementToolbarProps) {
  const insert = (kind: "text" | "card" | "stat" | "image" | "bar") => {
    switch (kind) {
      case "text":
        api.addElement(
          makeText({
            x: centerX(560),
            y: 340,
            w: 560,
            h: 64,
            text: "Texto",
            fontSize: 28,
            fontWeight: 600,
            color: PALETTE.white,
          }),
        );
        break;
      case "card":
        api.addElement(makeCard({ x: centerX(600), y: 330, w: 600, h: 270 }));
        break;
      case "stat":
        api.addElement(makeStat({ x: centerX(400), y: 330, w: 400, h: 210 }));
        break;
      case "image":
        api.addElement(makeImage({ x: centerX(480), y: 300, w: 480, h: 330 }));
        break;
      case "bar":
        api.addElement(makeShape("bar", { x: centerX(720), y: 340, w: 720, h: 8 }));
        break;
    }
  };

  const items = [
    { kind: "text" as const, label: "Texto", icon: Type },
    { kind: "card" as const, label: "Card", icon: Square },
    { kind: "stat" as const, label: "Indicador", icon: BarChart3 },
    { kind: "image" as const, label: "Imagem", icon: ImageIcon },
    { kind: "bar" as const, label: "Barra", icon: Minus },
  ];

  return (
    <div
      className={cn(
        "flex shrink-0 items-center gap-1 border-r border-border bg-background p-2",
        className,
      )}
    >
      {items.map((item) => (
        <button
          key={item.kind}
          type="button"
          title={`Inserir ${item.label.toLowerCase()}`}
          onClick={() => insert(item.kind)}
          className="flex size-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          <item.icon className="size-4" />
        </button>
      ))}
      <span className="px-1 text-[10px] font-medium tracking-wide text-muted-foreground uppercase [writing-mode:vertical-rl]">
        Inserir
      </span>
    </div>
  );
}

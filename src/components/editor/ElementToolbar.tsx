import {
  BarChart3,
  ChartBar,
  ChartColumnBig,
  ChartLine,
  ChartPie,
  Image as ImageIcon,
  Minus,
  PanelRight,
  PieChart,
  Square,
  Type,
} from "lucide-react";

import {
  CHART_KIND_LABELS,
  makeCard,
  makeChart,
  makeChartCard,
  makeChartWithSideCard,
  makeImage,
  makeShape,
  makeStat,
  makeText,
  PALETTE,
} from "@/data/slide-templates";
import type { EditorApi } from "@/hooks/use-presentation";
import type { ChartKind } from "@/types/presentation";
import { SLIDE_WIDTH } from "@/types/presentation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

type ElementToolbarProps = {
  api: EditorApi;
  className?: string;
};

/** Tipos de gráfico oferecidos na criação, já com o estilo padrão do tema. */
const CHART_KINDS: { kind: ChartKind; icon: typeof ChartColumnBig }[] = [
  { kind: "column", icon: ChartColumnBig },
  { kind: "line", icon: ChartLine },
];

/** Tipos que seguem abrindo slides antigos, sem destaque na criação. */
const LEGACY_CHART_KINDS: ChartKind[] = ["bar", "area", "pie", "donut"];

const centerX = (w: number) => (SLIDE_WIDTH - w) / 2;

/** Área útil dos slides com cabeçalho, usada nos novos elementos. */
const CONTENT_TOP = 290;
const CONTENT_HEIGHT = 350;

export function ElementToolbar({ api, className }: ElementToolbarProps) {
  const insertChart = (chartKind: ChartKind) => {
    api.addElement(
      makeChart({
        x: centerX(800),
        y: CONTENT_TOP,
        w: 800,
        h: CONTENT_HEIGHT,
        chartKind,
      }),
    );
  };

  /** Gráfico à esquerda (~65%) e cartão de indicadores à direita (~30%). */
  const insertChartGroup = (chartKind: ChartKind, kpi = false) => {
    for (const element of makeChartWithSideCard(chartKind, {
      top: CONTENT_TOP,
      height: CONTENT_HEIGHT,
      kpi,
    })) {
      api.addElement(element);
    }
  };

  const insert = (kind: "text" | "card" | "stat" | "image" | "bar" | "chartCard") => {
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
      case "chartCard":
        api.addElement(
          makeChartCard({
            x: centerX(356),
            y: CONTENT_TOP,
            w: 356,
            h: CONTENT_HEIGHT,
          }),
        );
        break;
    }
  };

  const items = [
    { kind: "text" as const, label: "Texto", icon: Type },
    { kind: "card" as const, label: "Card", icon: Square },
    { kind: "stat" as const, label: "Indicador", icon: BarChart3 },
    { kind: "chartCard" as const, label: "Painel de indicadores", icon: PanelRight },
    { kind: "image" as const, label: "Imagem", icon: ImageIcon },
    { kind: "bar" as const, label: "Barra", icon: Minus },
  ];

  const buttonClass =
    "flex size-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground";

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
          className={buttonClass}
        >
          <item.icon className="size-4" />
        </button>
      ))}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button type="button" title="Inserir gráfico" className={buttonClass}>
            <ChartColumnBig className="size-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-72">
          <DropdownMenuLabel>Inserir gráfico</DropdownMenuLabel>
          {CHART_KINDS.map((item) => (
            <DropdownMenuItem key={item.kind} onSelect={() => insertChart(item.kind)}>
              <item.icon className="size-4 text-muted-foreground" />
              {CHART_KIND_LABELS[item.kind]}
            </DropdownMenuItem>
          ))}

          <DropdownMenuSeparator />

          <DropdownMenuLabel>Gráfico + painel de indicadores</DropdownMenuLabel>
          <DropdownMenuItem onSelect={() => insertChartGroup("column")}>
            <ChartColumnBig className="size-4 text-muted-foreground" />
            {CHART_KIND_LABELS.column} + lista
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => insertChartGroup("column", true)}>
            <ChartColumnBig className="size-4 text-muted-foreground" />
            {CHART_KIND_LABELS.column} + KPIs
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => insertChartGroup("line")}>
            <ChartLine className="size-4 text-muted-foreground" />
            {CHART_KIND_LABELS.line} + lista
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => insertChartGroup("line", true)}>
            <ChartLine className="size-4 text-muted-foreground" />
            {CHART_KIND_LABELS.line} + KPIs
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuLabel>Tipos antigos</DropdownMenuLabel>
          {LEGACY_CHART_KINDS.map((kind) => {
            const Icon =
              kind === "bar"
                ? ChartBar
                : kind === "area"
                  ? ChartColumnBig
                  : kind === "pie"
                    ? ChartPie
                    : PieChart;
            return (
              <DropdownMenuItem key={kind} onSelect={() => insertChart(kind)}>
                <Icon className="size-4 text-muted-foreground" />
                {CHART_KIND_LABELS[kind]}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>

      <span className="px-1 text-[10px] font-medium tracking-wide text-muted-foreground uppercase [writing-mode:vertical-rl]">
        Inserir
      </span>
    </div>
  );
}

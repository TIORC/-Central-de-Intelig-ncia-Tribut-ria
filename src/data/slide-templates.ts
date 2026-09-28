import type {
  CardElement,
  ChartCardElement,
  ChartCardItem,
  ChartElement,
  ChartKind,
  ImageElement,
  Presentation,
  ShapeElement,
  ShapeKind,
  Slide,
  SlideElement,
  StatElement,
  TextElement,
} from "@/types/presentation";
import { SLIDE_HEIGHT, SLIDE_WIDTH } from "@/types/presentation";
import { DEFAULT_CHART_THEME } from "@/lib/chart-theme";

export const PALETTE = {
  primary: "oklch(0.31 0.077 264)",
  navy: "oklch(0.23 0.062 264)",
  gold: "oklch(0.79 0.148 84)",
  white: "#ffffff",
  ink: "oklch(0.21 0.04 260)",
  muted: "oklch(0.53 0.03 258)",
  soft: "oklch(0.968 0.006 255)",
  border: "oklch(0.92 0.009 255)",
  green: "oklch(0.62 0.13 158)",
  red: "oklch(0.577 0.245 27.325)",
} as const;

/** Cores das séries dos gráficos — vem do tema padrão (chart-theme). */
export const CHART_SERIES_COLORS = DEFAULT_CHART_THEME.series.palette;

export const CHART_KIND_LABELS: Record<ChartKind, string> = {
  bar: "Barras horizontais",
  column: "Barras agrupadas",
  line: "Linha",
  area: "Área",
  pie: "Pizza",
  donut: "Rosca",
};

/** Tipos de gráfico oferecidos na criação (os demais seguem legíveis em slides antigos). */
export const PRIMARY_CHART_KINDS: ChartKind[] = ["column", "line"];

let counter = 0;
let deterministicIds = false;
export function uid(prefix = "el"): string {
  counter += 1;
  // The sample presentation is rendered on both the server and client during
  // hydration. Its IDs must be reproducible so chart CSS variables match.
  if (deterministicIds) return `${prefix}-sample-${counter}`;
  return `${prefix}-${Date.now().toString(36)}-${counter}-${Math.random().toString(36).slice(2, 7)}`;
}

export function makeText(over: Partial<TextElement> = {}): TextElement {
  return {
    id: uid("text"),
    type: "text",
    x: 96,
    y: 300,
    w: 640,
    h: 72,
    zIndex: 1,
    rotate: 0,
    opacity: 1,
    text: "Texto",
    fontSize: 28,
    fontWeight: 600,
    color: PALETTE.white,
    align: "left",
    letterSpacing: 0,
    ...over,
  };
}

export function makeCard(over: Partial<CardElement> = {}): CardElement {
  return {
    id: uid("card"),
    type: "card",
    x: 80,
    y: 360,
    w: 520,
    h: 240,
    zIndex: 1,
    rotate: 0,
    opacity: 1,
    title: "Título do card",
    body: "Descreva aqui o conteúdo deste card, com detalhes e observações relevantes.",
    titleSize: 22,
    bodySize: 16,
    titleColor: PALETTE.gold,
    bodyColor: "rgba(255,255,255,0.85)",
    background: "rgba(255,255,255,0.10)",
    radius: 14,
    padding: 28,
    ...over,
  };
}

export function makeStat(over: Partial<StatElement> = {}): StatElement {
  return {
    id: uid("stat"),
    type: "stat",
    x: 80,
    y: 390,
    w: 360,
    h: 190,
    zIndex: 1,
    rotate: 0,
    opacity: 1,
    value: "R$ 0,0",
    label: "Indicador",
    valueSize: 40,
    labelSize: 15,
    valueColor: PALETTE.gold,
    labelColor: "rgba(255,255,255,0.8)",
    background: "rgba(255,255,255,0.10)",
    radius: 12,
    padding: 28,
    ...over,
  };
}

export function makeImage(over: Partial<ImageElement> = {}): ImageElement {
  return {
    id: uid("image"),
    type: "image",
    x: 160,
    y: 190,
    w: 480,
    h: 340,
    zIndex: 1,
    rotate: 0,
    opacity: 1,
    src: "",
    alt: "Imagem",
    radius: 12,
    objectFit: "cover",
    ...over,
  };
}

/** Categorias de exemplo no formato usado nos slides de referência (Jan/2025). */
export const DEFAULT_CHART_CATEGORIES = [
  "Jan/2025",
  "Fev/2025",
  "Mar/2025",
  "Abr/2025",
  "Mai/2025",
  "Jun/2025",
];

/**
 * Gráfico novo já no estilo padrão (tema escuro de dashboard financeiro).
 * O tema é aplicado só aqui, na criação: se o usuário trocar uma cor, a
 * escolha dele é preservada.
 */
export function makeChart(over: Partial<ChartElement> = {}): ChartElement {
  const theme = DEFAULT_CHART_THEME;
  return {
    id: uid("chart"),
    type: "chart",
    x: 64,
    y: 290,
    w: 800,
    h: 350,
    zIndex: 1,
    rotate: 0,
    opacity: 1,
    chartKind: "column",
    title: "Receita x Despesas (R$)",
    yAxisTitle: theme.axes.y.title,
    categories: [...DEFAULT_CHART_CATEGORIES],
    series: [
      {
        id: uid("serie"),
        name: "Série 1",
        color: theme.series.primary,
        values: [3952.01, 4210.55, 3880.4, 4560.9, 4320.75, 4790.3],
      },
      {
        id: uid("serie"),
        name: "Série 2",
        color: theme.series.secondary,
        values: [2480.35, 2610.1, 2390.8, 2740.45, 2590.2, 2810.6],
      },
    ],
    showLegend: true,
    showValues: false,
    showGrid: false,
    textSize: theme.typography.textSize,
    textColor: theme.colors.axis,
    background: theme.chart.background,
    radius: theme.chart.radius,
    padding: theme.chart.padding,
    ...over,
  };
}

/** Item novo do cartão lateral de indicadores. */
export function makeChartCardItem(over: Partial<ChartCardItem> = {}): ChartCardItem {
  return { id: uid("metric"), label: "Indicador", value: "R$ 0,00", ...over };
}

/**
 * Cartão lateral de indicadores: fundo azul-acinzentado escuro, cantos bem
 * arredondados, sem borda, título branco em negrito.
 */
export function makeChartCard(over: Partial<ChartCardElement> = {}): ChartCardElement {
  const theme = DEFAULT_CHART_THEME.card;
  return {
    id: uid("chartCard"),
    type: "chartCard",
    x: 860,
    y: 290,
    w: 356,
    h: 350,
    zIndex: 2,
    rotate: 0,
    opacity: 1,
    variant: "list",
    title: "Indicadores",
    items: [
      makeChartCardItem({ label: "Receita apurada", value: "R$ 4.200.000,00" }),
      makeChartCardItem({ label: "Tributos devidos", value: "R$ 3.100.000,00" }),
      makeChartCardItem({ label: "Créditos recuperáveis", value: "R$ 538.000,00" }),
      makeChartCardItem({
        label: "Resultado estimado",
        value: "R$ 1.638.000,00",
        emphasis: true,
      }),
    ],
    background: theme.background,
    radius: theme.radius,
    padding: theme.padding,
    titleSize: theme.titleSize,
    labelSize: theme.labelSize,
    valueSize: theme.valueSize,
    totalSize: theme.totalSize,
    titleColor: theme.titleColor,
    labelColor: theme.labelColor,
    valueColor: theme.valueColor,
    ...over,
  };
}

/** Cartão lateral em formato KPIs: rótulo pequeno, valor grande e legenda. */
export function makeKpiCard(over: Partial<ChartCardElement> = {}): ChartCardElement {
  return makeChartCard({
    variant: "kpi",
    title: "Destaques do período",
    items: [
      makeChartCardItem({
        label: "Economia potencial",
        value: "12,8%",
        note: "Sobre a carga apurada",
        color: DEFAULT_CHART_THEME.support.maximum,
      }),
      makeChartCardItem({
        label: "Créditos identificados",
        value: "R$ 538 mil",
        note: "Últimos 5 anos",
        color: DEFAULT_CHART_THEME.support.minimum,
      }),
      makeChartCardItem({
        label: "Alíquota efetiva",
        value: "24,3%",
        note: "PIS/COFINS + IRPJ/CSLL",
        color: DEFAULT_CHART_THEME.support.positive,
      }),
    ],
    ...over,
  });
}

/**
 * Layout de referência: gráfico à esquerda (~65%) e cartão de indicadores à
 * direita (~30%), com uma pequena folga entre os dois.
 */
export function makeChartWithSideCard(
  chartKind: ChartKind = "column",
  options: { top?: number; height?: number; kpi?: boolean } = {},
): SlideElement[] {
  const { top = 290, height = 350, kpi = false } = options;
  const { chartShare, cardShare, gap } = DEFAULT_CHART_THEME.layout;
  const margin = 64;
  const available = SLIDE_WIDTH - margin * 2 - gap;
  const chartW = Math.round((available * chartShare) / (chartShare + cardShare));
  const cardW = available - chartW;

  const chart = makeChart({
    x: margin,
    y: top,
    w: chartW,
    h: height,
    chartKind,
    zIndex: 1,
  });

  const card = kpi
    ? makeKpiCard({ x: margin + chartW + gap, y: top, w: cardW, h: height, zIndex: 2 })
    : makeChartCard({ x: margin + chartW + gap, y: top, w: cardW, h: height, zIndex: 2 });

  return [chart, card];
}

export function makeShape(kind: ShapeKind, over: Partial<ShapeElement> = {}): ShapeElement {
  const dims: Record<ShapeKind, { w: number; h: number }> = {
    bar: { w: SLIDE_WIDTH, h: 8 },
    line: { w: 640, h: 4 },
    circle: { w: 160, h: 160 },
    rect: { w: 320, h: 180 },
    pill: { w: 360, h: 64 },
  };
  return {
    id: uid("shape"),
    type: "shape",
    x: 0,
    y: 0,
    w: dims[kind].w,
    h: dims[kind].h,
    zIndex: 1,
    rotate: 0,
    opacity: 1,
    kind,
    color: PALETTE.gold,
    ...over,
  };
}

export function blankSlide(index: number): Slide {
  return {
    id: uid("slide"),
    name: `Slide ${index}`,
    background: { type: "solid", color: PALETTE.primary },
    elements: [
      makeShape("bar", { x: 0, y: 0, w: SLIDE_WIDTH, h: 8, color: PALETTE.gold }),
      makeText({
        x: 128,
        y: 300,
        w: 720,
        h: 80,
        text: "Título do slide",
        fontSize: 44,
        fontWeight: 700,
      }),
    ],
  };
}

export function header(
  title: string,
  kicker = "CENTRAL DE INTELIGÊNCIA TRIBUTÁRIA",
): SlideElement[] {
  return [
    makeShape("bar", { x: 0, y: 0, w: SLIDE_WIDTH, h: 8, color: PALETTE.gold, zIndex: 10 }),
    makeText({
      x: 76,
      y: 128,
      w: 1000,
      h: 30,
      text: kicker,
      fontSize: 16,
      fontWeight: 600,
      letterSpacing: 2,
      color: PALETTE.gold,
      zIndex: 11,
    }),
    makeText({
      x: 76,
      y: 180,
      w: 1100,
      h: 110,
      text: title,
      fontSize: 52,
      fontWeight: 700,
      color: PALETTE.white,
      zIndex: 12,
    }),
  ];
}

export function footer(page: string): SlideElement[] {
  return [
    makeText({
      x: 76,
      y: 660,
      w: 700,
      h: 24,
      text: "Lumina Consultoria · Confidencial",
      fontSize: 13,
      fontWeight: 400,
      color: "rgba(255,255,255,0.55)",
      zIndex: 10,
    }),
    makeText({
      x: 1140,
      y: 660,
      w: 70,
      h: 24,
      text: page,
      fontSize: 13,
      fontWeight: 400,
      align: "right",
      color: "rgba(255,255,255,0.55)",
      zIndex: 10,
    }),
  ];
}

function capaSlide(): Slide {
  return {
    id: uid("slide"),
    name: "Capa institucional",
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
        h: 130,
        text: "Diagnóstico Tributário 2026",
        fontSize: 58,
        fontWeight: 700,
        color: PALETTE.white,
        zIndex: 12,
      }),
      makeText({
        x: 76,
        y: 345,
        w: 820,
        h: 72,
        text: "Análise consolidada da carga tributária, oportunidades de crédito e plano de ação para o próximo ciclo fiscal.",
        fontSize: 20,
        fontWeight: 400,
        color: "rgba(255,255,255,0.75)",
        zIndex: 12,
      }),
      ...footer("01"),
    ],
  };
}

function cargaSlides(): Slide {
  return {
    id: uid("slide"),
    name: "Carga tributária consolidada",
    background: { type: "solid", color: PALETTE.primary },
    elements: [
      ...header("Carga tributária consolidada"),
      makeStat({
        x: 70,
        y: 400,
        w: 370,
        h: 190,
        value: "R$ 4,2 mi",
        label: "Tributos apurados",
        zIndex: 1,
      }),
      makeStat({
        x: 455,
        y: 400,
        w: 370,
        h: 190,
        value: "12,8%",
        label: "Economia potencial",
        zIndex: 1,
      }),
      makeStat({
        x: 840,
        y: 400,
        w: 370,
        h: 190,
        value: "R$ 538 mil",
        label: "Créditos identificados",
        zIndex: 1,
      }),
      ...footer("02"),
    ],
  };
}

function evolucaoSlide(): Slide {
  const [chart, card] = makeChartWithSideCard("column", { top: 330, height: 300 });
  return {
    id: uid("slide"),
    name: "Evolução da carga tributária",
    background: { type: "solid", color: PALETTE.navy },
    elements: [
      ...header("Evolução da carga tributária"),
      {
        ...(chart as ChartElement),
        w: 800,
        title: "Tributos apurados x créditos utilizados (R$ milhões)",
        categories: ["2021", "2022", "2023", "2024", "2025", "2026"],
        series: [
          {
            id: uid("serie"),
            name: "Tributos apurados",
            color: DEFAULT_CHART_THEME.series.primary,
            values: [3.4, 3.6, 3.9, 4.1, 4.0, 4.2],
          },
          {
            id: uid("serie"),
            name: "Créditos utilizados",
            color: DEFAULT_CHART_THEME.series.secondary,
            values: [0.2, 0.3, 0.4, 0.5, 0.6, 0.8],
          },
        ],
      },
      {
        ...(card as ChartCardElement),
        x: 890,
        w: 326,
        title: "Indicadores do período",
        items: [
          makeChartCardItem({ label: "Tributos apurados", value: "R$ 4.200.000,00" }),
          makeChartCardItem({ label: "Créditos utilizados", value: "R$ 800.000,00" }),
          makeChartCardItem({
            label: "Resultado",
            value: "R$ 3.400.000,00",
            emphasis: true,
          }),
        ],
      },
      ...footer("03"),
    ],
  };
}

function oportunidadesSlides(): Slide {
  return {
    id: uid("slide"),
    name: "Oportunidades identificadas",
    background: { type: "solid", color: PALETTE.primary },
    elements: [
      ...header("Oportunidades identificadas"),
      makeCard({
        x: 70,
        y: 395,
        w: 560,
        h: 235,
        title: "Recuperação de créditos",
        body: "PIS/COFINS não cumulativos: apuração preliminar indica créditos não aproveitados nos últimos 5 anos.",
        zIndex: 1,
      }),
      makeCard({
        x: 650,
        y: 395,
        w: 560,
        h: 235,
        title: "Revisão de enquadramento",
        body: "Possibilidade de migração para regime mais benéfico, reduzindo a alíquota efetiva sobre a receita.",
        zIndex: 1,
      }),
      ...footer("04"),
    ],
  };
}

function planoAcaoSlides(): Slide {
  return {
    id: uid("slide"),
    name: "Plano de ação",
    background: { type: "solid", color: PALETTE.primary },
    elements: [
      ...header("Plano de ação"),
      makeCard({
        x: 64,
        y: 395,
        w: 262,
        h: 235,
        title: "01",
        body: "Mapear apurações e bases de cálculo",
        titleSize: 40,
        bodySize: 15,
        zIndex: 1,
      }),
      makeCard({
        x: 348,
        y: 395,
        w: 262,
        h: 235,
        title: "02",
        body: "Auditar créditos não lançados em 60 dias",
        titleSize: 40,
        bodySize: 15,
        zIndex: 1,
      }),
      makeCard({
        x: 632,
        y: 395,
        w: 262,
        h: 235,
        title: "03",
        body: "Implementar controles de apuração",
        titleSize: 40,
        bodySize: 15,
        zIndex: 1,
      }),
      makeCard({
        x: 916,
        y: 395,
        w: 262,
        h: 235,
        title: "04",
        body: "Validar cenários junto à Receita Federal",
        titleSize: 40,
        bodySize: 15,
        zIndex: 1,
      }),
      ...footer("05"),
    ],
  };
}

function encerramentoSildes(): Slide {
  return {
    id: uid("slide"),
    name: "Encerramento",
    background: { type: "solid", color: PALETTE.navy },
    elements: [
      makeShape("bar", { x: 0, y: 0, w: SLIDE_WIDTH, h: 8, color: PALETTE.gold, zIndex: 10 }),
      makeText({
        x: 0,
        y: 190,
        w: SLIDE_WIDTH,
        h: 110,
        text: "Obrigado.",
        fontSize: 64,
        fontWeight: 700,
        align: "center",
        color: PALETTE.gold,
        letterSpacing: 1,
        zIndex: 11,
      }),
      makeText({
        x: 0,
        y: 320,
        w: SLIDE_WIDTH,
        h: 60,
        text: "Estamos à disposição para validar as próximas etapas e tirar dúvidas da diretoria.",
        fontSize: 20,
        fontWeight: 400,
        align: "center",
        color: "rgba(255,255,255,0.75)",
        zIndex: 11,
      }),
      ...footer("06"),
    ],
  };
}

export function samplePresentation(): Presentation {
  const previousCounter = counter;
  const wasDeterministic = deterministicIds;
  counter = 0;
  deterministicIds = true;
  try {
    return {
      id: "demo",
      name: "Diagnóstico Tributário 2026",
      slides: [
        capaSlide(),
        cargaSlides(),
        evolucaoSlide(),
        oportunidadesSlides(),
        planoAcaoSlides(),
        encerramentoSildes(),
      ],
    };
  } finally {
    counter = previousCounter;
    deterministicIds = wasDeterministic;
  }
}

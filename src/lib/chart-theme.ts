import type { ChartElement } from "@/types/presentation";

// ---------------------------------------------------------------------------
// TEMA PADRÃO DOS GRÁFICOS
//
// Única fonte da verdade do visual dos gráficos do editor: tema escuro,
// moderno e sóbrio (dashboard financeiro), reaproveitado pelo canvas,
// pelas miniaturas (SlideThumbnail), pelo modo apresentação
// (PresentationMode) e pela exportação .pptx.
//
// O estilo padrão é aplicado apenas na criação do gráfico. Se o usuário
// alterar uma cor/tamanho no Inspector, a escolha dele é mantida.
// ---------------------------------------------------------------------------

export const DEFAULT_CHART_THEME = {
  /** Fundo de slide recomendado para este tema (azul-marinho quase preto). */
  slide: {
    background: "#07111F",
  },

  chart: {
    /** O fundo do gráfico é transparente para fundir com o slide. */
    background: "transparent",
    /** Sem borda nem moldura. */
    border: "none",
    radius: 0,
    padding: 16,
    /** Altura reservada para a legenda interna no topo. */
    legendGutter: 26,
  },

  typography: {
    titleSize: 17,
    textSize: 13,
    axisTitleSize: 12,
    valueSize: 11,
    titleWeight: 700,
    axisTitleWeight: 600,
    valueWeight: 600,
  },

  /** Todo texto do gráfico é claro — nunca preto, pelo fundo escuro. */
  colors: {
    title: "#FFFFFF",
    axis: "#E2E8F0",
    value: "#F8FAFC",
    legend: "#E2E8F0",
    positive: "#22C55E",
    maximum: "#FF7F0E",
    minimum: "#3B82F6",
    tooltipBackground: "#0B1626",
    tooltipBorder: "#1E2A3D",
  },

  /** Grade apenas horizontal, em azul-acinzentado bem sutil. */
  grid: {
    horizontal: true,
    vertical: false,
    color: "#1E2A3D",
    opacity: 0.85,
  },

  series: {
    /** Série 1 azul, série 2 laranja; extras em tons que combinam com o fundo. */
    palette: ["#1F77B4", "#FF7F0E", "#2CA02C", "#9467BD", "#17BECF", "#E377C2", "#8C564B"],
    primary: "#1F77B4",
    secondary: "#FF7F0E",
  },

  /** Apoio: positivo verde, máximo laranja, mínimo azul. */
  support: {
    positive: "#22C55E",
    maximum: "#FF7F0E",
    minimum: "#3B82F6",
  },

  /** Barras agrupadas: dupla colada por categoria, espaço entre as duplas. */
  bars: {
    grouped: true,
    /** Colada dentro da dupla. */
    barGap: 2,
    /** Espaço entre as duplas de categorias. */
    barCategoryGap: "32%",
    maxBarSize: 46,
    /** Cantos retos. */
    radius: 0,
    /** Equivalente no PowerPoint (%). */
    gapWidthPct: 45,
  },

  /** Linha contínua espessa com marcadores redondos em cada ponto. */
  line: {
    curve: "monotone",
    strokeWidth: 3.5,
    dotRadius: 4.5,
    activeDotRadius: 6,
    /** Equivalente no PowerPoint. */
    symbolSize: 6,
  },

  /** Legenda dentro do gráfico, no canto superior esquerdo. */
  legend: {
    placement: "inside-top-left",
    markerSize: 10,
    gap: 16,
  },

  axes: {
    x: { showLine: true, lineOpacity: 0.35 },
    y: {
      title: "Valor (R$)",
      showLine: false,
      /** Largura da faixa do eixo Y em múltiplos do tamanho da fonte. */
      widthFactor: 6.4,
    },
  },

  /** Layout de referência: gráfico ~65% à esquerda e cartão ~30% à direita. */
  layout: {
    chartShare: 0.65,
    cardShare: 0.3,
    gap: 26,
  },

  /** Cartão lateral de indicadores. */
  card: {
    background: "#111827",
    radius: 20,
    padding: 24,
    titleSize: 16,
    labelSize: 13,
    valueSize: 15,
    totalSize: 18,
    titleColor: "#FFFFFF",
    labelColor: "#CBD5E1",
    valueColor: "#22C55E",
    totalColor: "#22C55E",
    mutedColor: "#94A3B8",
  },
} as const;

export type ChartTheme = typeof DEFAULT_CHART_THEME;

const currencyFormat = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Formata um valor no padrão brasileiro de moeda: R$ 3.952,01. */
export function formatChartCurrency(value: number): string {
  if (!Number.isFinite(value)) return "—";
  return currencyFormat.format(value);
}

/** Cor de apoio conforme a posição do valor na série (positivo, máximo, mínimo). */
export function supportColorAt(values: number[], index: number): string {
  const finite = values.filter((value) => Number.isFinite(value));
  if (finite.length === 0) return DEFAULT_CHART_THEME.support.positive;

  const value = values[index];
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return DEFAULT_CHART_THEME.support.positive;
  }

  const max = Math.max(...finite);
  const min = Math.min(...finite);
  if (value === max && max !== min) return DEFAULT_CHART_THEME.support.maximum;
  if (value === min && max !== min) return DEFAULT_CHART_THEME.support.minimum;
  return DEFAULT_CHART_THEME.support.positive;
}

/** Título do eixo Y: usa o do elemento ou o padrão do tema. */
export function chartYAxisTitle(el: Pick<ChartElement, "yAxisTitle">): string {
  return el.yAxisTitle ?? DEFAULT_CHART_THEME.axes.y.title;
}

/** Cor base dos textos do gráfico, sempre clara. */
export function chartTextColor(el: Pick<ChartElement, "textColor">): string {
  return el.textColor || DEFAULT_CHART_THEME.colors.axis;
}

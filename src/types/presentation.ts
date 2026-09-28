export const SLIDE_WIDTH = 1280;
export const SLIDE_HEIGHT = 720;

export type ElementType = "text" | "card" | "stat" | "image" | "shape" | "chart" | "chartCard";

export type ElementAlign = "left" | "center" | "right";
export type ElementFontWeight = 400 | 500 | 600 | 700;
export type ShapeKind = "bar" | "line" | "circle" | "rect" | "pill";
export type ChartKind = "bar" | "column" | "line" | "area" | "pie" | "donut";

/** Uma série do gráfico: uma cor, um nome e um valor por categoria. */
export type ChartSeries = {
  id: string;
  name: string;
  color: string;
  values: number[];
};

type ElementBase = {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  w: number;
  h: number;
  zIndex: number;
  rotate: number;
  opacity: number;
};

export type TextElement = ElementBase & {
  type: "text";
  text: string;
  fontSize: number;
  fontWeight: ElementFontWeight;
  color: string;
  align: ElementAlign;
  letterSpacing: number;
};

export type CardElement = ElementBase & {
  type: "card";
  title: string;
  body: string;
  titleSize: number;
  bodySize: number;
  titleColor: string;
  bodyColor: string;
  background: string;
  radius: number;
  padding: number;
};

export type StatElement = ElementBase & {
  type: "stat";
  value: string;
  label: string;
  valueSize: number;
  labelSize: number;
  valueColor: string;
  labelColor: string;
  background: string;
  radius: number;
  padding: number;
};

export type ImageElement = ElementBase & {
  type: "image";
  src: string;
  alt: string;
  radius: number;
  objectFit: "cover" | "contain";
};

export type ShapeElement = ElementBase & {
  type: "shape";
  kind: ShapeKind;
  color: string;
};

export type ChartElement = ElementBase & {
  type: "chart";
  chartKind: ChartKind;
  title: string;
  /** Título vertical do eixo Y (padrão: "Valor (R$)"). */
  yAxisTitle?: string;
  categories: string[];
  series: ChartSeries[];
  showLegend: boolean;
  showValues: boolean;
  showGrid: boolean;
  textSize: number;
  textColor: string;
  background: string;
  radius: number;
  padding: number;
};

/** Linha do cartão lateral: rótulo, valor e observação opcional. */
export type ChartCardItem = {
  id: string;
  label: string;
  value: string;
  note?: string;
  /** Cor de destaque opcional para o valor deste indicador. */
  color?: string;
  /** Destaque (total) — valor maior e separador acima. */
  emphasis?: boolean;
};

/** Cartão lateral de indicadores que acompanha o gráfico. */
export type ChartCardElement = ElementBase & {
  type: "chartCard";
  /** "list": rótulo esquerda / valor direita. "kpi": grade de indicadores. */
  variant: "list" | "kpi";
  title: string;
  items: ChartCardItem[];
  background: string;
  radius: number;
  padding: number;
  titleSize: number;
  labelSize: number;
  valueSize: number;
  totalSize: number;
  titleColor: string;
  labelColor: string;
  valueColor: string;
};

export type SlideElement =
  | TextElement
  | CardElement
  | StatElement
  | ImageElement
  | ShapeElement
  | ChartElement
  | ChartCardElement;
export type SlideBackground =
  { type: "solid"; color: string } | { type: "gradient"; from: string; to: string; angle: number };

export type Slide = {
  id: string;
  name: string;
  background: SlideBackground;
  elements: SlideElement[];
};

export type Presentation = {
  id: string;
  name: string;
  slides: Slide[];
};

export type ElementTextField = "text" | "title" | "body" | "value" | "label";

export type EditTarget = {
  id: string;
  field: ElementTextField;
};

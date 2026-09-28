import { useId, type CSSProperties } from "react";
import { ChartNoAxesColumn as ChartIcon } from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Line,
  LineChart,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts";

import { EditableText } from "@/components/editor/EditableText";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { isChartEmpty, seriesColorAt } from "@/lib/chart-data";
import {
  DEFAULT_CHART_THEME,
  chartTextColor,
  chartYAxisTitle,
  formatChartCurrency,
} from "@/lib/chart-theme";
import type { ChartElement, ChartSeries, EditTarget } from "@/types/presentation";
import { cn } from "@/lib/utils";

type ChartViewApi =
  | {
      commitEdit?: (text: string) => void;
      cancelEdit?: () => void;
    }
  | undefined;

type ChartElementViewProps = {
  el: ChartElement;
  editing: EditTarget | null;
  api?: ChartViewApi;
  /** Miniaturas e modo apresentação dispensam animação e tooltip. */
  interactive?: boolean;
};

type ChartRow = { name: string } & Record<string, string | number>;

const noop = () => {};

/** Converte o modelo (categorias × séries) no formato em linhas do Recharts. */
function buildRows(el: ChartElement): ChartRow[] {
  return el.categories.map((category, index) => {
    const row: ChartRow = { name: category };
    for (const serie of el.series) row[serie.id] = serie.values[index] ?? 0;
    return row;
  });
}

function buildConfig(el: ChartElement): ChartConfig {
  const config: ChartConfig = {};
  for (const serie of el.series) config[serie.id] = { label: serie.name, color: serie.color };
  return config;
}

/** Legenda interna, no canto superior esquerdo, sem tapar as barras. */
function ChartLegend({ el }: { el: ChartElement }) {
  return (
    <ul
      className="pointer-events-none absolute top-0 left-0 z-10 flex flex-wrap items-center gap-y-1"
      style={{ columnGap: DEFAULT_CHART_THEME.legend.gap }}
    >
      {el.series.map((serie) => (
        <li key={serie.id} className="flex items-center gap-1.5">
          <span
            className="shrink-0"
            style={{
              width: DEFAULT_CHART_THEME.legend.markerSize,
              height: DEFAULT_CHART_THEME.legend.markerSize,
              borderRadius: 2,
              background: serie.color,
            }}
          />
          <span style={{ fontSize: el.textSize, color: DEFAULT_CHART_THEME.colors.legend }}>
            {serie.name}
          </span>
        </li>
      ))}
    </ul>
  );
}

/** Rótulos de valor no padrão brasileiro: R$ 3.952,01. */
function ValueLabels({
  el,
  dataKey,
  position,
}: {
  el: ChartElement;
  dataKey: string;
  position: "top" | "right";
}) {
  if (!el.showValues) return null;
  return (
    <LabelList
      dataKey={dataKey}
      position={position}
      fill={DEFAULT_CHART_THEME.colors.value}
      fontSize={Math.max(9, el.textSize - 2)}
      fontWeight={DEFAULT_CHART_THEME.typography.valueWeight}
      formatter={(value: unknown) => formatChartCurrency(Number(value))}
    />
  );
}

/** Variáveis de CSS alimentadas pelo tema padrão e consumidas pelos estilos. */
const themeVars = {
  "--chart-tooltip-bg": DEFAULT_CHART_THEME.colors.tooltipBackground,
  "--chart-tooltip-border": DEFAULT_CHART_THEME.colors.tooltipBorder,
  "--chart-tooltip-text": DEFAULT_CHART_THEME.colors.value,
  "--chart-axis-text": DEFAULT_CHART_THEME.colors.axis,
} as CSSProperties;

export function ChartElementView({ el, editing, api, interactive = true }: ChartElementViewProps) {
  const commit = api?.commitEdit ?? noop;
  const cancel = api?.cancelEdit ?? noop;
  const isEditingTitle = editing?.id === el.id && editing.field === "title";

  const rows = buildRows(el);
  const config = buildConfig(el);
  const text = chartTextColor(el);
  const empty = isChartEmpty(el);
  const animated = { isAnimationActive: false };
  const rawId = useId().replace(/:/g, "");
  const chartId = `chart-${rawId}`;

  const tickFont = Math.max(9, el.textSize - 2);
  const axisFont = Math.max(9, el.textSize - 1);
  const titleFont = Math.round(el.textSize * 1.3);

  const margin = {
    top: el.showLegend ? DEFAULT_CHART_THEME.chart.legendGutter : 8,
    right: 18,
    bottom: 8,
    left: 26,
  };

  /** Grade apenas horizontal (sem linhas verticais). */
  const gridLine = (vertical: boolean) =>
    el.showGrid ? (
      <CartesianGrid
        vertical={vertical}
        horizontal={!vertical}
        stroke={DEFAULT_CHART_THEME.grid.color}
        strokeOpacity={DEFAULT_CHART_THEME.grid.opacity}
      />
    ) : null;

  const axisTick = { fontSize: tickFont, fill: text };

  const tooltip = interactive ? (
    <ChartTooltip
      cursor={{ fill: DEFAULT_CHART_THEME.colors.value, fillOpacity: 0.06 }}
      content={
        <ChartTooltipContent
          indicator="dot"
          className="rounded-lg border border-(--chart-tooltip-border) bg-(--chart-tooltip-bg) text-(--chart-tooltip-text) shadow-xl"
          labelClassName="font-semibold"
          formatter={(value, name, item) => (
            <div className="flex w-full items-center justify-between gap-3">
              <span className="flex items-center gap-1.5">
                <span
                  className="size-2.5 shrink-0 rounded-[2px]"
                  style={{ background: item.color }}
                />
                <span>{name}</span>
              </span>
              <span className="font-semibold tabular-nums">
                {formatChartCurrency(Number(value))}
              </span>
            </div>
          )}
        />
      }
    />
  ) : null;

  /** Eixo X de categorias (Jan/2025, Fev/2025…). */
  const categoryAxis = (
    <XAxis
      dataKey="name"
      tick={axisTick}
      tickLine={false}
      axisLine={{ stroke: text, strokeOpacity: DEFAULT_CHART_THEME.axes.x.lineOpacity }}
      interval="preserveStartEnd"
      padding={{ left: 8, right: 8 }}
    />
  );

  /** Eixo Y com título vertical e valores em R$. */
  const valueAxis = (
    <YAxis
      tick={axisTick}
      tickLine={false}
      axisLine={false}
      width={Math.round(el.textSize * DEFAULT_CHART_THEME.axes.y.widthFactor)}
      tickFormatter={(value) => formatChartCurrency(Number(value))}
      label={{
        value: chartYAxisTitle(el),
        angle: -90,
        position: "insideLeft",
        offset: 6,
        style: {
          fill: text,
          fontSize: axisFont,
          fontWeight: DEFAULT_CHART_THEME.typography.axisTitleWeight,
          textAnchor: "middle",
        },
      }}
    />
  );

  function cartesianChart() {
    // Herança: barras horizontais (slides antigos) mantêm categorias no eixo Y.
    if (el.chartKind === "bar") {
      return (
        <BarChart data={rows} layout="vertical" margin={{ top: 8, right: 18, bottom: 8, left: 8 }}>
          {gridLine(true)}
          <XAxis
            type="number"
            tick={axisTick}
            tickLine={false}
            axisLine={{ stroke: text, strokeOpacity: DEFAULT_CHART_THEME.axes.x.lineOpacity }}
            tickFormatter={(value) => formatChartCurrency(Number(value))}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={Math.round(el.textSize * 5)}
            tick={axisTick}
            tickLine={false}
            axisLine={false}
          />
          {tooltip}
          {el.series.map((serie) => (
            <Bar
              key={serie.id}
              dataKey={serie.id}
              name={serie.name}
              fill={serie.color}
              radius={DEFAULT_CHART_THEME.bars.radius}
              maxBarSize={32}
              {...animated}
            >
              <ValueLabels el={el} dataKey={serie.id} position="right" />
            </Bar>
          ))}
        </BarChart>
      );
    }

    if (el.chartKind === "line") {
      return (
        <LineChart data={rows} margin={margin}>
          {gridLine(false)}
          {categoryAxis}
          {valueAxis}
          {tooltip}
          {el.series.map((serie) => (
            <Line
              key={serie.id}
              type={DEFAULT_CHART_THEME.line.curve}
              dataKey={serie.id}
              name={serie.name}
              stroke={serie.color}
              strokeWidth={DEFAULT_CHART_THEME.line.strokeWidth}
              dot={{
                r: DEFAULT_CHART_THEME.line.dotRadius,
                fill: serie.color,
                stroke: serie.color,
              }}
              activeDot={{
                r: DEFAULT_CHART_THEME.line.activeDotRadius,
                fill: serie.color,
                stroke: serie.color,
              }}
              {...animated}
            >
              <ValueLabels el={el} dataKey={serie.id} position="top" />
            </Line>
          ))}
        </LineChart>
      );
    }

    if (el.chartKind === "area") {
      return (
        <AreaChart data={rows} margin={margin}>
          {gridLine(false)}
          {categoryAxis}
          {valueAxis}
          {tooltip}
          {el.series.map((serie) => (
            <Area
              key={serie.id}
              type={DEFAULT_CHART_THEME.line.curve}
              dataKey={serie.id}
              name={serie.name}
              stroke={serie.color}
              strokeWidth={2.5}
              fill={serie.color}
              fillOpacity={0.22}
              {...animated}
            >
              <ValueLabels el={el} dataKey={serie.id} position="top" />
            </Area>
          ))}
        </AreaChart>
      );
    }

    // Barras agrupadas (padrão): dupla colada por categoria, cantos retos.
    return (
      <BarChart
        data={rows}
        barGap={DEFAULT_CHART_THEME.bars.barGap}
        barCategoryGap={DEFAULT_CHART_THEME.bars.barCategoryGap}
        margin={margin}
      >
        {gridLine(false)}
        {categoryAxis}
        {valueAxis}
        {tooltip}
        {el.series.map((serie) => (
          <Bar
            key={serie.id}
            dataKey={serie.id}
            name={serie.name}
            fill={serie.color}
            radius={DEFAULT_CHART_THEME.bars.radius}
            maxBarSize={DEFAULT_CHART_THEME.bars.maxBarSize}
            {...animated}
          >
            <ValueLabels el={el} dataKey={serie.id} position="top" />
          </Bar>
        ))}
      </BarChart>
    );
  }

  function pieChart() {
    // isChartEmpty já garante que existe ao menos uma série.
    const first = el.series[0] as ChartSeries;
    const isDonut = el.chartKind === "donut";

    return (
      <PieChart margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
        {tooltip}
        <Pie
          data={rows}
          dataKey={first.id}
          nameKey="name"
          innerRadius={isDonut ? "52%" : 0}
          outerRadius="86%"
          paddingAngle={isDonut ? 2 : 0}
          stroke="none"
          {...animated}
        >
          {rows.map((row, index) => (
            <Cell key={`${String(row.name)}-${index}`} fill={seriesColorAt(index)} />
          ))}
        </Pie>
      </PieChart>
    );
  }

  return (
    <div
      className="flex h-full w-full flex-col overflow-hidden"
      style={{
        // Fundo transparente e sem moldura: o gráfico funde com o fundo do slide.
        background: el.background,
        borderRadius: el.radius,
        border: DEFAULT_CHART_THEME.chart.border,
        padding: el.padding,
        ...themeVars,
      }}
    >
      {el.title || isEditingTitle ? (
        <div
          className="min-h-[1em] shrink-0 cursor-text pb-3"
          data-field="title"
          style={{
            fontSize: titleFont,
            color: DEFAULT_CHART_THEME.colors.title,
            fontWeight: DEFAULT_CHART_THEME.typography.titleWeight,
          }}
        >
          {isEditingTitle ? (
            <EditableText value={el.title} singleLine onCommit={commit} onCancel={cancel} />
          ) : (
            <p className="truncate">{el.title}</p>
          )}
        </div>
      ) : null}

      {empty ? (
        <div
          className={cn(
            "flex min-h-0 flex-1 flex-col items-center justify-center gap-2 text-center",
            interactive && "border-2 border-dashed border-white/20",
          )}
        >
          <ChartIcon className="size-7 opacity-40" style={{ color: text }} />
          {interactive ? (
            <p className="max-w-[85%] text-xs opacity-60" style={{ color: text }}>
              Gráfico sem dados — preencha a tabela no painel à direita
            </p>
          ) : null}
        </div>
      ) : (
        <div className="relative min-h-0 flex-1">
          <style
            dangerouslySetInnerHTML={{
              __html: `[data-chart="${chartId}"] .recharts-cartesian-axis-tick_text { fill: var(--chart-axis-text); }`,
            }}
          />
          {el.showLegend ? <ChartLegend el={el} /> : null}
          <ChartContainer
            id={rawId}
            config={config}
            className="aspect-auto h-full w-full [&_.recharts-cartesian-axis-tick_text]:fill-(--chart-axis-text)"
          >
            {el.chartKind === "pie" || el.chartKind === "donut" ? pieChart() : cartesianChart()}
          </ChartContainer>
        </div>
      )}
    </div>
  );
}

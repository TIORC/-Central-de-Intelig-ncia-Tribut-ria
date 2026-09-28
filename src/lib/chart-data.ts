import { uid } from "@/data/slide-templates";
import { DEFAULT_CHART_THEME, formatChartCurrency } from "@/lib/chart-theme";
import type { ChartElement, ChartSeries } from "@/types/presentation";

const numberFormat = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 });

/** Formata um valor do gráfico no padrão brasileiro, sem notação científica. */
export function formatChartValue(value: number): string {
  if (!Number.isFinite(value)) return "—";
  return numberFormat.format(value);
}

/** Formata valores monetários do gráfico: R$ 3.952,01. */
export function formatChartValueCurrency(value: number): string {
  return formatChartCurrency(value);
}

/** Cor da próxima série, cycling pela paleta do tema padrão. */
export function seriesColorAt(index: number): string {
  const palette = DEFAULT_CHART_THEME.series.palette;
  return palette[index % palette.length] as string;
}

/** Cria uma série nova alinhada às categorias já cadastradas. */
export function makeSeries(index: number, name: string, values: number[]): ChartSeries {
  return { id: uid("serie"), name, color: seriesColorAt(index), values };
}

/**
 * Converte texto numérico em número aceitando o formato pt-BR
 * (1.234,56) e o formato com ponto decimal (1234.56).
 */
export function parseChartNumber(raw: string): number {
  const text = raw.trim().replace(/[^\d.,-]/g, "");
  if (!text) return 0;

  const lastComma = text.lastIndexOf(",");
  const lastDot = text.lastIndexOf(".");

  if (lastComma > -1 && lastDot > -1) {
    const whole = text.slice(0, lastComma).replace(/\./g, "");
    const decimals = text.slice(lastComma + 1).replace(/\./g, "");
    return Number(`${whole}.${decimals}`) || 0;
  }

  if (lastComma > -1) {
    const digitsAfter = text.length - lastComma - 1;
    // Vírgula com exatamente três dígitos é separador de milhar em tabelas
    // exportadas do Excel em pt-BR; nos demais casos é decimal.
    return digitsAfter === 3 && text.indexOf(",") === lastComma
      ? Number(text.replace(/,/g, "")) || 0
      : Number(text.replace(",", ".")) || 0;
  }

  if (lastDot > -1) {
    return /^\d{1,3}(\.\d{3})+$/.test(text)
      ? Number(text.replace(/\./g, "")) || 0
      : Number(text) || 0;
  }

  return Number(text) || 0;
}

/** Detecta o separador usado numa linha colada do Excel/Sheets. */
function splitRow(line: string): string[] {
  if (line.includes("\t")) return line.split("\t").map((cell) => cell.trim());
  if (line.includes(";")) return line.split(";").map((cell) => cell.trim());
  if (line.includes(",")) return line.split(",").map((cell) => cell.trim());
  return [line.trim()];
}

export type ParsedChartTable = {
  categories: string[];
  series: Omit<ChartSeries, "id" | "color">[];
};

/**
 * Lê uma tabela colada da planilha. A primeira linha é o cabeçalho com os
 * nomes das séries; a primeira coluna de cada linha seguinte é a categoria.
 */
export function parseChartTable(text: string): ParsedChartTable | null {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trimEnd())
    .filter((line) => line.trim().length > 0);

  if (lines.length < 2) return null;

  const header = splitRow(lines[0] as string);
  const rows = lines.slice(1).map(splitRow);
  const width = Math.max(header.length, ...rows.map((r) => r.length));
  if (width < 2) return null;

  const categories: string[] = [];
  const series: ParsedChartTable["series"] = [];

  for (let column = 1; column < width; column += 1) {
    series.push({
      name: header[column] || `Série ${column}`,
      values: rows.map((row) => parseChartNumber(row[column] ?? "0")),
    });
  }

  rows.forEach((row, index) => {
    categories.push(row[0] || `Item ${index + 1}`);
  });

  return { categories, series };
}

/** Verdadeiro quando o gráfico não tem nada a desenhar. */
export function isChartEmpty(el: Pick<ChartElement, "categories" | "series">): boolean {
  if (el.categories.length === 0 || el.series.length === 0) return true;
  return el.series.every((s) => s.values.length === 0);
}

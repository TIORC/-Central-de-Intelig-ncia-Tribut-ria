import type { CellValue, SheetMatrix } from "./types";

// ---------------------------------------------------------------------------
// Parser estruturado de planilhas de "Planejamento Tributário".
// Reconhece o layout usado pela consultoria:
//   A1 título · A3 cliente · A4 CNPJ · linha de meses (01/2025, 02/2025 ...)
//   blocos "LUCRO PRESUMIDO", "LUCRO REAL", "SIMPLES NACIONAL", "ECONOMIA ..."
// Quando o layout não é reconhecido, o importador cai no builder genérico.
// ---------------------------------------------------------------------------

const MONTH_PATTERNS = [
  /^(\d{1,2})\/(\d{4})$/,
  /^(\d{1,2})\/(\d{2})$/,
  /^(\d{4})-(\d{2})(-\d{2})?$/,
  /^([a-zç]{3,9})[/\s-](\d{4})$/i,
];

const REGIMES: { key: RegimeData["key"]; nome: string; re: RegExp }[] = [
  { key: "presumido", nome: "Lucro Presumido", re: /lucro\s+presumido/i },
  { key: "real", nome: "Lucro Real", re: /lucro\s+real/i },
  { key: "simples", nome: "Simples Nacional", re: /simples\s+nacional/i },
];

// "ECONOMIA", "ECONOMONIA", "MELHOR CENÁRIO" (tolera o erro de digitação comum).
const ECONOMIA_RE = /eco\w*mon|melhor\s+cen/i;
const TOTAL_RE = /^total\b/i;

export type ValorLinha = {
  rowIndex: number;
  label: string;
  mensal: (number | null)[];
  percentual: (number | null)[];
  total: number;
  preenchida: boolean;
};

export type ReceitaLinha = {
  label: string;
  mensal: number[];
  total: number;
};

export type RegimeData = {
  key: "presumido" | "real" | "simples";
  nome: string;
  mensal: number[];
  total: number;
  percentualMedio: number | null;
  detalhes: { label: string; mensal: number[]; total: number }[];
};

export type PlanejamentoData = {
  fonte: string;
  titulo: string;
  cliente: string;
  cnpj: string;
  periodos: string[];
  receitaMensal: number[];
  receitaTotal: number;
  receitas: ReceitaLinha[];
  percentualTributado: number[];
  regimes: RegimeData[];
  economia: ReceitaLinha | null;
  melhorRegime: RegimeData | null;
};

function numeric(value: CellValue): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string") {
    const raw = value.trim();
    if (!/^-?\d+(\.\d+)?$/.test(raw)) return null;
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function isMonthLabel(text: string): boolean {
  const clean = text.trim();
  if (!clean) return false;
  return MONTH_PATTERNS.some((re) => re.test(clean));
}

function cellText(sheet: SheetMatrix, row: number, col: number): string {
  return (sheet.text[row]?.[col] ?? "").toString().trim();
}

function cellValue(sheet: SheetMatrix, row: number, col: number): CellValue {
  return sheet.rows[row]?.[col] ?? null;
}

type Header = { rowIndex: number; monthCols: number[]; labels: string[] };

function findHeader(sheet: SheetMatrix): Header | null {
  for (let r = 0; r < sheet.rows.length; r += 1) {
    const text = sheet.text[r] ?? [];
    const monthCols: number[] = [];
    const labels: string[] = [];
    for (let c = 0; c < text.length; c += 1) {
      const t = (text[c] ?? "").toString().trim();
      if (isMonthLabel(t)) {
        monthCols.push(c);
        labels.push(t);
      }
    }
    if (monthCols.length >= 2) return { rowIndex: r, monthCols, labels };
  }
  return null;
}

function labelBefore(row: string[] | undefined, limit: number): string {
  const stop = Math.max(1, limit);
  for (let c = 0; c < stop; c += 1) {
    const t = (row?.[c] ?? "").toString().trim();
    if (t) return t;
  }
  return "";
}

function readValorLinha(sheet: SheetMatrix, rowIndex: number, header: Header): ValorLinha | null {
  const label = labelBefore(sheet.text[rowIndex], header.monthCols[0] ?? 0);
  if (!label) return null;

  const mensal: (number | null)[] = [];
  const percentual: (number | null)[] = [];

  header.monthCols.forEach((col) => {
    const value = numeric(cellValue(sheet, rowIndex, col));
    mensal.push(value);
    const next = numeric(cellValue(sheet, rowIndex, col + 1));
    percentual.push(next !== null && next > 0 && next < 1 ? next : null);
  });

  const preenchida = mensal.some((v) => v !== null && v !== 0);
  const total = mensal.reduce<number>((acc, v) => acc + (v ?? 0), 0);

  return { rowIndex, label, mensal, percentual, total, preenchida };
}

function metaAcima(sheet: SheetMatrix, headerRow: number) {
  let titulo = "";
  let cliente = "";
  let cnpj = "";

  for (let r = 0; r < headerRow; r += 1) {
    const row = (sheet.text[r] ?? []).map((c) => (c ?? "").toString().trim());
    const first = row.find((c) => c !== "");
    if (!first) continue;

    if (/cnpj/i.test(first) && !cnpj) {
      cnpj = first.replace(/^cnpj\s*:?\s*/i, "").trim();
      continue;
    }
    if (!titulo) {
      titulo = first;
      continue;
    }
    if (!cliente && !/^\d+([.,]\d+)?$/.test(first)) {
      cliente = first;
    }
  }

  return { titulo, cliente, cnpj };
}

/**
 * Tenta interpretar uma aba como planilha de planejamento tributário.
 * Retorna `null` quando o layout não é reconhecido (aí o importador usa o
 * builder genérico).
 */
export function parsePlanejamento(sheet: SheetMatrix): PlanejamentoData | null {
  const header = findHeader(sheet);
  if (!header) return null;

  const linhas: ValorLinha[] = [];
  for (let r = header.rowIndex + 1; r < sheet.rows.length; r += 1) {
    const linha = readValorLinha(sheet, r, header);
    if (linha) linhas.push(linha);
  }

  const regimeLinhas = REGIMES.map((regime) => ({
    key: regime.key,
    nome: regime.nome,
    linha: linhas.find((l) => regime.re.test(l.label) && l.preenchida) ?? null,
  })).filter((item) => item.linha !== null) as {
    key: RegimeData["key"];
    nome: string;
    linha: ValorLinha;
  }[];

  const economiaLinha = linhas.find((l) => ECONOMIA_RE.test(l.label) && l.preenchida) ?? null;

  if (regimeLinhas.length < 2) return null;

  const boundaries = [
    ...regimeLinhas.map((r) => r.linha.rowIndex),
    ...(economiaLinha ? [economiaLinha.rowIndex] : []),
  ].sort((a, b) => a - b);

  const receitaTotalLinha =
    linhas.find((l) => /total\s+receita/i.test(l.label) && l.preenchida) ?? null;
  const receitaTotal = receitaTotalLinha?.total ?? 0;

  const primeiroBloco = boundaries[0] ?? Number.MAX_SAFE_INTEGER;
  const receitas: ReceitaLinha[] = linhas
    .filter((l) => l.rowIndex < primeiroBloco)
    .filter((l) => /^receita/i.test(l.label) && l.total !== 0)
    .map((l) => ({
      label: l.label,
      mensal: l.mensal.map((v) => v ?? 0),
      total: l.total,
    }));

  const percentualLinha = linhas.find((l) => /percentual\s+tributado/i.test(l.label)) ?? null;

  const regimes: RegimeData[] = regimeLinhas.map((regime) => {
    const start = regime.linha.rowIndex;
    const end = boundaries.find((b) => b > start) ?? Number.MAX_SAFE_INTEGER;

    const detalhes = linhas
      .filter((l) => l.rowIndex > start && l.rowIndex < end)
      .filter((l) => !TOTAL_RE.test(l.label) && !ECONOMIA_RE.test(l.label))
      .filter((l) => l.mensal.some((v) => v !== null))
      .map((l) => ({
        label: l.label,
        mensal: l.mensal.map((v) => v ?? 0),
        total: l.total,
      }));

    const totalLinha =
      linhas.find(
        (l) => l.rowIndex > start && l.rowIndex < end && TOTAL_RE.test(l.label) && l.preenchida,
      ) ?? null;

    const mensalBase = regime.linha.mensal.some((v) => v !== null && v !== 0)
      ? regime.linha.mensal
      : (totalLinha?.mensal ?? []);
    const total = totalLinha?.total ?? regime.linha.total;

    const percentuais = regime.linha.percentual.filter((v): v is number => v !== null);
    const percentualMedio = percentuais.length
      ? percentuais.reduce((a, b) => a + b, 0) / percentuais.length
      : receitaTotal > 0
        ? total / receitaTotal
        : null;

    return {
      key: regime.key,
      nome: regime.nome,
      mensal: mensalBase.map((v) => v ?? 0),
      total,
      percentualMedio,
      detalhes,
    };
  });

  const comValor = [...regimes].filter((r) => r.total > 0).sort((a, b) => a.total - b.total);

  return {
    fonte: sheet.name,
    ...metaAcima(sheet, header.rowIndex),
    periodos: header.labels,
    receitaMensal: (receitaTotalLinha?.mensal ?? []).map((v) => v ?? 0),
    receitaTotal,
    receitas,
    percentualTributado: (percentualLinha?.mensal ?? []).map((v) => v ?? 0),
    regimes,
    economia: economiaLinha
      ? {
          label: economiaLinha.label,
          mensal: economiaLinha.mensal.map((v) => v ?? 0),
          total: economiaLinha.total,
        }
      : null,
    melhorRegime: comValor[0] ?? null,
  };
}


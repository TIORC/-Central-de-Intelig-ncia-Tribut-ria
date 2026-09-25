// Modelo neutro de documento extraído de Excel / Word / PDF.
// Os parsers produzem DocModel/WorkbookModel e o builder converte em Presentation.
// Fase 2 (IA cloud-free) vai enriquecer esse mesmo modelo — nada precisa ser
// reescrito quando o LLM entrar.

export type ImportKind = "excel" | "word" | "pdf";

export type CellValue = string | number | boolean | Date | null;

export type SheetMatrix = {
  name: string;
  /** Valores calculados de cada célula (linha x coluna). */
  rows: CellValue[][];
  /** Texto exibido em cada célula (formatado como no Excel). */
  text: string[][];
};

export type WorkbookModel = {
  kind: "excel";
  sourceFile: string;
  sheetNames: string[];
  sheets: SheetMatrix[];
};

export type DocTable = {
  headers: string[];
  rows: string[][];
  caption?: string;
};

export type DocStat = {
  valor: string;
  rotulo: string;
};

export type DocSection = {
  heading: string;
  paragraphs: string[];
  bullets: string[];
  tables: DocTable[];
  stats: DocStat[];
};

export type DocModel = {
  kind: ImportKind;
  sourceFile: string;
  title: string;
  subtitle?: string;
  meta: { label: string; value: string }[];
  sections: DocSection[];
};

export type ImportResult = {
  strategy: "planejamento" | "generico";
  sourceFile: string;
  slideCount: number;
  warning?: string;
};

export const IMPORT_LIMITS = {
  excel: 15 * 1024 * 1024,
  word: 10 * 1024 * 1024,
  pdf: 20 * 1024 * 1024,
} as const;

export const IMPORT_EXTENSIONS: Record<ImportKind, string[]> = {
  excel: [".xlsx", ".xls", ".xlsm", ".csv"],
  word: [".docx"],
  pdf: [".pdf"],
};

export function detectKind(fileName: string): ImportKind | null {
  const lower = fileName.toLowerCase();
  const entries = Object.entries(IMPORT_EXTENSIONS) as [ImportKind, string[]][];
  for (const [kind, extensions] of entries) {
    if (extensions.some((ext) => lower.endsWith(ext))) return kind;
  }
  return null;
}

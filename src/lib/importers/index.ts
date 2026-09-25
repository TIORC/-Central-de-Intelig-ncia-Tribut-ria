import type { Presentation } from "@/types/presentation";

import { buildGenericPresentation, buildPlanejamentoPresentation } from "./build-presentation";
import { parseWorkbook, pickBestSheet } from "./excel";
import { parsePdf } from "./pdf";
import { parsePlanejamento, type PlanejamentoData } from "./planejamento";
import { textToDocModel } from "./text";
import {
  IMPORT_EXTENSIONS,
  IMPORT_LIMITS,
  detectKind,
  type DocModel,
  type ImportResult,
  type SheetMatrix,
} from "./types";
import { parseDocx } from "./word";

export { IMPORT_EXTENSIONS, IMPORT_LIMITS } from "./types";
export type { ImportResult } from "./types";

export type ImportOptions = { nome: string };
export type ImportOutcome = { presentation: Presentation; result: ImportResult };

const ACCEPT_ATTRIBUTE = Object.values(IMPORT_EXTENSIONS).flat().join(",");

export const FILE_ACCEPT = ACCEPT_ATTRIBUTE;

function formatSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

export function validateFile(file: File): string | null {
  const kind = detectKind(file.name);
  if (!kind) {
    return "Formato não suportado. Envie .xlsx, .xls, .csv, .docx ou .pdf.";
  }
  if (file.size > IMPORT_LIMITS[kind]) {
    return `Arquivo muito grande (${formatSize(file.size)}). Limite para ${kind}: ${formatSize(IMPORT_LIMITS[kind])}.`;
  }
  if (file.size === 0) return "O arquivo está vazio.";
  return null;
}

function importResult(
  strategy: ImportResult["strategy"],
  file: File,
  presentation: Presentation,
  warning?: string,
): ImportResult {
  const base = {
    strategy,
    sourceFile: file.name,
    slideCount: presentation.slides.length,
  };
  return warning ? { ...base, warning } : base;
}

function findPlanejamentoSheet(
  sheets: SheetMatrix[],
): { sheet: SheetMatrix; data: PlanejamentoData } | null {
  for (const sheet of sheets) {
    const data = parsePlanejamento(sheet);
    if (data) return { sheet, data };
  }
  return null;
}

function sheetToDocModel(sheet: SheetMatrix, fileName: string): DocModel {
  const lines: string[] = [];

  sheet.rows.forEach((row) => {
    const cells = row
      .map((cell) => (cell === null || cell === undefined ? "" : String(cell).trim()))
      .filter(Boolean);
    if (cells.length === 0) return;
    lines.push(cells.length === 1 ? (cells[0] ?? "") : cells.join(" · "));
  });

  return textToDocModel({ fileName, kind: "excel", title: sheet.name, lines });
}

/**
 * Converte um arquivo importado (Excel/Word/PDF) em uma `Presentation`
 * pronta para abrir no editor, usando a identidade visual padrão da Lumina.
 */
export async function importPresentation(
  file: File,
  options: ImportOptions,
): Promise<ImportOutcome> {
  const invalid = validateFile(file);
  if (invalid) throw new Error(invalid);

  const kind = detectKind(file.name);
  if (!kind) throw new Error("Formato não suportado.");

  if (kind === "excel") {
    const sheets = await parseWorkbook(file);
    if (sheets.length === 0) throw new Error("A planilha não possui abas legíveis.");

    const planejamento = findPlanejamentoSheet(sheets);
    if (planejamento) {
      const presentation = buildPlanejamentoPresentation(planejamento.data, options);
      const faltando = 3 - planejamento.data.regimes.length;
      const aviso = `A planilha não trouxe dados de ${faltando} regime(s); esses slides foram marcados para revisão.`;

      return {
        presentation,
        result: importResult("planejamento", file, presentation, faltando > 0 ? aviso : undefined),
      };
    }

    const sheet = pickBestSheet(sheets);
    if (!sheet) throw new Error("Não encontramos dados suficientes na planilha enviada.");

    const presentation = buildGenericPresentation(sheetToDocModel(sheet, file.name), options);
    return {
      presentation,
      result: importResult(
        "generico",
        file,
        presentation,
        "Layout da planilha não é o padrão de planejamento tributário. Geramos uma apresentação genérica a partir dos dados encontrados.",
      ),
    };
  }

  if (kind === "word") {
    const model = await parseDocx(file);
    const presentation = buildGenericPresentation(model, options);
    return { presentation, result: importResult("generico", file, presentation) };
  }

  const model = await parsePdf(file);
  const presentation = buildGenericPresentation(model, options);
  return {
    presentation,
    result: importResult(
      "generico",
      file,
      presentation,
      "Imagens e gráficos do PDF não são importados nesta versão.",
    ),
  };
}

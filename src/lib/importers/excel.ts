import type { CellValue, SheetMatrix } from "./types";

export const EXCEL_MIME = [
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
  "text/csv",
];

/**
 * Lê um arquivo .xlsx/.xls/.xlsm/.csv no browser (sem backend) e devolve
 * a matriz de valores calculados de cada aba, além do texto formatado.
 * O `import("xlsx")` é dinâmico para não pesar no bundle inicial.
 */
export async function parseWorkbook(file: File): Promise<SheetMatrix[]> {
  const XLSX = await import("xlsx");
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array", cellDates: true });

  return workbook.SheetNames.map((name) => {
    const sheet = workbook.Sheets[name];
    if (!sheet) return { name, rows: [], text: [] };

    const rows = XLSX.utils.sheet_to_json<CellValue[]>(sheet, {
      header: 1,
      raw: true,
      defval: null,
      blankrows: true,
    });
    const text = XLSX.utils.sheet_to_json<string[]>(sheet, {
      header: 1,
      raw: false,
      defval: "",
      blankrows: true,
    });

    return { name, rows, text };
  });
}

/** Primeira aba com algum conteúdo relevante (evita abas de capa/índice vazias). */
export function pickBestSheet(sheets: SheetMatrix[]): SheetMatrix | null {
  const scored = sheets
    .map((sheet) => {
      const filled = sheet.rows.reduce(
        (acc, row) => acc + row.filter((c) => c !== null && String(c).trim() !== "").length,
        0,
      );
      return { sheet, filled };
    })
    .filter((item) => item.filled > 3)
    .sort((a, b) => b.filled - a.filled);

  return scored[0]?.sheet ?? null;
}

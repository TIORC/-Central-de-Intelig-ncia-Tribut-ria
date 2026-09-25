import type { DocModel, DocSection } from "./types";

const HEADING_MAX = 70;

function clean(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function isHeading(line: string): boolean {
  const text = clean(line);
  if (!text || text.length > HEADING_MAX) return false;
  if (/[.;]$/.test(text)) return false;
  const letters = text.replace(/[^\p{L}]/gu, "");
  if (letters.length < 3) return false;
  const upper = letters === letters.toUpperCase();
  return upper || /:\s*$/.test(text) || /^(cap[íi]tulo|se[çc][ãa]o|item|\d+[.)])/i.test(text);
}

function splitSentences(text: string): string[] {
  return clean(text)
    .split(/(?<=[.!?])\s+(?=[A-ZÀ-Ú0-9])/)
    .map((part) => part.trim())
    .filter(Boolean);
}

/**
 * Converte texto corrido (Word/PDF/planilha simples) num DocModel com seções.
 * Heurística: linhas curtas em caixa alta/terminando em ":" viram títulos.
 */
export function textToDocModel(
  input: { fileName: string; kind: DocModel["kind"]; title: string; lines: string[] },
): DocModel {
  const sections: DocSection[] = [];
  let current: DocSection | null = null;

  input.lines.forEach((rawLine) => {
    const line = clean(rawLine);
    if (!line) return;

    if (isHeading(line)) {
      current = { heading: line.replace(/:\s*$/, ""), paragraphs: [], bullets: [], tables: [], stats: [] };
      sections.push(current);
      return;
    }

    if (!current) {
      current = { heading: input.title || "Conteúdo", paragraphs: [], bullets: [], tables: [], stats: [] };
      sections.push(current);
    }

    if (/^[•\-–*·]\s+/.test(rawLine.trim())) {
      current.bullets.push(line.replace(/^[•\-–*·]\s+/, ""));
      return;
    }

    const sentences = splitSentences(line);
    if (sentences.length > 1) current.bullets.push(...sentences);
    else current.paragraphs.push(line);
  });

  return {
    kind: input.kind,
    sourceFile: input.fileName,
    title: input.title || input.fileName.replace(/\.[a-z0-9]+$/i, ""),
    meta: [{ label: "Arquivo", value: input.fileName }],
    sections: sections.filter(
      (s) => s.paragraphs.length + s.bullets.length + s.tables.length + s.stats.length > 0,
    ),
  };
}

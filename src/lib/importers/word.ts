import { textToDocModel } from "./text";
import type { DocModel } from "./types";

/** Extrai o texto de um .docx no browser (sem backend) e monta o DocModel. */
export async function parseDocx(file: File): Promise<DocModel> {
  const imported = await import("mammoth");
  const mammoth = (imported as unknown as { default?: typeof imported }).default ?? imported;
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  const lines = result.value.split(/\r?\n/);

  const titulo = lines.find((line) => line.trim().length > 3)?.trim() ?? file.name;

  return textToDocModel({
    fileName: file.name,
    kind: "word",
    title: titulo,
    lines,
  });
}

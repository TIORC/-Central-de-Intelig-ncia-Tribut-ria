import { textToDocModel } from "./text";
import type { DocModel } from "./types";

const MIN_CHARS = 40;

/**
 * Extrai o texto de cada página do PDF no browser (sem backend).
 * PDF escaneado (imagem) não tem texto — nesse caso devolvemos um erro
 * amigável, explicando que o arquivo precisa de OCR.
 */
export async function parsePdf(file: File): Promise<DocModel> {
  const pdfjs = await import("pdfjs-dist");
  const worker = await import("pdfjs-dist/build/pdf.worker.min.mjs?url");

  pdfjs.GlobalWorkerOptions.workerSrc = worker.default as string;

  const data = new Uint8Array(await file.arrayBuffer());
  const document = await pdfjs.getDocument({ data }).promise;

  const lines: string[] = [];

  for (let pageNumber = 1; pageNumber <= Math.min(document.numPages, 60); pageNumber += 1) {
    const page = await document.getPage(pageNumber);
    const content = await page.getTextContent();
    const texto = content.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();

    if (texto) lines.push(`${texto}`);
  }

  const total = lines.join(" ").trim();
  if (total.length < MIN_CHARS) {
    throw new Error(
      "O PDF não possui texto selecionável (provavelmente é digitalizado). Converta para .docx ou envie um PDF com texto.",
    );
  }

  const metadata = await document.getMetadata();
  const info = metadata.info as { Title?: string } | undefined;
  const titulo = info?.Title?.trim() || file.name;

  return textToDocModel({ fileName: file.name, kind: "pdf", title: titulo, lines });
}

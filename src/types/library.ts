import type { Presentation } from "@/types/presentation";

// ---------------------------------------------------------------------------
// Tipos da biblioteca de apresentações (dados reais que substituem os mocks).
//
// A camada é versionada e passa por migrations na primeira leitura — o mesmo
// contrato será usado quando a persistência virar SQL no servidor (D1/Turso):
// basta trocar a implementação de `@/lib/library-store` por server functions,
// mantendo as assinaturas.
// ---------------------------------------------------------------------------

export type PresentationStatus = "Rascunho" | "Em revisão" | "Finalizada";

export const PRESENTATION_STATUSES: PresentationStatus[] = [
  "Rascunho",
  "Em revisão",
  "Finalizada",
];

export type LibraryItem = {
  id: string;
  name: string;
  /** Nome do cliente selecionado no cadastro. */
  client: string;
  /** Tipo da apresentação (Diagnóstico, Oportunidades, ...). */
  type: string;
  status: PresentationStatus;
  /** Data de referência no formato ISO (yyyy-mm-dd). */
  dateISO: string;
  createdAt: string;
  updatedAt: string;
  slideCount: number;
  /** Nome do arquivo que originou a apresentação (quando importada). */
  sourceFile?: string;
  description?: string;
  /** Conteúdo completo dos slides — usado pelo editor. */
  content: Presentation;
};

export type LibraryItemInput = {
  name: string;
  client: string;
  type: string;
  status: PresentationStatus;
  dateISO: string;
  presentation: Presentation;
  sourceFile?: string;
  description?: string;
};

export type LibrarySnapshot = {
  schemaVersion: number;
  items: LibraryItem[];
};

export function formatLibraryDate(dateISO: string): string {
  const [year, month, day] = dateISO.split("-");
  if (!year || !month || !day) return dateISO;
  return `${day}/${month}/${year}`;
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

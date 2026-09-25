import type { PlanejamentoData } from "./importers/planejamento";

// ---------------------------------------------------------------------------
// Gancho para a Fase 2 (IA cloud-free).
//
// O plano aprovado é usar um LLM gratuito (Google Gemini Flash / Groq) para
// reescrever títulos, agrupar conteúdo e destacar números ANTES de montar os
// slides. O layout continua 100% no builder → a identidade Lumina não muda.
//
// Fluxo da Fase 2:
//   1. o parser entrega o texto já extraído (PlanejamentoData / DocModel);
//   2. `generateSlidePlan()` chama a server function (chave só no servidor,
//      nunca no browser) e devolve o plano de slides validado com Zod;
//   3. `buildPlanejamentoPresentation()` / `buildGenericPresentation()` usam o
//      plano para preencher os textos.
//
// Enquanto a chave não estiver configurada, `isLlmEnabled()` é false e todo o
// pipeline segue 100% local (heurístico).
// ---------------------------------------------------------------------------

export type LlmProvider = "gemini" | "groq" | "openrouter" | "ollama" | "none";

export type LlmSlide = {
  tipo: "capa" | "conteudo" | "stats" | "plano" | "encerramento";
  titulo: string;
  subtitulo?: string;
  bullets?: string[];
  destaque?: string;
  /** De onde o conteúdo veio (aba/página) — usado para auditoria anti-alucinação. */
  fonte?: string;
};

export type LlmSlidePlan = {
  slides: LlmSlide[];
};

export const LLM_PROVIDER: LlmProvider = "none";

export function isLlmEnabled(): boolean {
  return LLM_PROVIDER !== "none";
}

export type LlmInput = {
  /** Texto estruturado já extraído do arquivo pelo parser local. */
  contexto: string;
  dados?: PlanejamentoData;
  nomeApresentacao: string;
};

export async function generateSlidePlan(_input: LlmInput): Promise<LlmSlidePlan | null> {
  if (!isLlmEnabled()) return null;
  throw new Error("Provedor de IA ainda não configurado (Fase 2).");
}

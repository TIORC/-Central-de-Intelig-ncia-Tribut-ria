export type { PresentationStatus } from "@/types/library";
export { PRESENTATION_STATUSES } from "@/types/library";

export type DocumentItem = {
  id: string;
  name: string;
  client: string;
  kind: string;
  date: string;
};

export type Template = {
  id: string;
  name: string;
  description: string;
  slides: number;
};

export const documents: DocumentItem[] = [
  {
    id: "1",
    name: "Balanço Patrimonial 2025",
    client: "Alpha Indústria",
    kind: "Planilha",
    date: "10/09/2026",
  },
  {
    id: "2",
    name: "Apuração de Créditos",
    client: "Norte Distribuidora",
    kind: "Planilha",
    date: "05/09/2026",
  },
  {
    id: "3",
    name: "Contrato Social",
    client: "Construtora Vértice",
    kind: "Documento",
    date: "29/08/2026",
  },
  {
    id: "4",
    name: "Relatório Fiscal Q2",
    client: "Grupo Meridiano",
    kind: "PDF",
    date: "18/08/2026",
  },
];

export const templates: Template[] = [
  {
    id: "1",
    name: "Diagnóstico Tributário",
    description: "Estrutura completa para análise de carga tributária.",
    slides: 14,
  },
  {
    id: "2",
    name: "Oportunidades de Crédito",
    description: "Foco em recuperação e aproveitamento de créditos.",
    slides: 10,
  },
  {
    id: "3",
    name: "Planejamento Fiscal",
    description: "Cenários comparativos e projeções de economia.",
    slides: 12,
  },
  {
    id: "4",
    name: "Institucional",
    description: "Apresentação da consultoria e metodologia.",
    slides: 8,
  },
];

export const presentationTypes = [
  "Diagnóstico",
  "Oportunidades",
  "Planejamento",
  "Financeiro",
  "Institucional",
];

export type { PresentationStatus } from "@/types/library";
export { PRESENTATION_STATUSES } from "@/types/library";

export type Client = {
  id: string;
  name: string;
  legalName: string;
  cnpj: string;
  segment: string;
  initials: string;
};

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

export const clients: Client[] = [
  {
    id: "1",
    name: "Alpha Indústria",
    legalName: "Alpha Indústria de Componentes S.A.",
    cnpj: "12.345.678/0001-90",
    segment: "Indústria",
    initials: "AI",
  },
  {
    id: "2",
    name: "Norte Distribuidora",
    legalName: "Norte Comércio e Distribuição Ltda.",
    cnpj: "98.765.432/0001-11",
    segment: "Atacado",
    initials: "ND",
  },
  {
    id: "3",
    name: "Construtora Vértice",
    legalName: "Vértice Engenharia e Construções Ltda.",
    cnpj: "45.221.908/0001-32",
    segment: "Construção civil",
    initials: "CV",
  },
  {
    id: "4",
    name: "Grupo Meridiano",
    legalName: "Meridiano Participações S.A.",
    cnpj: "31.556.774/0001-05",
    segment: "Holding",
    initials: "GM",
  },
  {
    id: "5",
    name: "Clínica Bem Viver",
    legalName: "Bem Viver Serviços Médicos Ltda.",
    cnpj: "22.114.556/0001-77",
    segment: "Saúde",
    initials: "BV",
  },
];

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

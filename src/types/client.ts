// ---------------------------------------------------------------------------
// Tipos e utilitários de formatação/validação da carteira de clientes.
//
// O registro persistido vive na tabela `public.clients` (Lovable Cloud /
// Supabase — ver supabase/migrations/*_create_clients_table.sql). Os utilitários
// de CNPJ e telefone são usados tanto pelo modal de inscrição quanto pela
// listagem, por isso ficam aqui e não dentro dos componentes.
// ---------------------------------------------------------------------------

import type { Database } from "@/integrations/supabase/types";

export type ClientRow = Database["public"]["Tables"]["clients"]["Row"];

/** Cliente no formato usado pelas telas (camelCase). */
export type Client = {
  id: string;
  /** Nome fantasia. */
  name: string;
  legalName: string;
  cnpj: string;
  segment: string;
  email: string | null;
  phoneDdd: string | null;
  phoneNumber: string | null;
  logoUrl: string | null;
  initials: string;
  createdAt: string;
  updatedAt: string;
};

export type NewClientInput = {
  name: string;
  legalName: string;
  cnpj: string;
  segment: string;
  email?: string;
  phoneDdd?: string;
  phoneNumber?: string;
  logoUrl?: string;
};

export const CLIENT_SEGMENTS = [
  "Indústria",
  "Atacado",
  "Varejo",
  "Construção civil",
  "Holding",
  "Saúde",
  "Serviços",
  "Tecnologia",
  "Agronegócio",
  "Logística",
  "Financeiro",
  "Outro",
] as const;

export type ClientSegment = (typeof CLIENT_SEGMENTS)[number];

export function onlyDigits(value: string): string {
  return value.replace(/\D/g, "");
}

/** Máscara progressiva 00.000.000/0000-00. */
export function formatCnpj(value: string): string {
  const digits = onlyDigits(value).slice(0, 14);
  const parts = [
    digits.slice(0, 2),
    digits.slice(2, 5),
    digits.slice(5, 8),
    digits.slice(8, 12),
    digits.slice(12, 14),
  ];

  let out = parts[0] ?? "";
  if ((parts[1] ?? "").length > 0) out += `.${parts[1]}`;
  if ((parts[2] ?? "").length > 0) out += `.${parts[2]}`;
  if ((parts[3] ?? "").length > 0) out += `/${parts[3]}`;
  if ((parts[4] ?? "").length > 0) out += `-${parts[4]}`;
  return out;
}

/** Validação oficial do CNPJ (dígitos verificadores). */
export function isValidCnpj(value: string): boolean {
  const digits = onlyDigits(value);
  if (digits.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(digits)) return false;

  const checkDigit = (length: number): number => {
    let sum = 0;
    let weight = length - 7;
    for (let i = 0; i < length; i += 1) {
      sum += Number(digits.charAt(i)) * weight;
      weight -= 1;
      if (weight < 2) weight = 9;
    }
    const rest = sum % 11;
    return rest < 2 ? 0 : 11 - rest;
  };

  return (
    checkDigit(12) === Number(digits.charAt(12)) && checkDigit(13) === Number(digits.charAt(13))
  );
}

/** Máscara progressiva (00) 00000-0000. */
export function formatPhone(ddd: string | null, number: string | null): string {
  const d = onlyDigits(ddd ?? "");
  const n = onlyDigits(number ?? "");
  if (!d && !n) return "";
  if (!n) return `(${d})`;
  const masked =
    n.length > 8 ? `${n.slice(0, 5)}-${n.slice(5, 9)}` : `${n.slice(0, 4)}-${n.slice(4, 8)}`;
  return `(${d}) ${masked}`;
}

/** Iniciais para o avatar quando o cliente não tem logo. */
export function clientInitials(name: string, legalName: string): string {
  const source = (name.trim() || legalName.trim()).replace(/[^\p{L}\p{N}\s]/gu, " ");
  const words = source.split(/\s+/).filter((word) => word.length > 2 || /^\p{Lu}/u.test(word));
  const chosen = (words.length > 0 ? words : source.split(/\s+/)).slice(0, 2);
  const initials = chosen.map((word) => word.charAt(0)).join("");
  return initials.toUpperCase().slice(0, 2) || "CL";
}

export function clientFromRow(row: ClientRow): Client {
  return {
    id: row.id,
    name: row.name,
    legalName: row.legal_name,
    cnpj: row.cnpj,
    segment: row.segment,
    email: row.email,
    phoneDdd: row.phone_ddd,
    phoneNumber: row.phone_number,
    logoUrl: row.logo_url,
    initials: row.initials,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

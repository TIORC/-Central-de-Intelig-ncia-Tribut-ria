import { z } from "zod";

import { isValidCnpj, onlyDigits, type Client } from "@/types/client";

// ---------------------------------------------------------------------------
// Schema e valores do formulário de cliente, compartilhados entre a inscrição
// (`NewClientDialog`) e a edição (`ClientFormDialog` em modo "edit") — as duas
// telas gravam as mesmas colunas de `public.clients` e aplicam as mesmas
// máscaras, então a validação mora aqui para não divergir.
// ---------------------------------------------------------------------------

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const clientFormSchema = z
  .object({
    name: z.string().trim().max(120, "Máximo de 120 caracteres."),
    legalName: z
      .string()
      .trim()
      .min(2, "Informe a razão social.")
      .max(180, "Máximo de 180 caracteres."),
    cnpj: z
      .string()
      .trim()
      .refine((value) => onlyDigits(value).length > 0, "Informe o CNPJ.")
      .refine(isValidCnpj, "Informe um CNPJ válido."),
    segment: z.string().trim().min(1, "Selecione o segmento."),
    email: z
      .string()
      .trim()
      .max(160, "Máximo de 160 caracteres.")
      .refine((value) => value === "" || EMAIL_REGEX.test(value), "Informe um e-mail válido."),
    phoneDdd: z
      .string()
      .trim()
      .refine((value) => value === "" || /^\d{2}$/.test(value), "Use 2 dígitos (DDD)."),
    phoneNumber: z
      .string()
      .trim()
      .refine(
        (value) => value === "" || /^\d{8,9}$/.test(value),
        "Informe 8 ou 9 dígitos do número.",
      ),
  })
  .superRefine((values, ctx) => {
    if (values.phoneDdd && !values.phoneNumber) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["phoneNumber"],
        message: "Informe o número do contato.",
      });
    }
    if (values.phoneNumber && !values.phoneDdd) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["phoneDdd"],
        message: "Informe o DDD do contato.",
      });
    }
  });

export type ClientFormValues = z.infer<typeof clientFormSchema>;

export const EMPTY_FORM: ClientFormValues = {
  name: "",
  legalName: "",
  cnpj: "",
  segment: "",
  email: "",
  phoneDdd: "",
  phoneNumber: "",
};

/** Dados do banco no formato dos campos do formulário (`null` vira string vazia). */
export function clientToFormValues(client: Client): ClientFormValues {
  return {
    name: client.name,
    legalName: client.legalName,
    cnpj: client.cnpj,
    segment: client.segment,
    email: client.email ?? "",
    phoneDdd: client.phoneDdd ?? "",
    phoneNumber: client.phoneNumber ?? "",
  };
}

import { supabase } from "@/integrations/supabase/client";
import {
  clientFromRow,
  clientInitials,
  formatCnpj,
  type Client,
  type NewClientInput,
} from "@/types/client";

// ---------------------------------------------------------------------------
// Repositório dos clientes da consultoria.
//
// Persistência: tabela `public.clients` no Lovable Cloud (Supabase) + bucket de
// storage `client-logos` para as logos. As funções abaixo são a única porta de
// entrada/saída usada pelas telas (`use-clients`), então trocar a origem dos
// dados no futuro não exige mexer em componente.
// ---------------------------------------------------------------------------

export const CLIENT_LOGO_BUCKET = "client-logos";
/** Limite do bucket — ver `file_size_limit` na migration da tabela. */
export const MAX_LOGO_BYTES = 2 * 1024 * 1024;

const LOGO_EXTENSIONS: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/webp": "webp",
  "image/svg+xml": "svg",
};

function emptyToNull(value: string | undefined): string | null {
  const trimmed = (value ?? "").trim();
  return trimmed === "" ? null : trimmed;
}

/** Converte os erros do Postgres/Storage em mensagens para a interface. */
function translateError(message: string): string {
  const normalized = message.toLowerCase();

  if (normalized.includes("clients_cnpj_digits_key") || normalized.includes("duplicate key")) {
    return "Já existe um cliente cadastrado com este CNPJ.";
  }
  if (normalized.includes("clients_cnpj_digits_check")) {
    return "O CNPJ precisa ter 14 dígitos.";
  }
  if (normalized.includes("does not exist") || normalized.includes("schema cache")) {
    return "A tabela de clientes ainda não existe no Lovable Cloud. Aplique a migration supabase/migrations/*_create_clients_table.sql.";
  }
  if (normalized.includes("bucket not found")) {
    return "O bucket de logos (client-logos) ainda não existe no Lovable Cloud. Aplique a migration da tabela de clientes.";
  }
  if (normalized.includes("mime type") || normalized.includes("invalid mime")) {
    return "Formato de imagem não aceito. Use PNG, JPG, WEBP ou SVG.";
  }
  if (normalized.includes("payload too large") || normalized.includes("maximum allowed size")) {
    return "A logo deve ter no máximo 2 MB.";
  }
  if (normalized.includes("failed to fetch") || normalized.includes("networkerror")) {
    return "Não foi possível falar com o Lovable Cloud. Verifique a conexão.";
  }

  return message;
}

function toError(error: { message: string }): Error {
  return new Error(translateError(error.message));
}

export async function listClients(): Promise<Client[]> {
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) throw toError(error);
  return (data ?? []).map(clientFromRow);
}

export async function getClient(id: string): Promise<Client | null> {
  const { data, error } = await supabase.from("clients").select("*").eq("id", id).maybeSingle();

  if (error) throw toError(error);
  return data ? clientFromRow(data) : null;
}

export async function createClientRecord(input: NewClientInput): Promise<Client> {
  const legalName = input.legalName.trim();
  const { data, error } = await supabase
    .from("clients")
    .insert({
      name: input.name.trim(),
      legal_name: legalName,
      cnpj: formatCnpj(input.cnpj),
      segment: input.segment.trim(),
      initials: clientInitials(input.name, legalName),
      email: emptyToNull(input.email),
      phone_ddd: emptyToNull(input.phoneDdd),
      phone_number: emptyToNull(input.phoneNumber),
      logo_url: emptyToNull(input.logoUrl),
    })
    .select()
    .single();

  if (error) throw toError(error);
  return clientFromRow(data);
}

/** Campos aceitos na edição. `logoUrl` explícito (aceita `null`) para permitir remover a logo. */
export type UpdateClientInput = NewClientInput & { logoUrl: string | null };

/**
 * Atualiza os dados de um cliente já cadastrado. O `initials` é recalculado a
 * partir do novo nome/razão social e o `updated_at` fica por conta do trigger
 * `clients_set_updated_at` do banco.
 */
export async function updateClientRecord(id: string, input: UpdateClientInput): Promise<Client> {
  const legalName = input.legalName.trim();
  const { data, error } = await supabase
    .from("clients")
    .update({
      name: input.name.trim(),
      legal_name: legalName,
      cnpj: formatCnpj(input.cnpj),
      segment: input.segment.trim(),
      initials: clientInitials(input.name, legalName),
      email: emptyToNull(input.email),
      phone_ddd: emptyToNull(input.phoneDdd),
      phone_number: emptyToNull(input.phoneNumber),
      logo_url: input.logoUrl,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw toError(error);
  return clientFromRow(data);
}

export async function deleteClientRecord(id: string): Promise<void> {
  const { error } = await supabase.from("clients").delete().eq("id", id);
  if (error) throw toError(error);
}

/**
 * Remove do bucket o arquivo apontado por uma URL pública do Storage
 * (`.../object/public/client-logos/<arquivo>`). Silencia URLs que não pertencem
 * ao bucket, para não derrubar a edição/exclusão por causa da limpeza.
 */
export async function removeClientLogo(logoUrl: string): Promise<void> {
  const marker = `${CLIENT_LOGO_BUCKET}/`;
  const separator = logoUrl.lastIndexOf(marker);
  if (separator < 0) return;

  const path = logoUrl.slice(separator + marker.length);
  if (path === "") return;

  const { error } = await supabase.storage.from(CLIENT_LOGO_BUCKET).remove([path]);
  if (error) throw toError(error);
}

/** Faz o upload da logo e devolve a URL pública (bucket `client-logos`). */
export async function uploadClientLogo(file: File): Promise<string> {
  const extension = LOGO_EXTENSIONS[file.type];
  if (!extension) {
    throw new Error("Formato de imagem não aceito. Use PNG, JPG, WEBP ou SVG.");
  }
  if (file.size > MAX_LOGO_BYTES) {
    throw new Error("A logo deve ter no máximo 2 MB.");
  }

  const path = `${crypto.randomUUID()}.${extension}`;
  const { error } = await supabase.storage
    .from(CLIENT_LOGO_BUCKET)
    .upload(path, file, { contentType: file.type, cacheControl: "3600", upsert: false });

  if (error) throw toError(error);

  const { data } = supabase.storage.from(CLIENT_LOGO_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

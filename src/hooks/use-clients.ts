import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createClientRecord,
  deleteClientRecord,
  listClients,
  removeClientLogo,
  updateClientRecord,
  uploadClientLogo,
} from "@/lib/client-store";
import type { Client, NewClientInput } from "@/types/client";

export const CLIENTS_QUERY_KEY = ["clients"] as const;

/** Lista reativa da carteira de clientes (Lovable Cloud). */
export function useClients() {
  return useQuery({
    queryKey: CLIENTS_QUERY_KEY,
    queryFn: listClients,
    staleTime: 30_000,
  });
}

export type CreateClientVariables = NewClientInput & { logoFile?: File | null };

/**
 * Inscreve um novo cliente: sobe a logo (quando houver) e grava a linha na
 * tabela `clients`. O cache é atualizado na hora para a listagem refletir o
 * cadastro sem precisar recarregar a página.
 */
export function useCreateClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ logoFile, ...input }: CreateClientVariables): Promise<Client> => {
      const logoUrl = logoFile ? await uploadClientLogo(logoFile) : input.logoUrl;
      return createClientRecord({ ...input, ...(logoUrl ? { logoUrl } : {}) });
    },
    onSuccess: (client) => {
      queryClient.setQueryData<Client[]>(CLIENTS_QUERY_KEY, (current) => [
        ...(current ?? []),
        client,
      ]);
      void queryClient.invalidateQueries({ queryKey: CLIENTS_QUERY_KEY });
    },
  });
}

export type UpdateClientVariables = NewClientInput & {
  id: string;
  /** URL da logo que está no banco, para apagar quando for trocada ou removida. */
  previousLogoUrl?: string | null;
  /** Marca a logo atual para remoção (sem enviar arquivo novo). */
  removeLogo?: boolean;
  logoFile?: File | null;
};

/**
 * Edita um cliente existente: sobe a logo nova (quando houver), grava a linha e
 * descarta do bucket a logo substituída. O cache é substituído pela versão
 * devolvida pelo banco, então a listagem reflete o CNPJ/segmento novo na hora.
 */
export function useUpdateClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      previousLogoUrl,
      removeLogo,
      logoFile,
      ...input
    }: UpdateClientVariables): Promise<Client> => {
      const uploadedLogoUrl = logoFile ? await uploadClientLogo(logoFile) : null;
      const logoUrl = removeLogo ? null : (uploadedLogoUrl ?? input.logoUrl ?? null);

      const updated = await updateClientRecord(id, { ...input, logoUrl });

      if (previousLogoUrl && previousLogoUrl !== logoUrl) {
        await removeClientLogo(previousLogoUrl).catch(() => undefined);
      }

      return updated;
    },
    onSuccess: (client) => {
      queryClient.setQueryData<Client[]>(CLIENTS_QUERY_KEY, (current) =>
        (current ?? []).map((item) => (item.id === client.id ? client : item)),
      );
      void queryClient.invalidateQueries({ queryKey: CLIENTS_QUERY_KEY });
    },
  });
}

export type DeleteClientVariables = { id: string; logoUrl?: string | null };

/**
 * Exclui o cliente e limpa a logo do bucket. A limpeza do storage é
 * best-effort: se falhar, o registro já foi removido e a exclusão vale.
 */
export function useDeleteClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, logoUrl }: DeleteClientVariables): Promise<void> => {
      await deleteClientRecord(id);
      if (logoUrl) {
        await removeClientLogo(logoUrl).catch(() => undefined);
      }
    },
    onSuccess: (_data, { id }) => {
      queryClient.setQueryData<Client[]>(CLIENTS_QUERY_KEY, (current) =>
        (current ?? []).filter((item) => item.id !== id),
      );
      void queryClient.invalidateQueries({ queryKey: CLIENTS_QUERY_KEY });
    },
  });
}

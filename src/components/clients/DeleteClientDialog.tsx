import { Loader2, TriangleAlert } from "lucide-react";
import { useEffect } from "react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { buttonVariants } from "@/components/ui/button";
import { useDeleteClient } from "@/hooks/use-clients";
import { cn } from "@/lib/utils";
import type { Client } from "@/types/client";

// ---------------------------------------------------------------------------
// Confirmação de exclusão de cliente (botão de lixeira em /clientes).
// A remoção da linha é definitiva, então o AlertDialog mostra razão social e
// CNPJ antes de chamar a mutation.
// ---------------------------------------------------------------------------

export function DeleteClientDialog({
  open,
  onOpenChange,
  client,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: Client | null;
}) {
  const deleteClient = useDeleteClient();

  // Evita arrastar o `isPending` da exclusão anterior para a próxima abertura.
  useEffect(() => {
    if (open) deleteClient.reset();
  }, [open, deleteClient]);

  if (!client) return null;

  const handleConfirm = () => {
    const toastId = `delete-client-${client.id}`;
    toast.loading("Excluindo cliente…", {
      id: toastId,
      description: client.legalName,
    });

    deleteClient
      .mutateAsync({ id: client.id, logoUrl: client.logoUrl })
      .then(() => {
        toast.success("Cliente excluído", {
          id: toastId,
          description: `${client.legalName} saiu da carteira de clientes.`,
        });
        onOpenChange(false);
      })
      .catch((error: unknown) => {
        const message =
          error instanceof Error ? error.message : "Não foi possível excluir o cliente.";
        toast.error("Falha ao excluir cliente", { id: toastId, description: message });
      });
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <TriangleAlert className="size-5 text-destructive" />
            Excluir cliente?
          </AlertDialogTitle>
          <AlertDialogDescription>
            <p>
              A ficha de <span className="font-medium text-foreground">{client.legalName}</span> (
              {client.cnpj}) será removida em definitivo, junto com a logo armazenada. Esta ação não
              pode ser desfeita.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteClient.isPending}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={(event) => {
              event.preventDefault();
              handleConfirm();
            }}
            disabled={deleteClient.isPending}
            className={cn(buttonVariants({ variant: "destructive" }))}
          >
            {deleteClient.isPending && <Loader2 className="size-4 animate-spin" />}
            {deleteClient.isPending ? "Excluindo…" : "Excluir cliente"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

import { ClientFormDialog } from "@/components/clients/ClientFormDialog";

// ---------------------------------------------------------------------------
// Inscrição de novos clientes (botão "+ Novo cliente" em /clientes).
// Casca fina sobre o `ClientFormDialog` em modo "create" — a edição usa o mesmo
// formulário, então regras de validação e upload de logo vivem em um lugar só.
// ---------------------------------------------------------------------------

export function NewClientDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return <ClientFormDialog open={open} onOpenChange={onOpenChange} mode="create" />;
}

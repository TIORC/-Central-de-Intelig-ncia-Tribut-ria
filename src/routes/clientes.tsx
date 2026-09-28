import { createFileRoute } from "@tanstack/react-router";
import { AlertCircle, Pencil, Plus, Trash2, Users } from "lucide-react";
import { useState } from "react";

import { ClientFormDialog } from "@/components/clients/ClientFormDialog";
import { ClientLogo } from "@/components/clients/ClientLogo";
import { DeleteClientDialog } from "@/components/clients/DeleteClientDialog";
import { NewClientDialog } from "@/components/clients/NewClientDialog";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useClients } from "@/hooks/use-clients";
import { formatPhone, type Client } from "@/types/client";

export const Route = createFileRoute("/clientes")({
  head: () => ({
    meta: [
      { title: "Clientes — Central de Planejamento Tributário" },
      {
        name: "description",
        content: "Carteira de clientes com razão social, CNPJ e segmento de atuação.",
      },
      { property: "og:title", content: "Clientes — Central de Planejamento Tributário" },
      {
        property: "og:description",
        content: "Carteira de clientes com razão social, CNPJ e segmento.",
      },
    ],
  }),
  component: Clients,
});

function Clients() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [deletingClient, setDeletingClient] = useState<Client | null>(null);
  const { data: clients = [], isLoading, isError, error, refetch } = useClients();

  return (
    <AppLayout>
      <PageHeader
        title="Clientes"
        description="Cadastro das empresas atendidas pela consultoria."
        action={
          <Button size="lg" onClick={() => setDialogOpen(true)}>
            <Plus className="size-4" />
            Novo cliente
          </Button>
        }
      />

      {isError && (
        <Alert variant="destructive" className="mb-5">
          <AlertCircle className="size-4" />
          <AlertTitle>Não foi possível carregar a carteira</AlertTitle>
          <AlertDescription>
            <p>
              {error instanceof Error
                ? error.message
                : "Erro inesperado ao consultar o Lovable Cloud."}
            </p>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => void refetch()}>
              Tentar novamente
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <div className="surface-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/60">
              <TableHead className="w-[76px]">Logo</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Razão Social</TableHead>
              <TableHead>CNPJ</TableHead>
              <TableHead>Segmento</TableHead>
              <TableHead>E-mail</TableHead>
              <TableHead>Contato</TableHead>
              <TableHead className="w-[92px] text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading &&
              Array.from({ length: 3 }).map((_, index) => (
                <TableRow key={`skeleton-${index}`}>
                  {Array.from({ length: 8 }).map((__, cell) => (
                    <TableCell key={`skeleton-${index}-${cell}`}>
                      <span className="block h-4 w-full max-w-[120px] animate-pulse rounded bg-muted" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}

            {!isLoading && clients.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="py-12">
                  <div className="flex flex-col items-center gap-2 text-center">
                    <span className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
                      <Users className="size-5" />
                    </span>
                    <p className="text-sm font-medium">Nenhum cliente cadastrado</p>
                    <p className="text-xs text-muted-foreground">
                      Use o botão “Novo cliente” para inscrever a primeira empresa.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )}

            {clients.map((client) => (
              <TableRow key={client.id}>
                <TableCell>
                  <ClientLogo
                    logoUrl={client.logoUrl}
                    initials={client.initials}
                    name={client.legalName}
                  />
                </TableCell>
                <TableCell className="font-medium">{client.name || "—"}</TableCell>
                <TableCell className="text-muted-foreground">{client.legalName}</TableCell>
                <TableCell className="text-muted-foreground">{client.cnpj}</TableCell>
                <TableCell className="text-muted-foreground">{client.segment}</TableCell>
                <TableCell className="text-muted-foreground">{client.email ?? "—"}</TableCell>
                <TableCell className="text-muted-foreground">
                  {formatPhone(client.phoneDdd, client.phoneNumber) || "—"}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 text-muted-foreground hover:text-foreground"
                      title="Editar cliente"
                      aria-label={`Editar ${client.legalName}`}
                      onClick={() => setEditingClient(client)}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 text-muted-foreground hover:text-destructive"
                      title="Excluir cliente"
                      aria-label={`Excluir ${client.legalName}`}
                      onClick={() => setDeletingClient(client)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <NewClientDialog open={dialogOpen} onOpenChange={setDialogOpen} />
      <ClientFormDialog
        open={editingClient !== null}
        onOpenChange={(next) => {
          if (!next) setEditingClient(null);
        }}
        mode="edit"
        client={editingClient}
      />
      <DeleteClientDialog
        open={deletingClient !== null}
        onOpenChange={(next) => {
          if (!next) setDeletingClient(null);
        }}
        client={deletingClient}
      />
    </AppLayout>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";

import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { clients } from "@/data/mock";

export const Route = createFileRoute("/clientes")({
  head: () => ({
    meta: [
      { title: "Clientes — Central de Inteligência Tributária" },
      {
        name: "description",
        content: "Carteira de clientes com razão social, CNPJ e segmento de atuação.",
      },
      { property: "og:title", content: "Clientes — Central de Inteligência Tributária" },
      {
        property: "og:description",
        content: "Carteira de clientes com razão social, CNPJ e segmento.",
      },
    ],
  }),
  component: Clients,
});

function Clients() {
  return (
    <AppLayout>
      <PageHeader
        title="Clientes"
        description="Cadastro das empresas atendidas pela consultoria."
        action={
          <Button size="lg">
            <Plus className="size-4" />
            Novo cliente
          </Button>
        }
      />

      <div className="surface-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/60">
              <TableHead className="w-[76px]">Logo</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Razão Social</TableHead>
              <TableHead>CNPJ</TableHead>
              <TableHead>Segmento</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clients.map((c) => (
              <TableRow key={c.id}>
                <TableCell>
                  <span className="flex size-10 items-center justify-center rounded-md bg-primary text-xs font-semibold text-primary-foreground">
                    {c.initials}
                  </span>
                </TableCell>
                <TableCell className="font-medium">{c.name}</TableCell>
                <TableCell className="text-muted-foreground">{c.legalName}</TableCell>
                <TableCell className="text-muted-foreground">{c.cnpj}</TableCell>
                <TableCell className="text-muted-foreground">{c.segment}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </AppLayout>
  );
}

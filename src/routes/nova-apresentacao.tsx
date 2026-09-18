import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { clients, presentationTypes } from "@/data/mock";

export const Route = createFileRoute("/nova-apresentacao")({
  head: () => ({
    meta: [
      { title: "Nova apresentação — Central de Inteligência Tributária" },
      {
        name: "description",
        content: "Cadastre os dados iniciais de uma nova apresentação para o cliente.",
      },
      { property: "og:title", content: "Nova apresentação — Central de Inteligência Tributária" },
      {
        property: "og:description",
        content: "Cadastre os dados iniciais de uma nova apresentação.",
      },
    ],
  }),
  component: NewPresentation,
});

function NewPresentation() {
  const [name, setName] = useState("");

  return (
    <AppLayout>
      <PageHeader
        title="Nova apresentação"
        description="Defina as informações básicas. A montagem dos slides acontece no editor."
      />

      <form
        onSubmit={(e) => {
          e.preventDefault();
          toast.success("Apresentação criada", {
            description: name || "Rascunho salvo na lista de apresentações.",
          });
        }}
        className="surface-card max-w-3xl p-6 md:p-8"
      >
        <div className="grid gap-5 md:grid-cols-2">
          <div className="md:col-span-2">
            <Label htmlFor="nome">Nome da apresentação</Label>
            <Input
              id="nome"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex.: Diagnóstico Tributário 2026"
              className="mt-2"
            />
          </div>

          <div>
            <Label htmlFor="cliente">Cliente</Label>
            <Select>
              <SelectTrigger id="cliente" className="mt-2 w-full">
                <SelectValue placeholder="Selecione o cliente" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="tipo">Tipo da apresentação</Label>
            <Select>
              <SelectTrigger id="tipo" className="mt-2 w-full">
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                {presentationTypes.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="data">Data</Label>
            <Input id="data" type="date" className="mt-2" />
          </div>

          <div className="md:col-span-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              rows={5}
              placeholder="Objetivo da apresentação, escopo e observações internas."
              className="mt-2"
            />
          </div>
        </div>

        <div className="mt-7 flex flex-wrap gap-3 border-t border-border pt-6">
          <Button type="submit" size="lg">
            Criar apresentação
          </Button>
          <Button type="reset" variant="outline" size="lg">
            Limpar
          </Button>
        </div>
      </form>
    </AppLayout>
  );
}

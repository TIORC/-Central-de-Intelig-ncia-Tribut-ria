import { createFileRoute } from "@tanstack/react-router";

import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";

export const Route = createFileRoute("/configuracoes")({
  head: () => ({
    meta: [
      { title: "Configurações — Central de Inteligência Tributária" },
      {
        name: "description",
        content: "Dados da consultoria, identidade visual padrão e preferências do sistema.",
      },
      { property: "og:title", content: "Configurações — Central de Inteligência Tributária" },
      {
        property: "og:description",
        content: "Dados da consultoria e preferências do sistema.",
      },
    ],
  }),
  component: Settings,
});

function Settings() {
  return (
    <AppLayout>
      <PageHeader title="Configurações" description="Preferências gerais da plataforma." />

      <div className="surface-card max-w-3xl p-6 md:p-8">
        <h3 className="font-display text-base font-semibold">Dados da consultoria</h3>
        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <div>
            <Label htmlFor="empresa">Nome</Label>
            <Input id="empresa" defaultValue="Central de Inteligência Tributária" className="mt-2" />
          </div>
          <div>
            <Label htmlFor="email">E-mail de contato</Label>
            <Input id="email" type="email" placeholder="contato@empresa.com.br" className="mt-2" />
          </div>
        </div>

        <Separator className="my-7" />

        <h3 className="font-display text-base font-semibold">Preferências</h3>
        <div className="mt-4 space-y-4">
          {[
            { id: "rodape", label: "Exibir rodapé institucional nos slides" },
            { id: "numeracao", label: "Numerar slides automaticamente" },
            { id: "revisao", label: "Solicitar revisão antes de finalizar" },
          ].map((item) => (
            <div key={item.id} className="flex items-center justify-between gap-4">
              <Label htmlFor={item.id} className="text-sm font-normal">
                {item.label}
              </Label>
              <Switch id={item.id} defaultChecked={item.id !== "revisao"} />
            </div>
          ))}
        </div>

        <div className="mt-8 border-t border-border pt-6">
          <Button size="lg">Salvar alterações</Button>
        </div>
      </div>
    </AppLayout>
  );
}

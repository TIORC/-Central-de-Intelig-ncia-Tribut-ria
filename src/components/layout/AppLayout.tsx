import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  PlusCircle,
  Presentation,
  Users,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
  Bell,
  LogOut,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Dashboard", to: "/", icon: LayoutDashboard },
  { label: "Nova apresentação", to: "/nova-apresentacao", icon: PlusCircle },
  { label: "Apresentações", to: "/apresentacoes", icon: Presentation },
  { label: "Clientes", to: "/clientes", icon: Users },
  { label: "Configurações", to: "/configuracoes", icon: Settings },
] as const;

export function AppLayout({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Não foi possível sair da conta.");
      return;
    }
    await navigate({ to: "/login", replace: true });
  };

  return (
    <div className="flex min-h-screen w-full bg-muted/40">
      <aside
        className={cn(
          "sticky top-0 hidden h-screen shrink-0 flex-col bg-sidebar text-sidebar-foreground transition-[width] duration-200 md:flex",
          collapsed ? "w-[76px]" : "w-[264px]",
        )}
      >
        <div className="flex h-16 items-center gap-3 px-5">
          <img
            src="/center.png"
            alt="Central de Planejamento Tributário"
            className="size-9 shrink-0 rounded-md bg-white object-contain"
          />
          {!collapsed && (
            <span className="font-display text-sm leading-tight font-semibold">
              Central de
              <br />
              Planejamento Tributário
            </span>
          )}
        </div>

        <nav className="mt-4 flex flex-1 flex-col gap-1 px-3">
          {navItems.map((item) => {
            const active = pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                title={item.label}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors",
                  active
                    ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
                )}
              >
                <item.icon className="size-[18px] shrink-0" />
                {!collapsed && <span className="truncate">{item.label}</span>}
                {active && !collapsed && (
                  <span className="ml-auto h-4 w-1 rounded-full bg-accent" />
                )}
              </Link>
            );
          })}
        </nav>

        <button
          onClick={() => setCollapsed((v) => !v)}
          className="m-3 flex items-center gap-3 rounded-md px-3 py-2.5 text-sm text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
        >
          {collapsed ? (
            <PanelLeftOpen className="size-[18px]" />
          ) : (
            <>
              <PanelLeftClose className="size-[18px]" />
              <span>Recolher menu</span>
            </>
          )}
        </button>
        <button
          type="button"
          onClick={handleSignOut}
          title="Sair"
          className="m-3 mt-0 flex items-center gap-3 rounded-md border border-red-500/25 bg-red-600 px-3 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-700"
        >
          <LogOut className="size-[18px] shrink-0" />
          {!collapsed && <span>Sair</span>}
        </button>
      </aside>

      <button
        type="button"
        onClick={handleSignOut}
        className="fixed bottom-4 left-4 z-30 inline-flex items-center gap-2 rounded-md bg-red-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg hover:bg-red-700 md:hidden"
      >
        <LogOut className="size-4" />
        Sair
      </button>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b border-border bg-background/90 px-5 backdrop-blur md:px-8">
          <h1 className="font-display text-base font-semibold tracking-tight md:text-lg">
            Central de Planejamento Tributário
          </h1>
          <div className="ml-auto flex items-center gap-3">
            <button className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
              <Bell className="size-[18px]" />
            </button>
            <div className="flex items-center gap-3 border-l border-border pl-3">
              <span className="hidden text-sm leading-tight sm:block">
                <span className="block font-medium">Equipe Tributária</span>
                <span className="block text-xs text-muted-foreground">Consultoria</span>
              </span>
              <span className="flex size-9 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                ET
              </span>
            </div>
          </div>
        </header>

        <main className="flex-1 bg-background px-5 py-7 md:px-8 md:py-9">{children}</main>
      </div>
    </div>
  );
}

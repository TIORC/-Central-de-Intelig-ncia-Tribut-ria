import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  PlusCircle,
  Presentation,
  Users,
  FolderOpen,
  LayoutTemplate,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
  Bell,
} from "lucide-react";
import { useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

const navItems = [
  { label: "Dashboard", to: "/", icon: LayoutDashboard },
  { label: "Nova apresentação", to: "/nova-apresentacao", icon: PlusCircle },
  { label: "Apresentações", to: "/apresentacoes", icon: Presentation },
  { label: "Clientes", to: "/clientes", icon: Users },
  { label: "Documentos", to: "/documentos", icon: FolderOpen },
  { label: "Templates", to: "/templates", icon: LayoutTemplate },
  { label: "Configurações", to: "/configuracoes", icon: Settings },
] as const;

export function AppLayout({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="flex min-h-screen w-full bg-muted/40">
      <aside
        className={cn(
          "sticky top-0 hidden h-screen shrink-0 flex-col bg-sidebar text-sidebar-foreground transition-[width] duration-200 md:flex",
          collapsed ? "w-[76px]" : "w-[264px]",
        )}
      >
        <div className="flex h-16 items-center gap-3 px-5">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-accent font-display text-sm font-semibold text-accent-foreground">
            CIT
          </span>
          {!collapsed && (
            <span className="font-display text-sm leading-tight font-semibold">
              Central de
              <br />
              Inteligência Tributária
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
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b border-border bg-background/90 px-5 backdrop-blur md:px-8">
          <h1 className="font-display text-base font-semibold tracking-tight md:text-lg">
            Central de Inteligência Tributária
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

const brlFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const numberFormatter = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 });

export function brl(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return "—";
  return brlFormatter.format(value);
}

export function compactBrl(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return "—";
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `R$ ${numberFormatter.format(value / 1_000_000)} mi`;
  if (abs >= 1_000) return `R$ ${numberFormatter.format(value / 1_000)} mil`;
  return brl(value);
}

export function percent(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return "—";
  return `${numberFormatter.format(value * 100)}%`;
}

export function shortLabel(label: string, max = 26): string {
  const clean = label.replace(/[:.]+$/, "").trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max - 1).trimEnd()}…`;
}

export function joinMonths(periodos: string[], valores: number[], formatter = brl): string {
  return periodos
    .map((periodo, index) => {
      const valor = valores[index];
      if (valor === undefined || valor === null) return null;
      return `${periodo} ${formatter(valor)}`;
    })
    .filter((linha): linha is string => Boolean(linha))
    .join("  ·  ");
}

export function periodRange(periodos: string[]): string {
  const primeiro = periodos[0];
  const ultimo = periodos[periodos.length - 1];
  if (!primeiro || !ultimo) return "período não identificado";
  if (periodos.length === 1) return primeiro;
  return `${primeiro} a ${ultimo} (${periodos.length} competências)`;
}

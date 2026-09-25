import { uid } from "@/data/slide-templates";
import type { LibraryItem, LibraryItemInput, LibrarySnapshot, PresentationStatus } from "@/types/library";
import { todayISO } from "@/types/library";
import type { Presentation } from "@/types/presentation";

// ---------------------------------------------------------------------------
// Biblioteca de apresentações — persistência local versionada.
//
// Cada mudança de formato entra como uma migration numerada em `MIGRATIONS`.
// As migrations rodam automaticamente na primeira leitura do app (não precisa
// rodar comando manual, o que importa porque o deploy é intermediado pelo
// Lovable). O mesmo contrato (list/get/create/update/delete) será reimplementado
// com SQL no servidor na Fase 2, sem mexer nas telas.
// ---------------------------------------------------------------------------

export const LIBRARY_STORAGE_KEY = "lumina-library-v1";
/** Chave da versão 0: guardava uma única apresentação. */
export const LEGACY_PRESENTATION_KEY = "lumina-presentation-v1";
export const CURRENT_SCHEMA_VERSION = 1;

/** Id fixo do item criado ao migrar a apresentação única da versão 0. */
const LEGACY_ITEM_ID = "apresentacao-importada-v0";

type MigrationState = { version: number; items: LibraryItem[] };

type Migration = {
  to: number;
  description: string;
  run: (state: MigrationState) => MigrationState;
};

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function readJSON<T>(key: string): T | null {
  if (!canUseStorage()) return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function writeJSON(key: string, value: unknown): boolean {
  if (!canUseStorage()) return false;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

function isPresentation(value: unknown): value is Presentation {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Presentation;
  return typeof candidate.id === "string" && Array.isArray(candidate.slides);
}

function isLibraryItem(value: unknown): value is LibraryItem {
  if (!value || typeof value !== "object") return false;
  const candidate = value as LibraryItem;
  return (
    typeof candidate.id === "string" &&
    typeof candidate.name === "string" &&
    isPresentation(candidate.content)
  );
}

function legacyPresentation(): Presentation | null {
  const legacy = readJSON<Presentation>(LEGACY_PRESENTATION_KEY);
  return isPresentation(legacy) ? legacy : null;
}

function itemFromPresentation(
  presentation: Presentation,
  meta: {
    id?: string;
    client: string;
    type: string;
    status: PresentationStatus;
    dateISO: string;
    sourceFile?: string;
    description?: string;
  },
): LibraryItem {
  const now = new Date().toISOString();
  return {
    id: meta.id ?? uid("pres"),
    name: presentation.name || "Apresentação sem nome",
    client: meta.client,
    type: meta.type,
    status: meta.status,
    dateISO: meta.dateISO,
    createdAt: now,
    updatedAt: now,
    slideCount: presentation.slides.length,
    content: presentation,
    ...(meta.sourceFile ? { sourceFile: meta.sourceFile } : {}),
    ...(meta.description ? { description: meta.description } : {}),
  };
}

/**
 * Migrations numeradas. Para evoluir o formato:
 *   1. incremente `CURRENT_SCHEMA_VERSION`;
 *   2. adicione um item aqui com `to` igual à nova versão.
 * A migration roda sozinha na primeira leitura do app.
 */
export const MIGRATIONS: Migration[] = [
  {
    to: 1,
    description:
      "Cria a biblioteca de apresentações a partir da apresentação única salva na versão 0.",
    run: (state) => {
      const jaImportado = state.items.some((item) => item.id === LEGACY_ITEM_ID);
      const legacy = legacyPresentation();

      if (jaImportado || !legacy || state.items.length > 0) {
        return { version: 1, items: state.items };
      }

      return {
        version: 1,
        items: [
          itemFromPresentation(legacy, {
            id: LEGACY_ITEM_ID,
            client: "Não informado",
            type: "Planejamento",
            status: "Rascunho",
            dateISO: todayISO(),
            sourceFile: "Apresentação anterior à biblioteca",
          }),
        ],
      };
    },
  },
];

type RawJson = { schemaVersion?: unknown; items?: unknown };

function loadRawState(): MigrationState {
  const stored = readJSON<RawJson>(LIBRARY_STORAGE_KEY);
  const version = typeof stored?.schemaVersion === "number" ? stored.schemaVersion : 0;
  const items = Array.isArray(stored?.items) ? stored.items.filter(isLibraryItem) : [];
  return { version, items };
}

function applyMigrations(state: MigrationState): { state: MigrationState; applied: string[] } {
  const pendentes = MIGRATIONS.filter((migration) => migration.to > state.version).sort(
    (a, b) => a.to - b.to,
  );

  let current = state;
  const applied: string[] = [];

  for (const migration of pendentes) {
    const next = migration.run(current);
    current = { version: migration.to, items: next.items };
    applied.push(`v${migration.to} · ${migration.description}`);
  }

  return { state: current, applied };
}

let snapshot: LibraryItem[] = [];
let snapshotReady = false;
const listeners = new Set<() => void>();

function sortItems(items: LibraryItem[]): LibraryItem[] {
  return [...items].sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : a.updatedAt > b.updatedAt ? -1 : 0));
}

function persist(items: LibraryItem[]): void {
  snapshot = sortItems(items);
  snapshotReady = true;
  writeJSON(LIBRARY_STORAGE_KEY, { schemaVersion: CURRENT_SCHEMA_VERSION, items: snapshot });
  listeners.forEach((listener) => listener());
}

function loadOnce(): void {
  if (snapshotReady) return;
  snapshotReady = true;

  if (!canUseStorage()) {
    snapshot = [];
    return;
  }

  const { state, applied } = applyMigrations(loadRawState());
  snapshot = sortItems(state.items);

  if (applied.length > 0) {
    console.info("[Lumina] migrations da biblioteca aplicadas:", applied);
    writeJSON(LIBRARY_STORAGE_KEY, { schemaVersion: CURRENT_SCHEMA_VERSION, items: snapshot });
  }
}

/** Executa as migrations pendentes e devolve o que foi aplicado. */
export function runLibraryMigrations(): { from: number; to: number; applied: string[] } {
  const raw = loadRawState();
  const { state, applied } = applyMigrations(raw);
  if (applied.length > 0 && canUseStorage()) {
    writeJSON(LIBRARY_STORAGE_KEY, {
      schemaVersion: CURRENT_SCHEMA_VERSION,
      items: sortItems(state.items),
    });
    snapshot = sortItems(state.items);
    snapshotReady = true;
  }
  return { from: raw.version, to: state.version, applied };
}

export function getLibrarySnapshot(): LibraryItem[] {
  loadOnce();
  return snapshot;
}

export function getSchemaVersion(): number {
  return CURRENT_SCHEMA_VERSION;
}

export function subscribeLibrary(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

// ---------------------------------------------------------------------------
// CRUD — assinaturas equivalentes às futuras server functions (Fase 2 / SQL).
// ---------------------------------------------------------------------------

export function listLibraryItems(): LibraryItem[] {
  return getLibrarySnapshot();
}

export function getLibraryItem(id: string): LibraryItem | null {
  return getLibrarySnapshot().find((item) => item.id === id) ?? null;
}

export function createLibraryItem(input: LibraryItemInput): LibraryItem {
  const base = itemFromPresentation(input.presentation, {
    client: input.client || "Não informado",
    type: input.type || "Planejamento",
    status: input.status,
    dateISO: input.dateISO,
    ...(input.sourceFile ? { sourceFile: input.sourceFile } : {}),
    ...(input.description ? { description: input.description } : {}),
  });

  const item: LibraryItem = { ...base, name: input.name.trim() || base.name };
  persist([item, ...getLibrarySnapshot()]);
  return item;
}

type LibraryPatch = Partial<Omit<LibraryItem, "id" | "createdAt">>;

export function updateLibraryItem(id: string, patch: LibraryPatch): LibraryItem | null {
  const items = getLibrarySnapshot();
  const existing = items.find((item) => item.id === id);
  if (!existing) return null;

  const updated: LibraryItem = { ...existing, ...patch, id, updatedAt: new Date().toISOString() };
  persist(items.map((item) => (item.id === id ? updated : item)));
  return updated;
}

/** Atualiza o conteúdo dos slides mantendo metadados em sincronia (usado pelo editor). */
export function savePresentationContent(id: string, presentation: Presentation): LibraryItem | null {
  return updateLibraryItem(id, {
    content: presentation,
    name: presentation.name,
    slideCount: presentation.slides.length,
  });
}

export function deleteLibraryItem(id: string): void {
  persist(getLibrarySnapshot().filter((item) => item.id !== id));
}

export function clearLibrary(): void {
  persist([]);
}

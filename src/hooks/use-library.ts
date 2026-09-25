import { useSyncExternalStore } from "react";

import { getLibraryItem, getLibrarySnapshot, subscribeLibrary } from "@/lib/library-store";
import type { LibraryItem } from "@/types/library";

const EMPTY: LibraryItem[] = [];

/** Lista reativa das apresentações salvas (ordem: atualizadas recentemente primeiro). */
export function useLibrary(): LibraryItem[] {
  return useSyncExternalStore(subscribeLibrary, getLibrarySnapshot, () => EMPTY);
}

export function useLibraryItem(id: string | undefined): LibraryItem | null {
  const items = useLibrary();
  if (!id) return null;
  return items.find((item) => item.id === id) ?? getLibraryItem(id) ?? null;
}

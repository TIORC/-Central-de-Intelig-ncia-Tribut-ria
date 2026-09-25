import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { blankSlide, samplePresentation, uid } from "@/data/slide-templates";
import { getLibraryItem, savePresentationContent } from "@/lib/library-store";
import type {
  EditTarget,
  Presentation,
  Slide,
  SlideBackground,
  SlideElement,
} from "@/types/presentation";

export const STORAGE_KEY = "lumina-presentation-v1";
const MAX_HISTORY = 100;

/** Grava a apresentação no armazenamento local (usado pelo fluxo de importação). */
export function writePresentation(presentation: Presentation): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(presentation));
  } catch {
    // storage cheio ou indisponível — segue sem persistência
  }
}


export type EditorApi = {
  presentation: Presentation;
  currentIndex: number;
  currentSlide: Slide;
  selectedElementId: string | null;
  editing: EditTarget | null;
  canUndo: boolean;
  canRedo: boolean;
  savedAt: number | null;

  selectSlide: (index: number) => void;
  renamePresentation: (name: string) => void;
  /** Substitui a apresentação atual (usado pela importação de arquivos). */
  replacePresentation: (presentation: Presentation) => void;
  addSlide: () => void;
  duplicateSlide: (index: number) => void;
  deleteSlide: (index: number) => void;
  moveSlide: (from: number, to: number) => void;
  renameSlide: (index: number, name: string) => void;
  setSlideBackground: (index: number, background: SlideBackground) => void;

  selectElement: (id: string | null) => void;
  addElement: (element: SlideElement) => void;
  updateElement: (elementId: string, patch: Partial<SlideElement>, record?: boolean) => void;
  deleteElement: (elementId: string) => void;
  bringForward: (elementId: string) => void;
  sendBackward: (elementId: string) => void;

  startEdit: (target: EditTarget) => void;
  commitEdit: (text: string) => void;
  cancelEdit: () => void;

  beginTransaction: () => void;
  commitTransaction: () => void;
  cancelTransaction: () => void;
  pushHistory: () => void;

  undo: () => void;
  redo: () => void;
  save: () => void;
  resetToSample: () => void;
};

function loadSaved(): Presentation | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Presentation;
    if (!parsed || !Array.isArray(parsed.slides)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function usePresentation(itemId?: string): EditorApi {
  const [presentation, setPresentation] = useState<Presentation>(() => samplePresentation());
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [editing, setEditing] = useState<EditTarget | null>(null);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const presentationRef = useRef(presentation);
  const past = useRef<Presentation[]>([]);
  const future = useRef<Presentation[]>([]);
  const transaction = useRef<Presentation | null>(null);
  const saveTimer = useRef<number | null>(null);

  const sync = useCallback((next: Presentation) => {
    presentationRef.current = next;
    setPresentation(next);
  }, []);

  const pushHistory = useCallback((snapshot: Presentation) => {
    past.current = [...past.current.slice(-MAX_HISTORY), snapshot];
    future.current = [];
    setCanUndo(true);
    setCanRedo(false);
  }, []);

  useEffect(() => {
    if (itemId) {
      const item = getLibraryItem(itemId);
      if (item) sync(item.content);
      return;
    }

    const saved = loadSaved();
    if (saved) sync(saved);
  }, [itemId, sync]);

  /** Grava a apresentação atual: no item da biblioteca ou na chave legada. */
  const persist = useCallback(
    (next: Presentation) => {
      if (itemId) {
        savePresentationContent(itemId, next);
        return;
      }
      writePresentation(next);
    },
    [itemId],
  );

  useEffect(() => {
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => {
      persist(presentation);
      setSavedAt(Date.now());
    }, 800);
    return () => {
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
    };
  }, [presentation, persist]);

  const updateSlideById = useCallback(
    (slideId: string, updater: (slide: Slide) => Slide, record = true) => {
      const current = presentationRef.current;
      const next: Presentation = {
        ...current,
        slides: current.slides.map((s) => (s.id === slideId ? updater(s) : s)),
      };
      if (record) pushHistory(current);
      sync(next);
    },
    [pushHistory, sync],
  );

  const updateCurrentSlide = useCallback(
    (updater: (slide: Slide) => Slide, record = true) => {
      const slide = presentationRef.current.slides[currentIndex];
      if (slide) updateSlideById(slide.id, updater, record);
    },
    [currentIndex, updateSlideById],
  );

  const beginTransaction = useCallback(() => {
    transaction.current = presentationRef.current;
  }, []);

  const commitTransaction = useCallback(() => {
    if (transaction.current) {
      pushHistory(transaction.current);
      transaction.current = null;
    }
  }, [pushHistory]);

  const cancelTransaction = useCallback(() => {
    transaction.current = null;
  }, []);

  const pushHistoryManually = useCallback(() => {
    pushHistory(presentationRef.current);
  }, [pushHistory]);

  const selectSlide = useCallback((index: number) => {
    setCurrentIndex(index);
    setSelectedElementId(null);
    setEditing(null);
  }, []);

  const renamePresentation = useCallback(
    (name: string) => {
      pushHistory(presentationRef.current);
      sync({ ...presentationRef.current, name });
    },
    [pushHistory, sync],
  );

  const replacePresentation = useCallback(
    (next: Presentation) => {
      pushHistory(presentationRef.current);
      sync(next);
      setCurrentIndex(0);
      setSelectedElementId(null);
      setEditing(null);
      persist(next);
      setSavedAt(Date.now());
    },
    [persist, pushHistory, sync],
  );

  const addSlide = useCallback(() => {
    const current = presentationRef.current;
    const next = {
      ...current,
      slides: [...current.slides, blankSlide(current.slides.length + 1)],
    };
    pushHistory(current);
    sync(next);
    setCurrentIndex(next.slides.length - 1);
    setSelectedElementId(null);
  }, [pushHistory, sync]);

  const duplicateSlide = useCallback(
    (index: number) => {
      const current = presentationRef.current;
      const source = current.slides[index];
      if (!source) return;
      const copy: Slide = {
        ...source,
        id: uid("slide"),
        name: `${source.name} (cópia)`,
        elements: source.elements.map((el) => ({ ...el, id: uid("el") })),
      };
      const slides = [...current.slides];
      slides.splice(index + 1, 0, copy);
      pushHistory(current);
      sync({ ...current, slides });
      setCurrentIndex(index + 1);
      setSelectedElementId(null);
    },
    [pushHistory, sync],
  );

  const deleteSlide = useCallback(
    (index: number) => {
      const current = presentationRef.current;
      if (current.slides.length <= 1) return;
      const next = { ...current, slides: current.slides.filter((_, i) => i !== index) };
      pushHistory(current);
      sync(next);
      setCurrentIndex((prev) => Math.max(0, Math.min(prev, next.slides.length - 1)));
      setSelectedElementId(null);
      setEditing(null);
    },
    [pushHistory, sync],
  );

  const moveSlide = useCallback(
    (from: number, to: number) => {
      const current = presentationRef.current;
      if (from === to || from < 0 || to < 0) return;
      const slides = [...current.slides];
      const [moved] = slides.splice(from, 1);
      slides.splice(to, 0, moved as Slide);
      pushHistory(current);
      sync({ ...current, slides });
    },
    [pushHistory, sync],
  );

  const renameSlide = useCallback(
    (index: number, name: string) => {
      updateSlideById(presentationRef.current.slides[index]?.id ?? "", (s) => ({ ...s, name }));
    },
    [updateSlideById],
  );

  const setSlideBackground = useCallback(
    (index: number, background: SlideBackground) => {
      updateSlideById(presentationRef.current.slides[index]?.id ?? "", (s) => ({
        ...s,
        background,
      }));
    },
    [updateSlideById],
  );

  const selectElement = useCallback((id: string | null) => {
    setSelectedElementId(id);
    if (!id) setEditing(null);
  }, []);

  const addElement = useCallback(
    (element: SlideElement) => {
      updateCurrentSlide((s) => ({ ...s, elements: [...s.elements, element] }), true);
      setSelectedElementId(element.id);
      setEditing(null);
    },
    [updateCurrentSlide],
  );

  const updateElement = useCallback(
    (elementId: string, patch: Partial<SlideElement>, record = true) => {
      updateCurrentSlide(
        (s) => ({
          ...s,
          elements: s.elements.map((el) =>
            el.id === elementId ? ({ ...el, ...patch } as SlideElement) : el,
          ),
        }),
        record,
      );
    },
    [updateCurrentSlide],
  );

  const deleteElement = useCallback(
    (elementId: string) => {
      updateCurrentSlide((s) => ({
        ...s,
        elements: s.elements.filter((el) => el.id !== elementId),
      }));
      setSelectedElementId((prev) => (prev === elementId ? null : prev));
      setEditing((prev) => (prev?.id === elementId ? null : prev));
    },
    [updateCurrentSlide],
  );

  const shiftZ = useCallback(
    (elementId: string, direction: 1 | -1) => {
      updateCurrentSlide((s) => {
        const ordered = [...s.elements].sort((a, b) => a.zIndex - b.zIndex);
        const index = ordered.findIndex((el) => el.id === elementId);
        if (index < 0) return s;
        const swapWith = ordered[index + direction];
        if (!swapWith) return s;
        const a = ordered[index] as SlideElement;
        const b = swapWith as SlideElement;
        return {
          ...s,
          elements: s.elements.map((el) => {
            if (el.id === a.id) return { ...el, zIndex: b.zIndex };
            if (el.id === b.id) return { ...el, zIndex: a.zIndex };
            return el;
          }),
        };
      });
    },
    [updateCurrentSlide],
  );

  const bringForward = useCallback((elementId: string) => shiftZ(elementId, 1), [shiftZ]);
  const sendBackward = useCallback((elementId: string) => shiftZ(elementId, -1), [shiftZ]);

  const startEdit = useCallback((target: EditTarget) => {
    setEditing(target);
    setSelectedElementId(target.id);
  }, []);

  const commitEdit = useCallback(
    (text: string) => {
      if (!editing) return;
      const patch: Partial<SlideElement> =
        editing.field === "text"
          ? { text }
          : editing.field === "title"
            ? { title: text }
            : editing.field === "body"
              ? { body: text }
              : editing.field === "value"
                ? { value: text }
                : { label: text };
      updateElement(editing.id, patch, true);
      setEditing(null);
    },
    [editing, updateElement],
  );

  const cancelEdit = useCallback(() => setEditing(null), []);

  const undo = useCallback(() => {
    const prev = past.current.pop();
    if (!prev) return;
    future.current = [presentationRef.current, ...future.current.slice(-MAX_HISTORY)];
    sync(prev);
    setCanUndo(past.current.length > 0);
    setCanRedo(true);
    setCurrentIndex((i) => Math.min(i, prev.slides.length - 1));
    setSelectedElementId(null);
    setEditing(null);
  }, [sync]);

  const redo = useCallback(() => {
    const next = future.current.shift();
    if (!next) return;
    past.current.push(presentationRef.current);
    sync(next);
    setCanUndo(true);
    setCanRedo(future.current.length > 0);
    setCurrentIndex((i) => Math.min(i, next.slides.length - 1));
    setSelectedElementId(null);
    setEditing(null);
  }, [sync]);

  const save = useCallback(() => {
    persist(presentationRef.current);
    setSavedAt(Date.now());
  }, [persist]);

  const resetToSample = useCallback(() => {
    pushHistory(presentationRef.current);
    sync(samplePresentation());
    setCurrentIndex(0);
    setSelectedElementId(null);
    setEditing(null);
  }, [pushHistory, sync]);

  const currentSlide = presentation.slides[currentIndex] ?? presentation.slides[0] ?? blankSlide(1);

  return useMemo(
    () => ({
      presentation,
      currentIndex,
      currentSlide,
      selectedElementId,
      editing,
      canUndo,
      canRedo,
      savedAt,
      selectSlide,
      renamePresentation,
      addSlide,
      duplicateSlide,
      deleteSlide,
      moveSlide,
      renameSlide,
      setSlideBackground,
      selectElement,
      addElement,
      updateElement,
      deleteElement,
      bringForward,
      sendBackward,
      startEdit,
      commitEdit,
      cancelEdit,
      beginTransaction,
      commitTransaction,
      cancelTransaction,
      pushHistory: pushHistoryManually,
      undo,
      redo,
      save,
      resetToSample,
      replacePresentation,
    }),
    [
      presentation,
      currentIndex,
      currentSlide,
      selectedElementId,
      editing,
      canUndo,
      canRedo,
      savedAt,
      selectSlide,
      renamePresentation,
      addSlide,
      duplicateSlide,
      deleteSlide,
      moveSlide,
      renameSlide,
      setSlideBackground,
      selectElement,
      addElement,
      updateElement,
      deleteElement,
      bringForward,
      sendBackward,
      startEdit,
      commitEdit,
      cancelEdit,
      beginTransaction,
      commitTransaction,
      cancelTransaction,
      pushHistoryManually,
      undo,
      redo,
      save,
      resetToSample,
      replacePresentation,
    ],
  );
}

import { useEffect, useRef } from "react";

import { cn } from "@/lib/utils";

type EditableTextProps = {
  value: string;
  singleLine?: boolean;
  className?: string;
  onCommit: (text: string) => void;
  onCancel: () => void;
};

export function EditableText({
  value,
  singleLine = false,
  className,
  onCommit,
  onCancel,
}: EditableTextProps) {
  const ref = useRef<HTMLDivElement>(null);
  const committedRef = useRef(false);
  const cancelledRef = useRef(false);
  const textRef = useRef(value);
  const handlersRef = useRef({ onCommit, onCancel, singleLine });
  handlersRef.current = { onCommit, onCancel, singleLine };

  useEffect(() => {
    committedRef.current = false;
    cancelledRef.current = false;
    textRef.current = value;
  }, [value]);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    node.focus();
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(node);
    selection?.removeAllRanges();
    selection?.addRange(range);
  }, []);

  // Texto digitado vira o valor definitivo ao sair da edição, mesmo que o
  // componente seja desmontado sem passar por blur (clique em outro elemento, troca de slide…).
  useEffect(
    () => () => {
      if (committedRef.current || cancelledRef.current) return;
      committedRef.current = true;
      const { onCommit: commit, singleLine: single } = handlersRef.current;
      commit(single ? textRef.current.replace(/\n/g, " ").trim() : textRef.current);
    },
    [],
  );

  const normalize = (text: string) => (singleLine ? text.replace(/\n/g, " ").trim() : text);

  const commit = () => {
    if (committedRef.current) return;
    committedRef.current = true;
    const text = ref.current?.innerText ?? textRef.current;
    textRef.current = text;
    handlersRef.current.onCommit(normalize(text));
  };

  return (
    <div
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      spellCheck={false}
      className={cn("h-full min-h-full w-full cursor-text outline-none", className)}
      onFocus={() => {
        committedRef.current = false;
      }}
      onInput={(e) => {
        textRef.current = e.currentTarget.innerText;
      }}
      onBlur={commit}
      onKeyDown={(e) => {
        e.stopPropagation();
        if (e.key === "Escape") {
          e.preventDefault();
          cancelledRef.current = true;
          handlersRef.current.onCancel();
        } else if (singleLine && e.key === "Enter") {
          e.preventDefault();
          commit();
        }
      }}
      onPaste={(e) => {
        e.preventDefault();
        const text = e.clipboardData.getData("text/plain");
        document.execCommand("insertText", false, text);
      }}
    >
      {value}
    </div>
  );
}

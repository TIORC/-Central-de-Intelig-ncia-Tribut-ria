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

  useEffect(() => {
    committedRef.current = false;
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

  const commit = () => {
    if (committedRef.current) return;
    committedRef.current = true;
    const node = ref.current;
    const text = node?.innerText ?? value;
    onCommit(singleLine ? text.replace(/\n/g, " ").trim() : text);
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
      onBlur={commit}
      onKeyDown={(e) => {
        e.stopPropagation();
        if (e.key === "Escape") {
          e.preventDefault();
          onCancel();
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

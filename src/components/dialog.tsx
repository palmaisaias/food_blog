"use client";

import { useEffect, useRef, type KeyboardEventHandler, type ReactNode } from "react";
import { X } from "lucide-react";

export function Dialog({ label, onClose, children, onKeyDown, className = "" }: { label: string; onClose: () => void; children: ReactNode; onKeyDown?: KeyboardEventHandler<HTMLDialogElement>; className?: string }) {
  const node = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = node.current;
    if (!dialog) return;
    const previouslyFocused = document.activeElement;
    dialog.showModal();
    return () => {
      dialog.close();
      if (previouslyFocused instanceof HTMLElement) previouslyFocused.focus();
    };
  }, []);

  return <dialog ref={node} aria-label={label} className={`dialog ${className}`} onKeyDown={onKeyDown} onCancel={(event) => { event.preventDefault(); onClose(); }}>
    <button type="button" className="icon-button dialog-close" aria-label={`Close ${label}`} onClick={onClose}><X size={25} aria-hidden="true" /></button>
    {children}
  </dialog>;
}

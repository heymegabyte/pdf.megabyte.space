import { useEffect } from "react";

const BRAND = "Megabyte PDF";

export function useDocumentTitle(title: string): void {
  useEffect(() => {
    if (!title) return;
    const next = title.includes(BRAND) ? title : `${title} — ${BRAND}`;
    if (document.title === next) return;
    const previous = document.title;
    document.title = next;
    return () => {
      document.title = previous;
    };
  }, [title]);
}

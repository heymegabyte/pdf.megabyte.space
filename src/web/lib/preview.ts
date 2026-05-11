import { buildPagedDocument, PAGE_DIMS, pageDimsPx, type PageSize } from "../../shared/pageLayout";

export { PAGE_DIMS, pageDimsPx };

export const buildPreviewDoc = (
  html: string,
  css: string,
  pageSize: PageSize,
  margin: string
): string => buildPagedDocument(html, css, pageSize, margin, { mode: "preview" });

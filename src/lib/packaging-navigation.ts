export function packagingWorkspaceHref(importId: string, rowNumber?: number) {
  const query = new URLSearchParams({ packaging: importId });
  if (rowNumber !== undefined) query.set("row", String(rowNumber));
  return `/dashboard/clients?${query}`;
}

export function rememberPackagingWorkspace(
  importId: string,
  rowNumber?: number,
) {
  const url = new URL(window.location.href);
  url.searchParams.set("packaging", importId);
  if (rowNumber === undefined) url.searchParams.delete("row");
  else url.searchParams.set("row", String(rowNumber));
  window.history.replaceState(
    null,
    "",
    `${url.pathname}${url.search}${url.hash}`,
  );
}

export function clearPackagingWorkspaceLocation() {
  const url = new URL(window.location.href);
  url.searchParams.delete("packaging");
  url.searchParams.delete("row");
  window.history.replaceState(
    null,
    "",
    `${url.pathname}${url.search}${url.hash}`,
  );
}

import { mediaTypes } from "./media-types";
import { toast } from "sonner";
export async function uploadMediaFile(
  file: File,
  scope: {
    importId: string;
    rowNumber: number;
    componentId?: string;
    slot: string;
  },
) {
  if (!(mediaTypes as readonly string[]).includes(file.type))
    throw new Error(
      "Choose a supported image, video, PDF, Excel or document file.",
    );
  const form = new FormData();
  form.set("file", file);
  form.set("importId", scope.importId);
  form.set("rowNumber", String(scope.rowNumber));
  form.set("componentId", scope.componentId || "");
  form.set("slot", scope.slot);
  const response = await fetch("/api/uploads", { method: "POST", body: form });
  const body = await response.json();
  if (!response.ok)
    throw new Error(body.error || "File could not be uploaded.");
  return body as { id: string; name: string; type: string; size: number };
}
export async function persistAssessmentFile(file: File, slot: string) {
  const match = window.location.pathname.match(
    /^\/dashboard\/packaging\/([a-f0-9]{24})\/(\d+)\//i,
  );
  if (!match)
    throw new Error(
      "Open a saved packaging assessment before uploading evidence.",
    );
  const notification = toast.loading("Uploading evidence…");
  try {
    const uploaded = await uploadMediaFile(file, {
      importId: match[1],
      rowNumber: Number(match[2]),
      componentId:
        new URLSearchParams(window.location.search).get("component") || "",
      slot: `${window.location.pathname.endsWith("article-5") ? "article-5" : "assessment"}:${slot}`,
    });
    toast.success("Evidence uploaded", { id: notification });
    return uploaded;
  } catch (error) {
    toast.error(error instanceof Error ? error.message : "Upload failed.", {
      id: notification,
    });
    throw error;
  }
}

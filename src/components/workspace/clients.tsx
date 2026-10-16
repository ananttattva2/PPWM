"use client";
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { clearPackagingWorkspaceLocation } from "@/lib/packaging-navigation";
import { Modal, MultiSelect } from "@mantine/core";
import PackagingImport from "./packaging-import";
import PpwrTimeline from "./ppwr-timeline";
import OnboardingProgress from "./onboarding-progress";
import type { ImportResult } from "@/lib/packaging-import-schema";
import { TextInput, Select, Textarea } from "../ui/floating-fields";
import { motion } from "motion/react";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Plus,
  Search,
  UploadCloud,
  FileText,
  Trash2,
  ShieldCheck,
  MapPin,
  UserRound,
  Download,
  LoaderCircle,
  Eye,
  Pencil,
} from "lucide-react";
import { Button } from "../ui/button";
import {
  companySchema,
  organisationRoles,
  operatorStatuses,
  obligationsByRole,
  restrictedPackagingFormats,
  MAX_DOCUMENT_SIZE,
  MAX_DOCUMENTS,
  documentTypes,
} from "@/lib/client-schema";
type Client = {
  _id: string;
  company: string;
  legalName?: string;
  tradeName?: string;
  gstNumber?: string;
  registrationNumber?: string;
  registeredAddress?: string;
  telephone?: string;
  notes?: string;
  status?: string;
  organisationRole?: string;
  operatorStatus?: string[];
  obligationsByRole?: string[];
  authorisedPerson?: string;
  contact: string;
  email: string;
  country: string;
  industry: string;
  materials: string[];
  documents?: { name: string; size: number }[];
  packagingDraftId?: string;
  packagingImport?: {
    id: string;
    fileName: string;
    summary: {
      total: number;
      complete?: number;
      missing?: number;
      errors?: number;
    };
    settings?: { plant?: string };
  };
};
const initial = {
  legalName: "",
  tradeName: "",
  gstNumber: "",
  registrationNumber: "",
  organisationRole: "",
  registeredAddress: "",
  email: "",
  telephone: "",
  authorisedPerson: "",
  country: "India",
  industry: "",
  operatorStatus: [] as string[],
  obligationsByRole: [] as string[],
  materials: [] as string[],
  notes: "",
};
type PendingImport = {
  id: string;
  fileName: string;
  total: number;
  updatedAt: string;
  expiresAt: string;
};
type YesNoAnswer = "yes" | "no";
export default function Clients({ canEdit }: { canEdit: boolean }) {
  const [exemptionOpen, setExemptionOpen] = useState(false);
  const [exemptionBusy, setExemptionBusy] = useState(false);
  const [restrictedObligation, setRestrictedObligation] =
    useState<YesNoAnswer | null>(null);
  const [restrictedAnswers, setRestrictedAnswers] = useState<
    Record<string, YesNoAnswer>
  >({});
  const [restrictedError, setRestrictedError] = useState("");
  const [pendingImports, setPendingImports] = useState<PendingImport[]>([]);
  const [packagingImport, setPackagingImport] = useState<ImportResult | null>(
    null,
  );
  const [packagingFile, setPackagingFile] = useState<File | null>(null);
  const [importBusy, setImportBusy] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [managedImport, setManagedImport] = useState<ImportResult | null>(null);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [viewingClient, setViewingClient] = useState<Client | null>(null);
  const searchParams = useSearchParams();
  const requestedImportId = searchParams.get("packaging");
  const [restoringPackaging, setRestoringPackaging] = useState(
    Boolean(requestedImportId),
  );
  useEffect(() => {
    if (
      !requestedImportId ||
      !/^[a-f0-9]{24}$/i.test(requestedImportId) ||
      packagingImport?.id === requestedImportId ||
      managedImport?.id === requestedImportId
    ) {
      setRestoringPackaging(false);
      return;
    }
    let active = true;
    setRestoringPackaging(true);
    async function restore() {
      try {
        const response = await fetch(
          `/api/packaging-imports/${requestedImportId}`,
        );
        const imported = await response.json();
        if (!response.ok)
          throw new Error(
            imported.error || "Could not reopen this packaging workspace.",
          );
        if (active) {
          setManagedImport(imported);

          setShow(false);
        }
      } catch (failure) {
        if (active) toast.error((failure as Error).message);
      } finally {
        if (active) setRestoringPackaging(false);
      }
    }
    void restore();
    return () => {
      active = false;
    };
  }, [requestedImportId, packagingImport?.id, managedImport?.id]);
  const [list, setList] = useState<Client[]>([]),
    [form, setForm] = useState(initial),
    [files, setFiles] = useState<File[]>([]),
    [show, setShow] = useState(false),
    [step, setStep] = useState(0),
    [search, setSearch] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true),
    [fieldErrors, setFieldErrors] = useState<Record<string, string>>({}),
    [dragging, setDragging] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const linkingDraft = useRef("");
  async function load() {
    try {
      const r = await fetch("/api/clients");
      if (!r.ok) throw new Error("Could not load clients. Please try again.");
      setList(await r.json());
      if (canEdit) {
        const drafts = await fetch("/api/packaging-imports");
        if (!drafts.ok)
          throw new Error("Could not load pending imports. Please try again.");
        setPendingImports(await drafts.json());
      }
    } catch (e) {
      const message = (e as Error).message;
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    void load();
  }, []);
  useEffect(() => {
    setSearch(searchParams.get("q") || "");
  }, [searchParams]);
  function update<K extends keyof typeof initial>(
    key: K,
    value: (typeof initial)[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((prev) => ({ ...prev, [key]: "" }));
  }
  function addFiles(incoming: File[]) {
    if (
      files.length + incoming.length + (editingClient?.documents?.length || 0) >
      MAX_DOCUMENTS
    ) {
      toast.error("Upload a maximum of 5 documents.");
      return;
    }
    const invalid = incoming.find(
      (f) =>
        !documentTypes.includes(f.type) ||
        f.size === 0 ||
        f.size > MAX_DOCUMENT_SIZE,
    );
    if (invalid) {
      toast.error(
        `${invalid.name}: choose a PDF, PNG or JPEG file, up to 2 MB.`,
      );
      return;
    }
    setFiles((prev) => [
      ...prev,
      ...incoming.filter(
        (f) =>
          !prev.some(
            (p) =>
              p.name === f.name &&
              p.size === f.size &&
              p.lastModified === f.lastModified,
          ),
      ),
    ]);
    setFieldErrors((prev) => ({ ...prev, documents: "" }));
    toast.success(
      editingClient
        ? "Document added. It will be uploaded when you save changes."
        : "Document added. It will be uploaded when you continue.",
    );
  }
  async function next() {
    if (busy) return;
    setError("");
    if (step === 0) {
      const result = companySchema.safeParse(form);
      const errors: Record<string, string> = {};
      if (!result.success)
        for (const issue of result.error.issues) {
          const key = String(issue.path[0]);
          errors[key] ??= issue.message;
        }
      if (!files.length && !editingClient?.documents?.length)
        errors.documents = "Upload at least one supporting document.";
      setFieldErrors(errors);
      if (Object.keys(errors).length) {
        toast.error("Please complete the required organisation details.");
        requestAnimationFrame(() =>
          document.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus(),
        );
        return;
      }
      if (!(await saveOrganisation())) return;
      setFieldErrors({});
      setRestrictedObligation(null);
      setRestrictedAnswers({});
      setRestrictedError("");
      setExemptionOpen(true);
      return;
    }
    if (step === 1) {
      if (
        packagingImport?.analysis.summary.errors &&
        !editingClient?.packagingImport
      ) {
        toast.error(
          "Resolve validation errors before continuing. Missing details can be completed later.",
        );
        return;
      }
      await save(true);
      return;
    }
    setFieldErrors({});
    setStep((s) => s + 1);
    requestAnimationFrame(() =>
      document.querySelector(".onboarding-progress")?.scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "auto"
          : "smooth",
        block: "start",
      }),
    );
  }
  async function rememberPackaging(updated: ImportResult | null) {
    setPackagingImport(updated);
    if (
      !updated ||
      !editingClient ||
      editingClient.packagingImport ||
      linkingDraft.current === updated.id
    )
      return;
    linkingDraft.current = updated.id;
    setBusy(true);
    try {
      const response = await fetch(
        `/api/clients/${editingClient._id}/packaging-draft`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ importId: updated.id }),
        },
      );
      const saved = await response.json();
      if (!response.ok)
        throw new Error(saved.error || "Could not link this packaging draft.");
      setEditingClient((current) =>
        current ? { ...current, packagingDraftId: updated.id } : current,
      );
    } catch (failure) {
      linkingDraft.current = "";
      toast.error((failure as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function saveOrganisation() {
    setBusy(true);
    try {
      const body = new FormData();
      body.append("data", JSON.stringify(form));
      files.forEach((file) => body.append("documents", file));
      const response = await fetch(
        editingClient ? `/api/clients/${editingClient._id}` : "/api/clients",
        {
          method: editingClient ? "PATCH" : "POST",
          body,
        },
      );
      const saved = await response.json();
      if (!response.ok) {
        if (saved.fields)
          setFieldErrors(
            Object.fromEntries(
              Object.entries(saved.fields).map(([key, values]) => [
                key,
                (values as string[])[0],
              ]),
            ),
          );
        throw new Error(saved.error || "Could not save organisation details.");
      }
      setEditingClient({
        ...editingClient,
        ...form,
        _id: saved.id,
        company: form.legalName,
        contact: form.authorisedPerson,
        documents: [
          ...(editingClient?.documents || []),
          ...files.map((file) => ({ name: file.name, size: file.size })),
        ],
      });
      setFiles([]);
      const reply = await fetch(`/api/clients/${saved.id}`);
      if (!reply.ok)
        throw new Error(
          "Organisation saved. Reopen the client list to continue.",
        );
      setEditingClient(await reply.json());
      setFiles([]);
      await load();
      toast.success("Organisation saved. You can add packaging now or later.");
      return true;
    } catch (failure) {
      setError((failure as Error).message);
      toast.error((failure as Error).message);
      return false;
    } finally {
      setBusy(false);
    }
  }
  async function saveRestrictedPackaging(answer: YesNoAnswer) {
    if (!editingClient) return;
    if (
      answer === "yes" &&
      restrictedPackagingFormats.some(({ id }) => !restrictedAnswers[id])
    ) {
      setRestrictedError("Please answer all six questions to continue.");
      return;
    }
    setExemptionBusy(true);
    setRestrictedError("");
    try {
      const response = await fetch(
        `/api/clients/${editingClient._id}/exemption`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            answer,
            responses: answer === "yes" ? restrictedAnswers : {},
          }),
        },
      );
      const result = await response.json();
      if (!response.ok)
        throw new Error(
          result.error || "Could not save the restricted packaging answers.",
        );
      setExemptionOpen(false);
      setStep(1);
      requestAnimationFrame(() =>
        document
          .querySelector(".onboarding-progress")
          ?.scrollIntoView({ block: "start", behavior: "smooth" }),
      );
    } catch (failure) {
      toast.error((failure as Error).message);
    } finally {
      setExemptionBusy(false);
    }
  }
  async function save(stayInPackaging = false) {
    if (busy) return;
    setBusy(true);
    setError("");
    const notification = toast.loading(
      editingClient
        ? "Saving your client changes…"
        : "Creating your client and uploading documents…",
    );
    try {
      const data = new FormData();
      data.append(
        "data",
        JSON.stringify({
          ...form,
          materials: packagingImport?.analysis.materialFamilies || [],
          packagingImportId: packagingImport?.id,
          clientId: editingClient?._id,
        }),
      );
      files.forEach((f) => data.append("documents", f));
      const attachPackaging = Boolean(
        packagingImport && !editingClient?.packagingImport,
      );
      const updateProfile = editingClient && !attachPackaging;
      const r = await fetch(
        updateProfile ? `/api/clients/${editingClient._id}` : "/api/clients",
        { method: updateProfile ? "PATCH" : "POST", body: data },
      );
      const result = await r.json();
      if (!r.ok) {
        if (result.fields) {
          const fields: Record<string, string> = {};
          for (const [k, v] of Object.entries(result.fields))
            fields[k] = (v as string[])[0];
          setFieldErrors(fields);
          setStep(0);
        }
        throw new Error(result.error || "Unable to save client.");
      }
      if (stayInPackaging) {
        if (packagingImport) {
          const importedReply = await fetch(
            `/api/packaging-imports/${packagingImport.id}`,
          );
          if (!importedReply.ok)
            throw new Error(
              "Client saved. Reopen Packaging from your client list.",
            );
          setManagedImport(await importedReply.json());
          setShow(false);
        } else {
          setStep(1);
        }
        setFiles([]);
        toast.success("Client updated successfully", { id: notification });
        await load();
        return;
      }
      setShow(false);
      setForm(initial);
      setFiles([]);
      setStep(0);
      setPackagingImport(null);
      setPackagingFile(null);
      toast.success(
        editingClient
          ? "Client updated successfully"
          : "Client created successfully",
        {
          id: notification,
          description:
            "Organisation details and supporting documents are saved.",
        },
      );
      setEditingClient(null);
      await load();
    } catch (e) {
      setError((e as Error).message);
      toast.error((e as Error).message, { id: notification });
    } finally {
      setBusy(false);
    }
  }
  const filtered = list.filter((c) =>
    `${c.legalName || c.company} ${c.tradeName || ""} ${c.email} ${c.gstNumber || ""}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );
  async function editClient(client: Client) {
    setBusy(true);
    try {
      const response = await fetch(`/api/clients/${client._id}`);
      const profile = await response.json();
      if (!response.ok) throw new Error(profile.error);
      let imported: ImportResult | null = null;
      const savedImportId =
        profile.packagingImport?.id || profile.packagingDraftId;
      if (savedImportId) {
        const reply = await fetch(`/api/packaging-imports/${savedImportId}`);
        const data = await reply.json();
        if (!reply.ok) throw new Error(data.error);
        imported = data;
      }
      setForm({
        ...initial,
        ...Object.fromEntries(
          Object.keys(initial).map((key) => [
            key,
            profile[key] ?? initial[key as keyof typeof initial],
          ]),
        ),
      } as typeof initial);
      setEditingClient(profile);
      setPackagingImport(imported);
      setPackagingFile(null);
      setFiles([]);
      setFieldErrors({});
      setError("");

      setStep(1);
      setShow(true);
      requestAnimationFrame(() =>
        window.scrollTo({ top: 0, behavior: "smooth" }),
      );
    } catch (failure) {
      toast.error((failure as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function viewClient(client: Client) {
    setBusy(true);
    try {
      const response = await fetch(`/api/clients/${client._id}`);
      const profile = await response.json();
      if (!response.ok) throw new Error(profile.error);
      setViewingClient(profile);
    } catch (failure) {
      toast.error((failure as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function resumeImport(draft: PendingImport) {
    setBusy(true);
    try {
      const response = await fetch(`/api/packaging-imports/${draft.id}`);
      const imported = await response.json();
      if (!response.ok) throw new Error(imported.error);
      setEditingClient(null);
      setForm(initial);
      setPackagingImport(imported);
      setPackagingFile(null);
      setFiles([]);
      setFieldErrors({});
      setError("");
      setStep(0);
      setShow(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
      toast.info(
        "Your packaging data is restored. Complete organisation details and documents to create this client.",
      );
    } catch (failure) {
      toast.error((failure as Error).message);
    } finally {
      setBusy(false);
    }
  }
  if (restoringPackaging)
    return (
      <section className="panel" role="status" style={{ padding: 32 }}>
        <LoaderCircle size={20} className="spin" /> Opening packaging workspace…
      </section>
    );
  if (managedImport)
    return (
      <>
        <div className="page-heading">
          <div>
            <h1>Packaging workspace</h1>
            <p>Update SKU details and composition for this client.</p>
          </div>
          <Button
            type="button"
            variant="outline"
            disabled={importBusy || editorOpen}
            onClick={() => {
              clearPackagingWorkspaceLocation();
              setManagedImport(null);
              void load();
            }}
          >
            <ArrowLeft size={16} /> Back to clients
          </Button>
        </div>
        <section
          key="packaging-workspace"
          className="panel packaging-step-layout"
        >
          <PackagingImport
            canEdit={canEdit}
            key={managedImport.id}
            result={managedImport}
            onChange={(updated) => {
              if (updated) setManagedImport(updated);
            }}
            onBusy={setImportBusy}
            sourceFile={null}
            onFileChange={() => {}}
            organisationName={managedImport.settings.plant}
            onEditorChange={setEditorOpen}
          />
        </section>
      </>
    );
  return (
    <>
      <Modal
        opened={exemptionOpen}
        onClose={() => !exemptionBusy && setExemptionOpen(false)}
        title="Restricted Packaging Formats"
        centered
        closeOnClickOutside={!exemptionBusy}
        size={1180}
        classNames={{ content: "restricted-packaging-modal" }}
      >
        <p className="restricted-packaging-intro">
          Please select whether you are obligated to Restricted Packaging
          Formats.
        </p>
        <fieldset className="restricted-choice-group">
          <legend>Are you obligated to Restricted Packaging Formats?</legend>
          <label
            className={restrictedObligation === "yes" ? "is-selected" : ""}
          >
            <input
              type="radio"
              name="restricted-packaging-obligation"
              value="yes"
              checked={restrictedObligation === "yes"}
              disabled={exemptionBusy}
              onChange={() => {
                setRestrictedObligation("yes");
                setRestrictedError("");
              }}
            />
            <span>Yes</span>
          </label>
          <label
            className={restrictedObligation === "no" ? "is-selected" : ""}
          >
            <input
              type="radio"
              name="restricted-packaging-obligation"
              value="no"
              checked={restrictedObligation === "no"}
              disabled={exemptionBusy}
              onChange={() => {
                setRestrictedObligation("no");
                setRestrictedAnswers({});
                setRestrictedError("");
              }}
            />
            <span>No</span>
          </label>
        </fieldset>
        {restrictedObligation === "yes" && (
          <section className="restricted-format-questions">
            <div className="restricted-format-heading">
              <h3>Annex V: Restricted Packaging Formats</h3>
              <p>Answer each question. Your answers will not block packaging.</p>
            </div>
            {restrictedPackagingFormats.map((format, index) => (
              <fieldset className="restricted-format-row" key={format.id}>
                <legend>
                  <span>{index + 1}</span>
                  Do you use {format.title.toLowerCase()}?
                </legend>
                <p>{format.description}</p>
                <small>{format.example}</small>
                <div className="restricted-format-options">
                  {(["yes", "no"] as const).map((answer) => (
                    <label
                      key={answer}
                      className={
                        restrictedAnswers[format.id] === answer
                          ? "is-selected"
                          : ""
                      }
                    >
                      <input
                        type="radio"
                        name={`restricted-format-${format.id}`}
                        value={answer}
                        checked={restrictedAnswers[format.id] === answer}
                        disabled={exemptionBusy}
                        onChange={() => {
                          setRestrictedAnswers((current) => ({
                            ...current,
                            [format.id]: answer,
                          }));
                          setRestrictedError("");
                        }}
                      />
                      <span>{answer === "yes" ? "Yes" : "No"}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
            ))}
          </section>
        )}
        {restrictedError && (
          <div className="exemption-alert" role="alert">
            {restrictedError}
          </div>
        )}
        {restrictedObligation && (
          <div className="exemption-actions">
            <Button
              disabled={exemptionBusy}
              onClick={() => void saveRestrictedPackaging(restrictedObligation)}
            >
              {exemptionBusy ? "Saving…" : "Continue to packaging"}
            </Button>
          </div>
        )}
      </Modal>
      {!show && (
        <div className="page-heading">
          <div>
            <span className="eyebrow">A CONNECTED PORTFOLIO</span>
            <h1>Client onboarding</h1>
            <p>Start with the right details. Build a stronger partnership.</p>
          </div>
          <div className="client-heading-actions">
            <PpwrTimeline />
            {canEdit && !show && (
              <Button
                disabled={busy || importBusy || editorOpen}
                onClick={() => {
                  setShow(true);
                  setEditingClient(null);
                  setForm(initial);
                  setFiles([]);
                  setPackagingImport(null);
                  setPackagingFile(null);
                  setStep(0);
                  setError("");
                }}
              >
                <Plus size={18} /> New client
              </Button>
            )}
          </div>
        </div>
      )}
      {!show && pendingImports.length > 0 && (
        <section className="panel pending-imports" aria-label="Pending imports">
          <div className="panel-heading">
            <div>
              <h3>
                Pending imports{" "}
                <span className="count-badge">{pendingImports.length}</span>
              </h3>
              <p>
                These uploads have not been saved as clients. Resume to complete
                organisation details. Drafts expire 7 days after processing.
              </p>
            </div>
          </div>
          <div className="pending-import-list">
            {pendingImports.map((draft) => (
              <div className="pending-import-row" key={draft.id}>
                <FileText size={20} aria-hidden="true" />
                <div>
                  <b>{draft.fileName}</b>
                  <p>
                    {draft.total} packaging SKUs · Expires{" "}
                    {new Date(draft.expiresAt).toLocaleDateString()}
                  </p>
                </div>
                <Button
                  variant="outline"
                  disabled={busy}
                  onClick={() => void resumeImport(draft)}
                >
                  Resume <ArrowRight size={16} />
                </Button>
              </div>
            ))}
          </div>
        </section>
      )}
      {show ? (
        <section key="client-form" className="panel onboarding-panel">
          <div className="onboarding-step-header">
            <OnboardingProgress
              active={step}
              onBack={(index) => {
                if (!busy && !importBusy && !editorOpen) setStep(index);
              }}
            />
            <button
              disabled={busy || importBusy || editorOpen}
              onClick={() => {
                setShow(false);
                void load();
              }}
              className="text-button"
            >
              Close form
            </button>
          </div>
          <form
            noValidate
            onSubmit={(e) => {
              e.preventDefault();
              if (!busy && !importBusy && !editorOpen) void next();
            }}
          >
            <motion.div
              key={step}
              initial={{ opacity: 1, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`onboarding-fields ${step === 0 ? "organisation-layout" : step === 1 ? "packaging-step-layout" : ""}`}
            >
              {step === 0 ? (
                <>
                  <div className="onboarding-intro">
                    <span className="icon-box">
                      <Building2 size={22} />
                    </span>
                    <div>
                      <h3>Organisation information</h3>
                      <p>
                        Use the details shown on your company’s registration
                        documents.
                      </p>
                    </div>
                    <span className="required-note">* Required fields</span>
                  </div>
                  <fieldset className="onboarding-section">
                    <legend>
                      <Building2 size={16} /> Business identity
                    </legend>
                    <div className="form-grid">
                      <TextInput
                        label="Legal name"
                        placeholder="Registered legal entity name"
                        required
                        maxLength={160}
                        value={form.legalName}
                        error={fieldErrors.legalName}
                        onChange={(e) => update("legalName", e.target.value)}
                      />
                      <TextInput
                        label="Trade name"
                        placeholder="Name your business operates under"
                        required
                        maxLength={160}
                        value={form.tradeName}
                        error={fieldErrors.tradeName}
                        onChange={(e) => update("tradeName", e.target.value)}
                      />
                      <TextInput
                        label="GST number"
                        placeholder="e.g. 27ABCDE1234F1Z5"
                        description="15-character GST identification number"
                        required
                        maxLength={15}
                        value={form.gstNumber}
                        error={fieldErrors.gstNumber}
                        onChange={(e) =>
                          update("gstNumber", e.target.value.toUpperCase())
                        }
                      />
                      <Select
                        label="Organisation role"
                        placeholder="Select one role"
                        description="Choose the role that best describes this organisation."
                        required
                        searchable
                        data={[...organisationRoles]}
                        value={form.organisationRole || null}
                        error={fieldErrors.organisationRole}
                        onChange={(v) => update("organisationRole", v || "")}
                      />
                      <TextInput
                        label="Country"
                        required
                        maxLength={80}
                        value={form.country}
                        error={fieldErrors.country}
                        onChange={(e) => update("country", e.target.value)}
                      />
                    </div>
                    <div className="operator-role-fields">
                      <MultiSelect
                        label="Operator Status"
                        placeholder="Select operator statuses"
                        searchable
                        clearable
                        data={[...operatorStatuses]}
                        value={form.operatorStatus}
                        onChange={(values) => update("operatorStatus", values)}
                        error={fieldErrors.operatorStatus}
                      />
                      <MultiSelect
                        label="Obligations by Role"
                        placeholder="Select applicable obligations"
                        searchable
                        clearable
                        data={[...obligationsByRole]}
                        value={form.obligationsByRole}
                        onChange={(values) =>
                          update("obligationsByRole", values)
                        }
                        error={fieldErrors.obligationsByRole}
                      />
                    </div>
                  </fieldset>
                  <fieldset className="onboarding-section">
                    <legend>
                      <MapPin size={16} /> Registered address
                    </legend>
                    <Textarea
                      label="Registered address"
                      placeholder="Building / street, locality, city, state and postal code"
                      required
                      minRows={3}
                      maxLength={1000}
                      value={form.registeredAddress}
                      error={fieldErrors.registeredAddress}
                      onChange={(e) =>
                        update("registeredAddress", e.target.value)
                      }
                    />
                  </fieldset>
                  <fieldset className="onboarding-section">
                    <legend>
                      <UserRound size={16} /> Contact & authorisation
                    </legend>
                    <div className="form-grid">
                      <TextInput
                        label="Email"
                        type="email"
                        placeholder="contact@company.com"
                        required
                        value={form.email}
                        error={fieldErrors.email}
                        onChange={(e) => update("email", e.target.value)}
                      />
                      <TextInput
                        label="Telephone"
                        type="tel"
                        placeholder="+91 98765 43210"
                        required
                        maxLength={24}
                        value={form.telephone}
                        error={fieldErrors.telephone}
                        onChange={(e) => update("telephone", e.target.value)}
                      />
                      <TextInput
                        label="Authorised person"
                        placeholder="Full name of the authorised representative"
                        required
                        maxLength={160}
                        value={form.authorisedPerson}
                        error={fieldErrors.authorisedPerson}
                        onChange={(e) =>
                          update("authorisedPerson", e.target.value)
                        }
                      />
                    </div>
                  </fieldset>

                  <fieldset className="onboarding-section">
                    <legend>
                      <FileText size={16} /> Supporting documents{" "}
                      <span className="document-count">
                        {files.length + (editingClient?.documents?.length || 0)}
                        /5
                      </span>
                    </legend>
                    <p className="document-description">
                      Upload registration, GST or authorisation documents. At
                      least one document is required.
                    </p>
                    <div
                      className={`document-dropzone ${dragging ? "dragging" : ""} ${fieldErrors.documents ? "invalid" : ""}`}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setDragging(true);
                      }}
                      onDragLeave={() => setDragging(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setDragging(false);
                        addFiles(Array.from(e.dataTransfer.files));
                      }}
                    >
                      <UploadCloud size={30} />
                      <b>Drag your documents here</b>
                      <p>
                        PDF, PNG or JPEG · Up to 2 MB each · Maximum 5 files
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => fileInput.current?.click()}
                      >
                        Browse documents <Plus size={15} />
                      </Button>
                      <input
                        ref={fileInput}
                        type="file"
                        aria-label="Supporting documents"
                        accept="application/pdf,image/png,image/jpeg"
                        multiple
                        className="sr-only"
                        onChange={(e) => {
                          addFiles(Array.from(e.target.files || []));
                          e.target.value = "";
                        }}
                      />
                    </div>
                    {fieldErrors.documents && (
                      <p className="document-error" role="alert">
                        {fieldErrors.documents}
                      </p>
                    )}
                    <div className="document-list">
                      {editingClient?.documents?.map((document, index) => (
                        <div key={`saved-${index}`}>
                          <FileText size={20} />
                          <div>
                            <b>{document.name}</b>
                            <small>
                              Already saved ·{" "}
                              {(document.size / 1024).toFixed(1)} KB
                            </small>
                          </div>
                          <a
                            href={`/api/clients/${editingClient._id}/documents/${index}`}
                            aria-label={`Download saved ${document.name}`}
                          >
                            <Download size={16} />
                          </a>
                        </div>
                      ))}
                      {files.map((f, i) => (
                        <div key={`${f.name}-${f.lastModified}`}>
                          <span className="document-file-icon">
                            <FileText size={20} />
                          </span>
                          <div>
                            <b>{f.name}</b>
                            <small>
                              {(f.size / 1024).toFixed(1)} KB · Ready to upload
                            </small>
                          </div>
                          <button
                            type="button"
                            aria-label={`Remove ${f.name}`}
                            onClick={() =>
                              setFiles((prev) =>
                                prev.filter((_, index) => index !== i),
                              )
                            }
                          >
                            <Trash2 size={17} />
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="document-privacy">
                      <ShieldCheck size={14} /> Documents are stored with this
                      client and accessible only to signed-in workspace members.
                    </div>
                  </fieldset>
                </>
              ) : (
                <PackagingImport
                  canEdit={canEdit}
                  result={packagingImport}
                  onChange={(updated) => void rememberPackaging(updated)}
                  onBusy={setImportBusy}
                  sourceFile={packagingFile}
                  onFileChange={setPackagingFile}
                  organisationName={form.legalName}
                  onEditorChange={setEditorOpen}
                />
              )}
            </motion.div>
            {error && (
              <p className="error-message" role="alert">
                {error}
              </p>
            )}
            {!editorOpen && (
              <div className="form-actions onboarding-actions">
                <span>
                  <ShieldCheck size={14} />{" "}
                  {step === 1
                    ? "Missing packaging details can be completed later"
                    : "Details stay here while you move between steps"}
                </span>
                {step > 0 && (
                  <Button
                    type="button"
                    disabled={busy || importBusy || editorOpen}
                    variant="outline"
                    onClick={() => setStep((s) => s - 1)}
                  >
                    <ArrowLeft size={16} /> Back
                  </Button>
                )}
                <Button
                  disabled={busy || importBusy || editorOpen}
                  type="submit"
                >
                  {busy ? (
                    <>
                      <LoaderCircle size={16} className="spin" /> Saving…
                    </>
                  ) : step === 1 ? (
                    editingClient ? (
                      "Save changes"
                    ) : (
                      "Create client"
                    )
                  ) : (
                    <>
                      Next <ArrowRight size={17} />
                    </>
                  )}
                </Button>
              </div>
            )}
          </form>
        </section>
      ) : (
        <section key="client-list" className="panel">
          <div className="panel-heading">
            <div>
              <h3>
                Your clients <span className="count-badge">{list.length}</span>
              </h3>
              <p>Organisation profiles, people and documents in one place.</p>
            </div>
            <div className="search-input">
              <Search size={17} />
              <input
                aria-label="Search clients"
                placeholder="Search name, GST or email…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          {error && (
            <p className="error-message" role="alert">
              {error}
            </p>
          )}
          {loading ? (
            <div className="empty-state">Loading your clients…</div>
          ) : !filtered.length ? (
            <div className="empty-state">
              <Building2 />
              <h3>
                {search
                  ? "No matching clients."
                  : "A new relationship starts here."}
              </h3>
              <p>
                {search
                  ? "Try a different name, GST number or email."
                  : canEdit
                    ? "Create your first organisation profile to get started."
                    : "Your team has not added clients yet."}
              </p>
            </div>
          ) : (
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Organisation</th>
                    <th>GST / role</th>
                    <th>Authorised contact</th>
                    <th>Documents</th>
                    <th>Status</th>
                    {canEdit && <th>Packaging</th>}
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c) => (
                    <tr key={c._id}>
                      <td>
                        <b>{c.legalName || c.company}</b>
                        {c.packagingImport && (
                          <small>
                            {c.packagingImport.summary.total} packaging SKUs
                          </small>
                        )}
                        <small>
                          {c.tradeName || c.industry} · {c.country}
                        </small>
                      </td>
                      <td>
                        {c.gstNumber || "Not provided"}
                        <small>
                          {c.organisationRole || "Role not provided"}
                        </small>
                      </td>
                      <td>
                        {c.authorisedPerson || c.contact}
                        <small>{c.email}</small>
                      </td>
                      <td>
                        {c.packagingImport && (
                          <div className="client-document-links">
                            <a
                              href={`/api/packaging-imports/${c.packagingImport.id}?download=true`}
                              title={c.packagingImport.fileName}
                            >
                              <Download size={13} />
                              {c.packagingImport.fileName}
                            </a>
                          </div>
                        )}
                        {c.documents?.length ? (
                          <div className="client-document-links">
                            {c.documents.map((d, i) => (
                              <a
                                key={i}
                                href={`/api/clients/${c._id}/documents/${i}`}
                                title={d.name}
                              >
                                <Download size={13} />
                                {d.name}
                              </a>
                            ))}
                          </div>
                        ) : (
                          <span className="muted">—</span>
                        )}
                      </td>
                      <td>
                        <span className="status-badge">
                          {c.packagingImport
                            ? "Onboarding"
                            : "Packaging pending"}
                        </span>
                      </td>
                      {canEdit && (
                        <td>
                          {c.packagingImport && (
                            <button
                              type="button"
                              className="import-manage-button"
                              disabled={importBusy}
                              onClick={async () => {
                                setImportBusy(true);
                                try {
                                  const response = await fetch(
                                    `/api/packaging-imports/${c.packagingImport!.id}`,
                                  );
                                  const data = await response.json();
                                  if (!response.ok) throw new Error(data.error);
                                  setManagedImport(data);
                                } catch (failure) {
                                  toast.error((failure as Error).message);
                                } finally {
                                  setImportBusy(false);
                                }
                              }}
                            >
                              Manage packaging <ArrowRight size={14} />
                            </button>
                          )}
                          {!c.packagingImport && (
                            <button
                              type="button"
                              className="import-manage-button"
                              disabled={busy}
                              onClick={() => void editClient(c)}
                            >
                              Add packaging <ArrowRight size={14} />
                            </button>
                          )}
                        </td>
                      )}
                      <td>
                        <div className="client-row-actions">
                          <button
                            type="button"
                            aria-label={`View client ${c.legalName || c.company}`}
                            title="View all client details"
                            disabled={busy || importBusy}
                            onClick={() => void viewClient(c)}
                          >
                            <Eye size={16} />
                          </button>
                          {canEdit && (
                            <button
                              type="button"
                              aria-label={`Edit client ${c.legalName || c.company}`}
                              title="Edit saved client profile"
                              disabled={busy || importBusy}
                              onClick={() => void editClient(c)}
                            >
                              <Pencil size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
      <Modal
        opened={Boolean(viewingClient)}
        onClose={() => setViewingClient(null)}
        title="Client details"
        size="lg"
        centered
      >
        {viewingClient && (
          <div className="client-profile-view">
            <div className="client-profile-heading">
              <Building2 size={28} />
              <div>
                <h3>{viewingClient.legalName || viewingClient.company}</h3>
                <p>{viewingClient.tradeName || "Trade name not provided"}</p>
              </div>
            </div>
            <dl>
              {[
                [
                  "Legal name",
                  viewingClient.legalName || viewingClient.company,
                ],
                ["Trade name", viewingClient.tradeName],
                ["GST number", viewingClient.gstNumber],
                [
                  "Registration / user number",
                  viewingClient.registrationNumber,
                ],
                ["Organisation role", viewingClient.organisationRole],
                ["Registered address", viewingClient.registeredAddress],
                [
                  "Authorised person",
                  viewingClient.authorisedPerson || viewingClient.contact,
                ],
                ["Email", viewingClient.email],
                ["Telephone", viewingClient.telephone],
                ["Country", viewingClient.country],
                ["Industry", viewingClient.industry],
                ["Materials", viewingClient.materials?.join(", ")],
                ["Notes", viewingClient.notes],
                [
                  "Packaging SKUs",
                  viewingClient.packagingImport?.summary.total?.toString(),
                ],
                ["Operator Status", viewingClient.operatorStatus?.join(", ")],
                [
                  "Obligations by Role",
                  viewingClient.obligationsByRole?.join(", "),
                ],
                [
                  "Status",
                  viewingClient.packagingImport
                    ? "Onboarding"
                    : "Packaging pending",
                ],
                ["Packaging file", viewingClient.packagingImport?.fileName],
                [
                  "Plant / entity",
                  viewingClient.packagingImport?.settings?.plant,
                ],
                [
                  "Ready SKUs",
                  viewingClient.packagingImport?.summary.complete?.toString(),
                ],
                [
                  "Incomplete SKUs",
                  viewingClient.packagingImport?.summary.missing?.toString(),
                ],
                [
                  "Validation errors",
                  viewingClient.packagingImport?.summary.errors?.toString(),
                ],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd>{value || "Not provided"}</dd>
                </div>
              ))}
            </dl>
            <h4>Supporting documents</h4>
            <div className="client-document-links">
              {viewingClient.packagingImport && (
                <a
                  href={`/api/packaging-imports/${viewingClient.packagingImport.id}?download=true`}
                >
                  <Download size={14} />
                  {viewingClient.packagingImport.fileName}
                </a>
              )}
              {viewingClient.documents?.map((document, index) => (
                <a
                  key={index}
                  href={`/api/clients/${viewingClient._id}/documents/${index}`}
                >
                  <Download size={14} />
                  {document.name}
                </a>
              ))}
            </div>
            {viewingClient.packagingImport && (
              <p className="client-profile-hint">
                Select Manage packaging in the client list to view every SKU,
                component and photo.
              </p>
            )}
            {canEdit && (
              <Button
                type="button"
                disabled={busy}
                onClick={() => {
                  setViewingClient(null);
                  void editClient(viewingClient);
                }}
              >
                <Pencil size={16} /> Edit client
              </Button>
            )}
          </div>
        )}
      </Modal>
    </>
  );
}

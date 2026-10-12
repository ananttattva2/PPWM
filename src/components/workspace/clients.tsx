"use client";
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Checkbox, Stepper } from "@mantine/core";
import { TextInput, Select, Textarea } from "../ui/floating-fields";
import { motion } from "motion/react";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Plus,
  CheckCircle2,
  Search,
  UploadCloud,
  FileText,
  Trash2,
  ShieldCheck,
  MapPin,
  UserRound,
  Download,
  LoaderCircle,
} from "lucide-react";
import { Button } from "../ui/button";
import {
  companySchema,
  organisationRoles,
  packagingMaterials,
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
  organisationRole?: string;
  authorisedPerson?: string;
  contact: string;
  email: string;
  country: string;
  industry: string;
  materials: string[];
  documents?: { name: string; size: number }[];
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
  industry: "Food & beverage",
  materials: [] as string[],
  notes: "",
};
export default function Clients({ canEdit }: { canEdit: boolean }) {
  const searchParams = useSearchParams();
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
  async function load() {
    try {
      const r = await fetch("/api/clients");
      if (!r.ok) throw new Error("Could not load clients. Please try again.");
      setList(await r.json());
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
  function update(key: keyof typeof initial, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((prev) => ({ ...prev, [key]: "" }));
  }
  function addFiles(incoming: File[]) {
    if (files.length + incoming.length > MAX_DOCUMENTS) {
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
      "Document added. It will be uploaded when you create the client.",
    );
  }
  function next() {
    setError("");
    if (step === 0) {
      const result = companySchema.safeParse(form);
      const errors: Record<string, string> = {};
      if (!result.success)
        for (const issue of result.error.issues) {
          const key = String(issue.path[0]);
          errors[key] ??= issue.message;
        }
      if (!files.length)
        errors.documents = "Upload at least one supporting document.";
      setFieldErrors(errors);
      if (Object.keys(errors).length) {
        toast.error("Please complete the required organisation details.");
        requestAnimationFrame(() =>
          document.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus(),
        );
        return;
      }
    }
    if (step === 1 && !form.materials.length) {
      setFieldErrors({ materials: "Choose at least one packaging material." });
      toast.error("Choose at least one packaging material.");
      return;
    }
    setFieldErrors({});
    setStep((s) => s + 1);
  }
  async function save() {
    if (busy) return;
    setBusy(true);
    setError("");
    const notification = toast.loading(
      "Creating your client and uploading documents…",
    );
    try {
      const data = new FormData();
      data.append("data", JSON.stringify(form));
      files.forEach((f) => data.append("documents", f));
      const r = await fetch("/api/clients", { method: "POST", body: data });
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
      setShow(false);
      setForm(initial);
      setFiles([]);
      setStep(0);
      toast.success("Client created successfully", {
        id: notification,
        description: "Organisation details and supporting documents are saved.",
      });
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
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">A CONNECTED PORTFOLIO</span>
          <h1>Client onboarding</h1>
          <p>Start with the right details. Build a stronger partnership.</p>
        </div>
        {canEdit && !show && (
          <Button
            disabled={busy}
            onClick={() => {
              setShow(true);
              setError("");
            }}
          >
            <Plus size={18} /> New client
          </Button>
        )}
      </div>
      {show ? (
        <section className="panel onboarding-panel">
          <div className="panel-heading">
            <div>
              <h3>New client profile</h3>
              <p>
                Add organisation details and supporting documents to get
                started.
              </p>
            </div>
            <button
              disabled={busy}
              onClick={() => setShow(false)}
              className="text-button"
            >
              Close form
            </button>
          </div>
          <Stepper
            active={step}
            color="orange"
            size="sm"
            allowNextStepsSelect={false}
          >
            <Stepper.Step
              label="Organisation"
              description="Identity & documents"
            />
            <Stepper.Step
              label="Packaging"
              description="Portfolio essentials"
            />
            <Stepper.Step label="Review" description="Check & create" />
          </Stepper>
          <form
            noValidate
            onSubmit={(e) => {
              e.preventDefault();
              if (!busy) void (step === 2 ? save() : next());
            }}
          >
            <motion.div
              key={step}
              initial={{ opacity: 1, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`onboarding-fields ${step === 0 ? "organisation-layout" : ""}`}
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
                      <TextInput
                        label="Registration / user number"
                        placeholder="Additional registration reference (optional)"
                        maxLength={80}
                        value={form.registrationNumber}
                        error={fieldErrors.registrationNumber}
                        onChange={(e) =>
                          update("registrationNumber", e.target.value)
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
                      <span className="document-count">{files.length}/5</span>
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
              ) : step === 1 ? (
                <>
                  <div className="onboarding-intro">
                    <span className="icon-box">
                      <Building2 size={22} />
                    </span>
                    <div>
                      <h3>Tell us about their packaging.</h3>
                      <p>A starting point for your client’s portfolio.</p>
                    </div>
                  </div>
                  <Select
                    label="Industry"
                    data={[
                      "Food & beverage",
                      "Personal care",
                      "Healthcare",
                      "Retail",
                      "Manufacturing",
                      "Other",
                    ]}
                    value={form.industry}
                    onChange={(v) => update("industry", v || "Other")}
                  />
                  <h3 className="materials-heading">
                    Packaging materials <span>*</span>
                  </h3>
                  <Checkbox.Group
                    value={form.materials}
                    onChange={(v) => {
                      setForm({ ...form, materials: v });
                      setFieldErrors({});
                    }}
                    error={fieldErrors.materials}
                  >
                    <div className="material-options">
                      {packagingMaterials.map((m) => (
                        <Checkbox key={m} label={m} value={m} color="orange" />
                      ))}
                    </div>
                  </Checkbox.Group>
                  <Textarea
                    label="Onboarding notes"
                    placeholder="Useful context for your team…"
                    minRows={4}
                    maxLength={2000}
                    value={form.notes}
                    onChange={(e) => update("notes", e.target.value)}
                  />
                </>
              ) : (
                <div className="review-card">
                  <CheckCircle2 />
                  <h2>One last look before we connect.</h2>
                  <p className="muted">
                    Check the information below. Use Back to make changes.
                  </p>
                  <dl>
                    {[
                      ["Legal name", form.legalName],
                      ["Trade name", form.tradeName],
                      ["GST number", form.gstNumber],
                      [
                        "Registration / user number",
                        form.registrationNumber || "Not provided",
                      ],
                      ["Organisation role", form.organisationRole],
                      ["Registered address", form.registeredAddress],
                      ["Email", form.email],
                      ["Telephone", form.telephone],
                      ["Authorised person", form.authorisedPerson],
                      ["Country", form.country],
                      ["Industry", form.industry],
                      ["Materials", form.materials.join(", ")],
                      ["Notes", form.notes || "No notes"],
                    ].map(([k, v]) => (
                      <div key={k}>
                        <dt>{k}</dt>
                        <dd>{v}</dd>
                      </div>
                    ))}
                  </dl>
                  <h3 className="materials-heading">Supporting documents</h3>
                  <div className="review-documents">
                    {files.map((f) => (
                      <div key={`${f.name}-${f.lastModified}`}>
                        <FileText size={17} />
                        <span>{f.name}</span>
                        <small>{(f.size / 1024).toFixed(1)} KB</small>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
            {error && (
              <p className="error-message" role="alert">
                {error}
              </p>
            )}
            <div className="form-actions onboarding-actions">
              <span>
                <ShieldCheck size={14} />{" "}
                {step === 2
                  ? "Ready to save securely"
                  : "Details stay here while you move between steps"}
              </span>
              {step > 0 && (
                <Button
                  type="button"
                  disabled={busy}
                  variant="outline"
                  onClick={() => setStep((s) => s - 1)}
                >
                  <ArrowLeft size={16} /> Back
                </Button>
              )}
              <Button disabled={busy} type="submit">
                {busy ? (
                  <>
                    <LoaderCircle size={16} className="spin" /> Saving…
                  </>
                ) : step === 2 ? (
                  "Create client"
                ) : (
                  <>
                    Next <ArrowRight size={17} />
                  </>
                )}
              </Button>
            </div>
          </form>
        </section>
      ) : (
        <section className="panel">
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
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c) => (
                    <tr key={c._id}>
                      <td>
                        <b>{c.legalName || c.company}</b>
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
                        <span className="status-badge">Onboarding</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </>
  );
}

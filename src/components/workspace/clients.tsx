"use client";
import { useEffect, useState } from "react";
import { TextInput, Select, Textarea, Checkbox, Stepper } from "@mantine/core";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Plus,
  CheckCircle2,
  Search,
} from "lucide-react";
import { Button } from "../ui/button";
const materials = ["Plastic", "Paper & board", "Metal", "Glass", "Other"];
type Client = {
  _id: string;
  company: string;
  contact: string;
  email: string;
  country: string;
  industry: string;
  materials: string[];
  notes: string;
};
const initial = {
  company: "",
  contact: "",
  email: "",
  country: "India",
  industry: "Food & beverage",
  materials: [] as string[],
  notes: "",
};
export default function Clients({ canEdit }: { canEdit: boolean }) {
  const [list, setList] = useState<Client[]>([]);
  const [form, setForm] = useState(initial);
  const [show, setShow] = useState(false);
  const [step, setStep] = useState(0);
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  async function load() {
    try {
      const r = await fetch("/api/clients");
      if (!r.ok) throw new Error("Could not load clients");
      setList(await r.json());
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    void load();
  }, []);
  function next() {
    setError("");
    if (
      step === 0 &&
      (!form.company.trim() ||
        !form.contact.trim() ||
        !/^\S+@\S+\.\S+$/.test(form.email))
    ) {
      setError("Enter a company, contact name and valid email.");
      return;
    }
    if (step === 1 && !form.materials.length) {
      setError("Choose at least one packaging material.");
      return;
    }
    setStep((s) => s + 1);
  }
  async function save() {
    setBusy(true);
    setError("");
    try {
      const r = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!r.ok) throw new Error((await r.json()).error);
      setShow(false);
      setForm(initial);
      setStep(0);
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">A CONNECTED PORTFOLIO</span>
          <h1>Client onboarding</h1>
          <p>A thoughtful start to every client relationship.</p>
        </div>
        {canEdit && (
          <Button
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
              <h3>Let’s get to know your client.</h3>
              <p>Three simple steps. One organised workspace.</p>
            </div>
            <button onClick={() => setShow(false)} className="text-button">
              Cancel
            </button>
          </div>
          <Stepper active={step} color="orange" size="sm">
            <Stepper.Step label="Company" description="The essentials" />
            <Stepper.Step label="Packaging" description="Their portfolio" />
            <Stepper.Step label="Review" description="Ready to connect" />
          </Stepper>
          <div className="onboarding-fields">
            {step === 0 ? (
              <div className="form-grid">
                <TextInput
                  label="Company name"
                  placeholder="e.g. Acme Packaging"
                  required
                  value={form.company}
                  onChange={(e) =>
                    setForm({ ...form, company: e.target.value })
                  }
                />
                <TextInput
                  label="Contact name"
                  required
                  value={form.contact}
                  onChange={(e) =>
                    setForm({ ...form, contact: e.target.value })
                  }
                />
                <TextInput
                  label="Contact email"
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
                <TextInput
                  label="Country"
                  required
                  value={form.country}
                  onChange={(e) =>
                    setForm({ ...form, country: e.target.value })
                  }
                />
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
                  onChange={(v) => setForm({ ...form, industry: v || "Other" })}
                />
              </div>
            ) : step === 1 ? (
              <>
                <h3>What materials are in their portfolio?</h3>
                <p className="muted">
                  Select all that apply. You can capture detailed packaging data
                  later.
                </p>
                <Checkbox.Group
                  value={form.materials}
                  onChange={(v) => setForm({ ...form, materials: v })}
                >
                  <div className="material-options">
                    {materials.map((m) => (
                      <Checkbox key={m} label={m} value={m} color="orange" />
                    ))}
                  </div>
                </Checkbox.Group>
                <Textarea
                  label="Onboarding notes"
                  placeholder="Useful context for your team…"
                  minRows={4}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                />
              </>
            ) : (
              <div className="review-card">
                <CheckCircle2 />
                <h2>Ready for a fresh start.</h2>
                <dl>
                  {[
                    ["Company", form.company],
                    ["Contact", `${form.contact} · ${form.email}`],
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
              </div>
            )}
          </div>
          {error && (
            <p className="error-message" role="alert">
              {error}
            </p>
          )}
          <div className="form-actions">
            {step > 0 && (
              <Button variant="outline" onClick={() => setStep((s) => s - 1)}>
                <ArrowLeft size={16} /> Back
              </Button>
            )}
            <Button
              disabled={busy}
              onClick={() => (step === 2 ? void save() : next())}
            >
              {busy ? "Saving…" : step === 2 ? "Create client" : "Continue"}
              <ArrowRight size={17} />
            </Button>
          </div>
        </section>
      ) : (
        <section className="panel">
          <div className="panel-heading">
            <div>
              <h3>
                Your clients <span className="count-badge">{list.length}</span>
              </h3>
              <p>A shared foundation for your packaging portfolio.</p>
            </div>
            <div className="search-input">
              <Search size={17} />
              <input
                aria-label="Search clients"
                placeholder="Search clients…"
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
          ) : !list.length ? (
            <div className="empty-state">
              <Building2 />
              <h3>A new relationship starts here.</h3>
              <p>
                {canEdit
                  ? "Create your first client to get started."
                  : "Your team has not added clients yet."}
              </p>
            </div>
          ) : (
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Company</th>
                    <th>Contact</th>
                    <th>Industry</th>
                    <th>Country</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {list
                    .filter((c) =>
                      `${c.company} ${c.email}`
                        .toLowerCase()
                        .includes(search.toLowerCase()),
                    )
                    .map((c) => (
                      <tr key={c._id}>
                        <td>
                          <b>{c.company}</b>
                          <small>{c.materials.join(", ")}</small>
                        </td>
                        <td>
                          {c.contact}
                          <small>{c.email}</small>
                        </td>
                        <td>{c.industry}</td>
                        <td>{c.country}</td>
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

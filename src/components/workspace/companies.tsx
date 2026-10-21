"use client";
import { useEffect, useState } from "react";
import { TextInput, Select } from "../ui/floating-fields";
import { Button } from "../ui/button";
import PackagingAccess from "./packaging-access";
import { packagingScopes } from "@/lib/packaging-scopes";
import UserManagement from "./users";
type Company = {
  id: string;
  name: string;
  email: string;
  packagingScopes?: string[];
};
export default function CompanyManagement({
  role,
  actorId,
}: {
  role: string;
  actorId: string;
}) {
  const [defaultScopes, setDefaultScopes] = useState<string[]>([
    ...packagingScopes,
  ]);
  const [companies, setCompanies] = useState<Company[]>([]),
    [selected, setSelected] = useState("");
  const [name, setName] = useState(""),
    [email, setEmail] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  async function load() {
    try {
      const r = await fetch("/api/companies");
      const data = await r.json();
      if (!r.ok) throw new Error(data.error);
      setCompanies(data);
    } catch (e) {
      setError((e as Error).message);
    }
  }
  useEffect(() => {
    void load();
  }, []);
  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!defaultScopes.length) {
      setError("Select at least one packaging type.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const r = await fetch("/api/companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, packagingScopes: defaultScopes }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error);
      await load();
      setSelected(data.id);
      setName("");
      setEmail("");
      setDefaultScopes([...packagingScopes]);
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
          <span className="eyebrow">COMPANIES & ACCESS</span>
          <h1>Company management</h1>
          <p>
            Create a company, then add its users and select their packaging
            access.
          </p>
        </div>
      </div>
      {error && (
        <p role="alert" className="error-message">
          {error}
        </p>
      )}
      <form className="panel user-form" onSubmit={create}>
        <h3>Create company</h3>
        <div className="form-grid">
          <TextInput
            label="Company name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <TextInput
            label="Company email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <PackagingAccess
          value={defaultScopes}
          onChange={setDefaultScopes}
          disabled={busy}
        />
        <p>
          These selections are the default access for new company users. You can
          change them for each user below.
        </p>
        <div className="form-actions">
          <Button type="submit" disabled={busy}>
            {busy ? "Creating…" : "Create company"}
          </Button>
        </div>
      </form>
      <section className="panel user-form">
        <Select
          label="Manage company"
          placeholder="Select a company"
          data={companies.map((c) => ({
            value: c.id,
            label: `${c.name} · ${c.email}`,
          }))}
          value={selected}
          onChange={(v) => setSelected(v || "")}
        />
      </section>
      {selected && (
        <UserManagement
          key={selected}
          role={role}
          actorId={actorId}
          companyId={selected}
          initialPackagingScopes={
            companies.find((company) => company.id === selected)
              ?.packagingScopes
          }
        />
      )}
    </>
  );
}

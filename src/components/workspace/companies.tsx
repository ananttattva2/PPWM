"use client";
import { useEffect, useState } from "react";
import { TextInput, Select } from "../ui/floating-fields";
import { Button } from "../ui/button";
import PackagingAccess from "./packaging-access";
import { packagingScopes } from "@/lib/packaging-scopes";
import styles from "./companies.module.css";
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
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selected, setSelected] = useState("");
  const [email, setEmail] = useState("");
  const [scopes, setScopes] = useState<string[]>([...packagingScopes]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let active = true;
    fetch("/api/companies")
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok)
          throw new Error(data.error || "Unable to load companies");
        if (active) setCompanies(data);
      })
      .catch((error) => {
        if (active) setError((error as Error).message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);
  function chooseCompany(value: string | null) {
    const id = value || "";
    setSelected(id);
    setError("");
    setSuccess("");
    setEmail("");
    setScopes(
      companies.find((company) => company.id === id)?.packagingScopes || [
        ...packagingScopes,
      ],
    );
  }
  async function createUser(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setSuccess("");
    if (!selected) {
      setError("Select a company first.");
      return;
    }
    if (!scopes.length) {
      setError("Select at least one packaging type.");
      return;
    }
    setBusy(true);
    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyId: selected,
          firstName: email.split("@")[0],
          lastName: "Member",
          email,
          role: "user",
          active: true,
          packagingScopes: scopes,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to create user");
      setSuccess(`Access assigned to ${email}.`);
      setEmail("");
      setRevision((value) => value + 1);
    } catch (error) {
      setError((error as Error).message);
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
            Select a company, enter the user’s email and choose their packaging
            roles.
          </p>
        </div>
      </div>
      {error && (
        <p role="alert" className="error-message">
          {error}
        </p>
      )}
      {success && (
        <p role="status" className="permission-note">
          {success}
        </p>
      )}
      <form
        className="panel user-form"
        onSubmit={createUser}
        aria-label="Company access"
      >
        <div className={`form-grid ${styles.fields}`}>
          <Select
            label="Manage company"
            placeholder={loading ? "Loading companies…" : "Select a company"}
            searchable
            required
            disabled={loading || busy}
            data={companies.map((company) => ({
              value: company.id,
              label: `${company.name} · ${company.email}`,
            }))}
            value={selected}
            onChange={chooseCompany}
          />
          <TextInput
            label="User email"
            type="email"
            required
            disabled={busy}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </div>
        <div className={styles.access}>
          <PackagingAccess
            label="Packaging roles"
            value={scopes}
            onChange={setScopes}
            disabled={busy}
          />
        </div>
        <div className="form-actions">
          <Button type="submit" disabled={!selected || busy}>
            {busy ? "Creating…" : "Create user"}
          </Button>
        </div>
        {!loading && !companies.length && (
          <p>
            No companies available. Add a company through Client onboarding
            first.
          </p>
        )}
      </form>
      {selected && (
        <section className={styles.team} aria-label="Company users">
          <UserManagement
            key={`${selected}-${revision}`}
            role={role}
            actorId={actorId}
            companyId={selected}
            allowCreate={false}
          />
        </section>
      )}
    </>
  );
}

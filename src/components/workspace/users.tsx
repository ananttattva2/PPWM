"use client";
import { useEffect, useState } from "react";
import PackagingAccess from "./packaging-access";
import { MultiSelect } from "@mantine/core";
import { packagingScopeOptions, packagingScopes } from "@/lib/packaging-scopes";
import { Switch } from "@mantine/core";
import { TextInput, PasswordInput, Select } from "../ui/floating-fields";
import { Avatar } from "@heroui/react";
import { Plus, Users, Search, ShieldCheck } from "lucide-react";
import { Button } from "../ui/button";
type User = {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  image?: string;
  role: string;
  companyId?: string;
  packagingScopes?: string[];
  active: boolean;
};
const initial = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  role: "user",
  active: true,
  packagingScopes: [...packagingScopes] as string[],
};
export default function UserManagement({
  role,
  actorId,
  companyId,
  initialPackagingScopes,
}: {
  role: string;
  actorId: string;
  companyId?: string;
  initialPackagingScopes?: string[];
}) {
  const [users, setUsers] = useState<User[]>([]);
  const companyInitial = {
    ...initial,
    packagingScopes: initialPackagingScopes || initial.packagingScopes,
  };
  const [form, setForm] = useState(companyInitial);
  const [show, setShow] = useState(Boolean(companyId));
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const options = [
    { value: "user", label: "User" },
    { value: "supplier", label: "Supplier" },
    { value: "manager", label: "Manager" },
    { value: "compliance", label: "Compliance" },
    ...(role === "super_admin"
      ? [
          { value: "admin", label: "Admin" },
          { value: "super_admin", label: "Super admin" },
        ]
      : []),
  ];
  async function load() {
    try {
      const r = await fetch("/api/users");
      if (!r.ok) throw new Error("Unable to load users");
      const loaded: User[] = await r.json();
      setUsers(
        companyId
          ? loaded.filter((user) => user.companyId === companyId)
          : loaded,
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    void load();
  }, []);
  async function create(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (companyId && !form.packagingScopes.length) {
      setError("Select at least one packaging type.");
      return;
    }
    setBusy(true);
    try {
      const r = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          packagingScopes: companyId ? form.packagingScopes : undefined,
          ...(companyId
            ? {
                companyId,
                firstName: form.firstName || form.email.split("@")[0],
                lastName: form.lastName || "Member",
                password: undefined,
              }
            : {}),
        }),
      });
      if (!r.ok) throw new Error((await r.json()).error);
      setShow(Boolean(companyId));
      setForm(companyInitial);
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function update(u: User, changes: Partial<User>) {
    setBusy(true);
    setError("");
    try {
      const r = await fetch("/api/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: u.id,
          role: u.role,
          active: u.active !== false,
          ...changes,
        }),
      });
      if (!r.ok) throw new Error((await r.json()).error);
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
          <span className="eyebrow">PEOPLE WITH PURPOSE</span>
          <h1>{companyId ? "Company users" : "User management"}</h1>
          <p>The right people. The right access. A better-connected team.</p>
        </div>
        <Button onClick={() => setShow(!show)}>
          <Plus size={17} />{" "}
          {companyId
            ? show
              ? "Hide user form"
              : "Add company user"
            : "Add team member"}
        </Button>
      </div>
      <div className="permission-note">
        <ShieldCheck size={18} />{" "}
        {role === "super_admin"
          ? "You can manage every workspace role."
          : "You can manage user, supplier, manager and compliance roles."}
      </div>
      {error && (
        <p className="error-message" role="alert">
          {error}
        </p>
      )}
      {show && (
        <form className="panel user-form" onSubmit={(e) => void create(e)}>
          <div className="panel-heading">
            <h3>
              {companyId
                ? "Add company user"
                : "A new perspective for your team."}
            </h3>
            <button
              className="text-button"
              type="button"
              onClick={() => setShow(false)}
            >
              Cancel
            </button>
          </div>
          <div className="form-grid">
            {!companyId && (
              <>
                <TextInput
                  label="First name"
                  required
                  value={form.firstName}
                  onChange={(e) =>
                    setForm({ ...form, firstName: e.target.value })
                  }
                />
                <TextInput
                  label="Last name"
                  required
                  value={form.lastName}
                  onChange={(e) =>
                    setForm({ ...form, lastName: e.target.value })
                  }
                />
              </>
            )}
            <TextInput
              type="email"
              label="Email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            {!companyId && (
              <PasswordInput
                label="Initial password"
                description="At least 12 characters. OTP remains the primary sign-in method."
                required
                minLength={12}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            )}
            <Select
              label="Role"
              data={options}
              value={form.role}
              onChange={(v) => setForm({ ...form, role: v || "user" })}
            />
            {companyId && (
              <PackagingAccess
                value={form.packagingScopes}
                disabled={busy}
                onChange={(packagingScopes) =>
                  setForm({ ...form, packagingScopes })
                }
              />
            )}
            <Switch
              label="Active account"
              color="orange"
              checked={form.active}
              onChange={(e) =>
                setForm({ ...form, active: e.currentTarget.checked })
              }
            />
          </div>
          <div className="form-actions">
            <Button disabled={busy} type="submit">
              {busy ? "Creating…" : "Create team member"}
            </Button>
          </div>
        </form>
      )}
      <section className="panel">
        <div className="panel-heading">
          <div>
            <h3>
              Your team <span className="count-badge">{users.length}</span>
            </h3>
            <p>Manage roles and account access.</p>
          </div>
          <div className="search-input">
            <Search size={17} />
            <input
              aria-label="Search users"
              placeholder="Search people…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        {loading ? (
          <div className="empty-state">Loading your team…</div>
        ) : !users.length ? (
          <div className="empty-state">
            <Users />
            <h3>Bring your team together.</h3>
          </div>
        ) : (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Team member</th>
                  <th>Email</th>
                  <th>Role</th>
                  {companyId && <th>Packaging access</th>}
                  <th>Account status</th>
                </tr>
              </thead>
              <tbody>
                {users
                  .filter((u) =>
                    `${u.name} ${u.email}`
                      .toLowerCase()
                      .includes(search.toLowerCase()),
                  )
                  .map((u) => {
                    const editable =
                      u.id !== actorId &&
                      (role === "super_admin" ||
                        !["admin", "super_admin"].includes(u.role));
                    return (
                      <tr key={u.id}>
                        <td>
                          <div className="table-person">
                            <Avatar size="sm" name={u.name} src={u.image} />
                            <b>{u.name}</b>
                          </div>
                        </td>
                        <td>{u.email}</td>
                        <td>
                          {editable ? (
                            <Select
                              aria-label={`Role for ${u.name}`}
                              data={options}
                              value={u.role}
                              disabled={busy}
                              onChange={(v) => v && void update(u, { role: v })}
                            />
                          ) : (
                            <span className="role-badge">
                              {u.role.replace("_", " ")}
                            </span>
                          )}
                        </td>
                        {companyId && (
                          <td>
                            <MultiSelect
                              aria-label={`Packaging access for ${u.name}`}
                              data={packagingScopeOptions}
                              value={u.packagingScopes || [...packagingScopes]}
                              disabled={!editable || busy}
                              onChange={(values) => {
                                if (values.length)
                                  void update(u, { packagingScopes: values });
                              }}
                            />
                          </td>
                        )}
                        <td>
                          <Switch
                            aria-label={`Active status for ${u.name}`}
                            label={u.active !== false ? "Active" : "Inactive"}
                            checked={u.active !== false}
                            color="teal"
                            disabled={!editable || busy}
                            onChange={(e) =>
                              void update(u, {
                                active: e.currentTarget.checked,
                              })
                            }
                          />
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}

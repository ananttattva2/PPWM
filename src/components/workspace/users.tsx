"use client";
import { useEffect, useState } from "react";
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
  active: boolean;
};
const initial = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  role: "user",
  active: true,
};
export default function UserManagement({
  role,
  actorId,
}: {
  role: string;
  actorId: string;
}) {
  const [users, setUsers] = useState<User[]>([]);
  const [form, setForm] = useState(initial);
  const [show, setShow] = useState(false);
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
      setUsers(await r.json());
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
    setBusy(true);
    try {
      const r = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!r.ok) throw new Error((await r.json()).error);
      setShow(false);
      setForm(initial);
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
          <h1>User management</h1>
          <p>The right people. The right access. A better-connected team.</p>
        </div>
        <Button onClick={() => setShow(!show)}>
          <Plus size={17} /> Add team member
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
            <h3>A new perspective for your team.</h3>
            <button
              className="text-button"
              type="button"
              onClick={() => setShow(false)}
            >
              Cancel
            </button>
          </div>
          <div className="form-grid">
            <TextInput
              label="First name"
              required
              value={form.firstName}
              onChange={(e) => setForm({ ...form, firstName: e.target.value })}
            />
            <TextInput
              label="Last name"
              required
              value={form.lastName}
              onChange={(e) => setForm({ ...form, lastName: e.target.value })}
            />
            <TextInput
              type="email"
              label="Email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            <PasswordInput
              label="Initial password"
              description="At least 12 characters. OTP remains the primary sign-in method."
              required
              minLength={12}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
            <Select
              label="Role"
              data={options}
              value={form.role}
              onChange={(v) => setForm({ ...form, role: v || "user" })}
            />
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

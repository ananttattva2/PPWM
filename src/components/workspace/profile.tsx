"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { TextInput, PasswordInput } from "../ui/floating-fields";
import { Avatar } from "@heroui/react";
import { Camera, ShieldCheck, Save } from "lucide-react";
import { Button } from "../ui/button";
import type { WorkspaceUser } from "./shell";
import { authClient } from "@/lib/auth-client";
export default function Profile({ user }: { user: WorkspaceUser }) {
  const [firstName, setFirst] = useState(
    user.firstName || user.name.split(" ")[0],
  );
  const [lastName, setLast] = useState(
    user.lastName || user.name.split(" ").slice(1).join(" "),
  );
  const [image, setImage] = useState(user.image);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);
  const [reset, setReset] = useState(false);
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();
  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      const r = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName, lastName, image }),
      });
      if (!r.ok) throw new Error((await r.json()).error);
      setSuccess("Your profile has been updated.");
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function upload(file?: File) {
    if (!file) return;
    if (
      !["image/png", "image/jpeg", "image/webp"].includes(file.type) ||
      file.size > 1000000
    ) {
      setError("Choose a PNG, JPEG or WebP image smaller than 1 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setImage(reader.result as string);
    reader.readAsDataURL(file);
  }
  async function passwordAction() {
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      const result = reset
        ? await authClient.emailOtp.resetPassword({
            email: user.email,
            otp: code,
            password,
          })
        : await authClient.emailOtp.requestPasswordReset({ email: user.email });
      if (result.error)
        throw new Error(result.error.message || "Request failed");
      if (reset) {
        setReset(false);
        setPassword("");
        setCode("");
        setSuccess("Password updated.");
      } else {
        setReset(true);
        setSuccess("A password verification code has been sent to your email.");
      }
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
          <span className="eyebrow">A LITTLE MORE YOU</span>
          <h1>My profile</h1>
          <p>Make this workspace feel like your own.</p>
        </div>
      </div>
      {error && (
        <p className="error-message" role="alert">
          {error}
        </p>
      )}
      {success && (
        <p className="success-message" role="status">
          {success}
        </p>
      )}
      <div className="profile-grid">
        <section className="panel profile-summary">
          <Avatar
            src={image || undefined}
            name={user.name}
            className="profile-avatar"
          />
          <h2>{user.name}</h2>
          <p>{user.email}</p>
          <span className="role-badge">{user.role.replace("_", " ")}</span>
          <label className="upload-button">
            <Camera size={17} /> Change profile photo
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(e) => void upload(e.target.files?.[0])}
            />
          </label>
          <small>PNG, JPEG or WebP · up to 1 MB</small>
          <div className="profile-secure">
            <ShieldCheck /> Your access is managed by your administrator.
          </div>
        </section>
        <div>
          <form className="panel profile-form" onSubmit={(e) => void save(e)}>
            <div className="panel-heading">
              <div>
                <h3>Personal information</h3>
                <p>Your details, up to date.</p>
              </div>
            </div>
            <div className="form-grid">
              <TextInput
                label="First name"
                required
                value={firstName}
                onChange={(e) => setFirst(e.target.value)}
              />
              <TextInput
                label="Last name"
                required
                value={lastName}
                onChange={(e) => setLast(e.target.value)}
              />
              <TextInput
                label="Email address"
                value={user.email}
                readOnly
                description="Ask your administrator to change your account email."
              />
              <TextInput
                label="Workspace role"
                value={user.role.replace("_", " ")}
                readOnly
              />
            </div>
            <div className="form-actions">
              <Button type="submit" disabled={busy}>
                <Save size={17} />
                {busy ? "Saving…" : "Save changes"}
              </Button>
            </div>
          </form>
          <section className="panel password-panel">
            <h3>Account security</h3>
            <p>Use a verified email code to set or reset your password.</p>
            {reset && (
              <div className="form-grid">
                <TextInput
                  label="6-digit email code"
                  required
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                />
                <PasswordInput
                  label="New password"
                  minLength={12}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  description="Minimum 12 characters"
                />
              </div>
            )}
            <Button
              variant="outline"
              disabled={
                busy || (reset && (code.length !== 6 || password.length < 12))
              }
              onClick={() => void passwordAction()}
            >
              {busy
                ? "Please wait…"
                : reset
                  ? "Verify & update password"
                  : "Send password verification code"}
            </Button>
          </section>
        </div>
      </div>
    </>
  );
}

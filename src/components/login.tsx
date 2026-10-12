"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  Mail,
  Leaf,
  LoaderCircle,
} from "lucide-react";
import { OTPInput, REGEXP_ONLY_DIGITS } from "input-otp";
import Brand from "./brand";
import ThemeToggle from "./theme-toggle";
import { Button } from "./ui/button";
import { BorderBeam } from "./magicui/border-beam";
import { authClient } from "@/lib/auth-client";
export default function Login({ portal = "Workspace" }: { portal?: string }) {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const router = useRouter();
  useEffect(() => {
    if (!cooldown) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);
  async function send() {
    setError("");
    setBusy(true);
    try {
      const result = await authClient.emailOtp.sendVerificationOtp({
        email,
        type: "sign-in",
      });
      if (result.error)
        throw new Error(result.error.message || "Could not send code");
      setStep(1);
      setCooldown(60);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Please try again");
    } finally {
      setBusy(false);
    }
  }
  async function verify() {
    setError("");
    setBusy(true);
    try {
      const result = await authClient.signIn.emailOtp({ email, otp });
      if (result.error) throw new Error(result.error.message || "Invalid code");
      router.push("/dashboard");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Please try again");
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="login-page">
      <div className="login-story">
        <Brand light />
        <div className="login-orbits">
          <Leaf />
          <div />
          <div />
        </div>
        <div className="login-story-copy">
          <span className="eyebrow">CLARITY STARTS HERE</span>
          <h1>
            A connected team.
            <br />A brighter tomorrow.
          </h1>
          <p>
            Your packaging data, people and progress.
            <br />
            Together in one thoughtful workspace.
          </p>
          <div>
            <ShieldCheck size={19} /> Secure access. Shared purpose.
          </div>
        </div>
        <small>ANANT TATTVA / PACKAGING SUSTAINABILITY</small>
      </div>
      <div className="login-form-side">
        <div className="login-topbar">
          <Link href="/" className="back-link">
            <ArrowLeft size={16} /> Back to website
          </Link>
          <ThemeToggle />
        </div>
        <div className="login-form-card">
          <div className="icon-box">
            <ShieldCheck size={25} />
          </div>
          <span className="eyebrow">{portal.toUpperCase()} ACCESS</span>
          <h2>{step ? "Check your inbox." : "Welcome back."}</h2>
          <p>
            {step ? (
              <>
                We sent a 6-digit verification code to
                <br />
                <strong>{email}</strong>
              </>
            ) : (
              "Sign in to your packaging compliance workspace."
            )}
          </p>
          <AnimatePresence mode="wait">
            <motion.form
              key={step}
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -15 }}
              onSubmit={(e) => {
                e.preventDefault();
                if (!busy) void (step ? verify() : send());
              }}
            >
              {step ? (
                <>
                  <label>Verification code</label>
                  <OTPInput
                    maxLength={6}
                    value={otp}
                    onChange={setOtp}
                    pattern={REGEXP_ONLY_DIGITS}
                    autoFocus
                    aria-label="Six digit verification code"
                    render={({ slots }) => (
                      <div className="otp-input">
                        {slots.map((s, i) => (
                          <div key={i} className={s.isActive ? "active" : ""}>
                            {s.char ??
                              (s.hasFakeCaret ? (
                                <span className="caret" />
                              ) : (
                                "·"
                              ))}
                          </div>
                        ))}
                      </div>
                    )}
                  />
                  <p className="field-hint">Your code expires in 5 minutes.</p>
                </>
              ) : (
                <>
                  <label htmlFor="email">Work email</label>
                  <div className="input-icon">
                    <Mail size={18} />
                    <input
                      id="email"
                      type="email"
                      autoComplete="email"
                      placeholder="you@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <p className="field-hint">
                    We'll email you a secure, one-time code.
                  </p>
                </>
              )}
              {error && (
                <div className="error-message" role="alert">
                  {error}
                </div>
              )}
              <Button
                disabled={busy || (step === 1 && otp.length !== 6)}
                type="submit"
              >
                {busy ? (
                  <LoaderCircle className="spin" size={18} />
                ) : step ? (
                  "Verify & sign in"
                ) : (
                  "Send verification code"
                )}
                {!busy && <ArrowRight size={18} />}
              </Button>
              {step === 1 && (
                <div className="login-resend">
                  <button
                    type="button"
                    disabled={busy || cooldown > 0}
                    onClick={() => void send()}
                  >
                    {cooldown ? `Resend in ${cooldown}s` : "Resend code"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setStep(0);
                      setOtp("");
                      setError("");
                    }}
                  >
                    Change email
                  </button>
                </div>
              )}
            </motion.form>
          </AnimatePresence>
          <div className="secure-note">
            <ShieldCheck size={14} /> Encrypted connection · Email verification
          </div>
          <BorderBeam
            size={90}
            duration={10}
            colorFrom="#ff7a00"
            colorTo="#ffd1aa"
          />
        </div>
        <div className="login-footer">
          <span>
            Need access?{" "}
            <a href="mailto:crm@ananttattva.com">Contact your administrator</a>
          </span>
          <div>
            <Link href="/login">User</Link>
            <Link href="/admin/login">Admin</Link>
            <Link href="/super-admin/login">Super admin</Link>
          </div>
        </div>
      </div>
    </main>
  );
}

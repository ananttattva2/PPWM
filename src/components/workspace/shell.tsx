"use client";
import Link from "next/link";
import Image from "next/image";
import ThemeToggle from "../theme-toggle";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Home,
  UserPlus,
  Users,
  UserRound,
  LogOut,
  Leaf,
  Menu,
  X,
  Search,
  ChevronDown,
  HelpCircle,
  ShieldCheck,
  ArrowUpRight,
  PanelLeftClose,
  PanelLeftOpen,
  ScanLine,
} from "lucide-react";
import { Avatar } from "@heroui/react";
import { toast } from "sonner";
import Brand from "../brand";
import { authClient } from "@/lib/auth-client";
export type WorkspaceUser = {
  id: string;
  name: string;
  email: string;
  image: string;
  role: string;
  firstName: string;
  lastName: string;
};
export default function Shell({
  children,
  user,
}: {
  children: React.ReactNode;
  user: WorkspaceUser;
}) {
  const path = usePathname(),
    router = useRouter();
  const [open, setOpen] = useState(false),
    [query, setQuery] = useState(""),
    [signingOut, setSigningOut] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem("ppwm.sidebar-collapsed") === "true");
    } catch {}
  }, []);
  function toggleSidebar() {
    setCollapsed((value) => {
      const next = !value;
      try {
        localStorage.setItem("ppwm.sidebar-collapsed", String(next));
      } catch {}
      return next;
    });
  }
  const privileged = ["admin", "super_admin"].includes(user.role);
  const supplier = user.role === "supplier";
  const groups = [
    {
      label: "Workspace",
      items: supplier
        ? [{ url: "/dashboard/supplier", label: "My components", icon: Leaf }]
        : [
            { url: "/dashboard", label: "Home", icon: Home },
            {
              url: "/dashboard/clients",
              label: "Client onboarding",
              icon: UserPlus,
            },
            {
              url: "/dashboard/sku-analysis",
              label: "SKU Analyse",
              icon: ScanLine,
            },
          ],
    },
    {
      label: "Team & account",
      items: [
        ...(privileged
          ? [{ url: "/dashboard/users", label: "User management", icon: Users }]
          : []),
        { url: "/dashboard/profile", label: "My profile", icon: UserRound },
      ],
    },
  ];
  const isActive = (url: string) =>
    path === url ||
    (url === "/dashboard/sku-analysis" &&
      path.startsWith("/dashboard/packaging/"));
  const current =
    groups.flatMap((g) => g.items).find((n) => isActive(n.url))?.label ||
    "Workspace";
  useEffect(() => {
    if (!open) return;
    const close = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [open]);
  async function signOut() {
    setSigningOut(true);
    try {
      const result = await authClient.signOut();
      if (result.error)
        throw new Error("Could not sign out. Please try again.");
      router.push("/login");
      router.refresh();
    } catch (e) {
      toast.error((e as Error).message);
      setSigningOut(false);
    }
  }
  return (
    <div className={`workspace ${collapsed ? "sidebar-collapsed" : ""}`}>
      {open && (
        <button
          className="sidebar-backdrop"
          aria-label="Close navigation overlay"
          onClick={() => setOpen(false)}
        />
      )}
      <aside className={`sidebar ${open ? "sidebar-open" : ""}`}>
        <div className="sidebar-brand">
          <div className="sidebar-logo-full">
            <Brand />
          </div>
          <Link
            href="/"
            className="sidebar-logo-mark"
            aria-label="Anant Tattva home"
          >
            <Image
              src="/brand/anant-tattva-mark.svg"
              alt=""
              width={100}
              height={90}
            />
          </Link>
          <small>SUSTAINABILITY FOR A CLEARER TOMORROW</small>
        </div>
        <button
          className="mobile-menu sidebar-close"
          onClick={() => setOpen(false)}
          aria-label="Close sidebar"
        >
          <X size={19} />
        </button>
        <nav aria-label="Workspace navigation">
          {groups.map((group) => (
            <div className="sidebar-group" key={group.label}>
              <div className="workspace-label">{group.label}</div>
              {group.items.map(({ url, label, icon: Icon }) => (
                <Link
                  key={url}
                  href={url}
                  onClick={() => setOpen(false)}
                  className={isActive(url) ? "active" : ""}
                  aria-current={isActive(url) ? "page" : undefined}
                  aria-label={label}
                  title={collapsed ? label : undefined}
                >
                  <Icon size={17} />
                  <span>{label}</span>
                  {isActive(url) && <span className="nav-active-dot" />}
                </Link>
              ))}
            </div>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-tip">
            <div className="tip-leaf">
              <Leaf size={22} />
            </div>
            <div>
              <b>
                Less complexity.
                <br />
                More possibility.
              </b>
              <p>One connected, greener workspace.</p>
            </div>
          </div>
          <div className="sidebar-user">
            <span className="sidebar-secure">
              <ShieldCheck size={14} />
            </span>
            <div>
              <b>Secure workspace</b>
              <small>Access: {user.role.replace("_", " ")}</small>
            </div>
            <button
              aria-label="Sign out"
              title="Sign out"
              disabled={signingOut}
              onClick={() => void signOut()}
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>
      <div className="workspace-main">
        <header className="workspace-header">
          <button
            type="button"
            className="sidebar-collapse-toggle"
            onClick={toggleSidebar}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-expanded={!collapsed}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <PanelLeftOpen size={19} />
            ) : (
              <PanelLeftClose size={19} />
            )}
          </button>
          <button
            className="mobile-menu"
            aria-label="Open sidebar"
            aria-expanded={open}
            onClick={() => setOpen(true)}
          >
            <Menu size={20} />
          </button>
          {!supplier && (
            <form
              className="workspace-search"
              role="search"
              onSubmit={(e) => {
                e.preventDefault();
                router.push(
                  `/dashboard/clients?q=${encodeURIComponent(query.trim())}`,
                );
              }}
            >
              <Search size={15} />
              <input
                aria-label="Search workspace clients"
                placeholder="Search clients, GST or email…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <kbd>↵</kbd>
            </form>
          )}
          <div className="header-workspace-badge">
            <span className="green-dot" /> Workspace
          </div>
          <ThemeToggle />
          <a
            className="header-help"
            href="mailto:crm@ananttattva.com?subject=Workspace%20support"
            aria-label="Contact workspace support"
            title="Contact support"
          >
            <HelpCircle size={18} />
          </a>
          <details className="header-account">
            <summary>
              <Avatar
                name={user.name}
                src={user.image || undefined}
                size="sm"
                className="header-avatar"
              />
              <span>
                <b>{user.name}</b>
                <small>{user.role.replace("_", " ")}</small>
              </span>
              <ChevronDown size={14} />
            </summary>
            <div className="account-menu">
              <span>{user.email}</span>
              <Link href="/dashboard/profile">
                <UserRound size={15} />
                My profile
                <ArrowUpRight size={13} />
              </Link>
              <button disabled={signingOut} onClick={() => void signOut()}>
                <LogOut size={15} />
                {signingOut ? "Signing out…" : "Sign out"}
              </button>
            </div>
          </details>
        </header>
        <div className="workspace-content">
          <div className="workspace-context">
            <span>
              Workspace <span>/</span> <b>{current}</b>
            </span>
            <span className="context-status">
              <ShieldCheck size={12} /> Secure access
            </span>
          </div>
          {children}
        </div>
        <footer className="workspace-footer">
          ANANT TATTVA <span>Connected data. Clearer decisions.</span>
        </footer>
      </div>
    </div>
  );
}

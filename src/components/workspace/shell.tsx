"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
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
} from "lucide-react";
import { Avatar } from "@heroui/react";
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
  const path = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const nav = [
    ["/dashboard", "Home", Home],
    ["/dashboard/clients", "Client onboarding", UserPlus],
    ...(["admin", "super_admin"].includes(user.role)
      ? [["/dashboard/users", "User management", Users]]
      : []),
    ["/dashboard/profile", "My profile", UserRound],
  ];
  return (
    <div className="workspace">
      <aside className={`sidebar ${open ? "sidebar-open" : ""}`}>
        <Brand />
        <button
          className="mobile-menu"
          onClick={() => setOpen(false)}
          aria-label="Close sidebar"
        >
          <X />
        </button>
        <div className="workspace-label">YOUR WORKSPACE</div>
        <nav>
          {nav.map(([url, label, Icon]) => {
            const I = Icon as typeof Home;
            return (
              <Link
                key={url as string}
                href={url as string}
                onClick={() => setOpen(false)}
                className={path === url ? "active" : ""}
              >
                <I size={19} />
                {label as string}
              </Link>
            );
          })}
        </nav>
        <div className="sidebar-tip">
          <Leaf />
          <b>Progress with purpose.</b>
          <p>A clearer picture begins with organised information.</p>
        </div>
        <div className="sidebar-user">
          <Avatar name={user.name} src={user.image || undefined} size="sm" />
          <div>
            <b>{user.name}</b>
            <small>{user.role.replace("_", " ")}</small>
          </div>
          <button
            aria-label="Sign out"
            onClick={async () => {
              await authClient.signOut();
              router.push("/login");
              router.refresh();
            }}
          >
            <LogOut size={18} />
          </button>
        </div>
      </aside>
      <div className="workspace-main">
        <header className="workspace-header">
          <button
            className="mobile-menu"
            aria-label="Open sidebar"
            onClick={() => setOpen(true)}
          >
            <Menu />
          </button>
          <div className="breadcrumb">
            Workspace <span>/</span>{" "}
            <b>{nav.find((n) => n[0] === path)?.[1] as string}</b>
          </div>
          <Link href="/dashboard/clients" className="header-shortcut">
            <Search size={16} /> Explore your clients
          </Link>
          <Link href="/dashboard/profile">
            <Avatar name={user.name} src={user.image || undefined} size="sm" />
          </Link>
        </header>
        <div className="workspace-content">{children}</div>
        <footer className="workspace-footer">
          ANANT TATTVA <span>Connected data. Clearer decisions.</span>
        </footer>
      </div>
    </div>
  );
}

"use client";
import Link from "next/link";
import { motion } from "motion/react";
import {
  ArrowRight,
  ArrowUpRight,
  Users,
  UserPlus,
  Leaf,
  CheckCircle2,
  Building2,
} from "lucide-react";
import { Progress, RingProgress } from "@mantine/core";
import { Button } from "../ui/button";
type Client = {
  _id: string;
  company: string;
  country: string;
  status: string;
  materials: string[];
};
export default function Dashboard({
  name,
  count,
  team,
  clients,
}: {
  name: string;
  count: number;
  team: number;
  clients: Client[];
}) {
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">YOUR BIGGER PICTURE</span>
          <h1>
            Hello, {name.split(" ")[0]} <span className="wave">✦</span>
          </h1>
          <p>Here’s what’s happening in your packaging workspace.</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/clients">
            Onboard a client <UserPlus size={17} />
          </Link>
        </Button>
      </div>
      <motion.div
        initial={{ opacity: 1, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="welcome-banner"
      >
        <div>
          <span>
            <Leaf size={15} /> A LITTLE CLARITY GOES A LONG WAY
          </span>
          <h2>
            Better information.
            <br />
            Better possibilities.
          </h2>
          <p>
            Build your foundation for a more sustainable packaging portfolio.
          </p>
          <Link href="/dashboard/clients">
            Take the next step <ArrowRight size={17} />
          </Link>
        </div>
        <div className="banner-leaf">
          <Leaf strokeWidth={0.8} />
        </div>
      </motion.div>
      <div className="stats-grid">
        {[
          [Building2, "Total clients", count, "Your connected organisations"],
          [Users, "Active team members", team, "People moving things forward"],
          [
            UserPlus,
            "Recent onboardings",
            clients.length,
            "Latest clients in your workspace",
          ],
        ].map(([Icon, label, note, hint]) => {
          const I = Icon as typeof Leaf;
          return (
            <div className="stat-card" key={label as string}>
              <span className="icon-box">
                <I size={20} />
              </span>
              <small>{label as string}</small>
              <strong>{note as number}</strong>
              <p>{hint as string}</p>
            </div>
          );
        })}
      </div>
      <div className="dashboard-grid">
        <section className="panel">
          <div className="panel-heading">
            <div>
              <h3>Recent clients</h3>
              <p>The latest additions to your portfolio.</p>
            </div>
            <Link href="/dashboard/clients">
              View all <ArrowUpRight size={16} />
            </Link>
          </div>
          {clients.length ? (
            <div className="client-list">
              {clients.map((c) => (
                <div key={c._id}>
                  <span className="company-avatar">
                    {c.company.slice(0, 2).toUpperCase()}
                  </span>
                  <div>
                    <b>{c.company}</b>
                    <small>
                      {c.country} · {c.materials.join(", ")}
                    </small>
                  </div>
                  <span className="status-badge">Onboarding</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <Building2 />
              <h3>Your portfolio starts here.</h3>
              <p>
                Onboard your first client and bring their packaging information
                together.
              </p>
              <Button asChild variant="outline">
                <Link href="/dashboard/clients">
                  Add your first client <ArrowRight size={16} />
                </Link>
              </Button>
            </div>
          )}
        </section>
        <section className="panel getting-started">
          <div className="panel-heading">
            <div>
              <h3>Make yourself at home</h3>
              <p>Your next steps, made simple.</p>
            </div>
          </div>
          <RingProgress
            size={130}
            thickness={9}
            sections={[{ value: count ? 100 : 33, color: "orange" }]}
            label={
              <div className="ring-label">
                {count ? "3/3" : "1/3"}
                <small>steps started</small>
              </div>
            }
          />
          <Progress value={count ? 100 : 33} color="orange" size="xs" />
          {[
            ["Securely sign in", "/dashboard", true],
            ["Complete your profile", "/dashboard/profile", false],
            ["Onboard your first client", "/dashboard/clients", count > 0],
          ].map(([label, url, done]) => (
            <Link key={label as string} href={url as string}>
              <CheckCircle2 size={19} className={done ? "done" : ""} />
              {label as string}
              <ArrowUpRight size={15} />
            </Link>
          ))}
        </section>
      </div>
    </>
  );
}

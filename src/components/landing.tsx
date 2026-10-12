"use client";
import Link from "next/link";
import { useState } from "react";
import { motion } from "motion/react";
import {
  ArrowRight,
  ArrowUpRight,
  Leaf,
  Database,
  FileCheck2,
  Recycle,
  Layers3,
  ShieldCheck,
  ChartNoAxesCombined,
  Globe2,
  Check,
  Menu,
  X,
  Package,
  FlaskConical,
} from "lucide-react";
import Brand from "./brand";
import ThemeToggle from "./theme-toggle";
import { Button } from "./ui/button";
import { BorderBeam } from "./magicui/border-beam";
import { Spotlight } from "./ui/spotlight";
import SplitText from "./reactbits/SplitText";
const fade = {
  initial: { opacity: 1, y: 25 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.65 },
};
export function ProductPreview() {
  return (
    <div className="product-preview">
      <div className="mini-sidebar">
        <span className="mini-logo">
          A<span>T</span>
        </span>
        {[Layers3, Package, Recycle, FileCheck2, ChartNoAxesCombined].map(
          (Icon, i) => (
            <div key={i} className={i === 0 ? "selected" : ""}>
              <Icon size={18} />
            </div>
          ),
        )}
      </div>
      <div className="mini-main">
        <div className="mini-top">
          <span>Workspace overview</span>
          <span className="mini-avatar">AT</span>
        </div>
        <div className="preview-title">
          A clearer view.
          <br />
          <strong>A greener future.</strong>
        </div>
        <div className="mini-stats">
          <div>
            <small>Packaging components</small>
            <b>3,860</b>
            <em>↑ 18% this month</em>
          </div>
          <div>
            <small>Compliance readiness</small>
            <b>
              92<span>%</span>
            </b>
            <em>↑ 5% this month</em>
          </div>
        </div>
        <div className="mini-charts">
          <div>
            <strong>Material distribution</strong>
            <div className="donut">
              <span>
                3,860<small>components</small>
              </span>
            </div>
            <div className="legend">
              <i /> Plastic <i /> Paper <i /> Metal
            </div>
          </div>
          <div>
            <strong>Compliance progress</strong>
            {[
              ["EPR reporting", 92],
              ["Recyclability", 78],
              ["PPWR readiness", 65],
            ].map(([s, n]) => (
              <div className="mini-progress" key={s}>
                <p>
                  {s}
                  <b>{n}%</b>
                </p>
                <div>
                  <span style={{ width: `${n}%` }} />
                </div>
              </div>
            ))}
            <span className="mini-note">
              <ShieldCheck size={14} /> All your data. One workspace.
            </span>
          </div>
        </div>
        <small className="demo-label">Illustrative product preview</small>
      </div>
    </div>
  );
}
export default function Landing() {
  const [menu, setMenu] = useState(false);
  return (
    <main className="landing">
      <nav className="marketing-nav">
        <Brand />
        <button
          className="mobile-menu"
          onClick={() => setMenu(!menu)}
          aria-label="Toggle navigation"
        >
          {menu ? <X /> : <Menu />}
        </button>
        <div className={`nav-links ${menu ? "open" : ""}`}>
          <a href="#platform" onClick={() => setMenu(false)}>
            Platform
          </a>
          <a href="#solutions" onClick={() => setMenu(false)}>
            Solutions
          </a>
          <a href="#about" onClick={() => setMenu(false)}>
            Our approach
          </a>
          <a href="#contact" onClick={() => setMenu(false)}>
            Contact
          </a>
        </div>
        <div className="nav-actions">
          <ThemeToggle />
          <Button asChild variant="outline">
            <Link href="/login">Sign in</Link>
          </Button>
          <Button asChild>
            <a href="mailto:crm@ananttattva.com?subject=PPWM%20Demo">
              Book a demo <ArrowUpRight size={17} />
            </a>
          </Button>
        </div>
      </nav>
      <section className="hero">
        <Spotlight className="hero-spotlight" fill="#ffb26b" />
        <div className="hero-grid">
          <div className="hero-copy">
            <motion.div {...fade} className="eyebrow">
              <Leaf size={14} /> PACKAGING SUSTAINABILITY, CONNECTED
            </motion.div>
            <h1>
              <SplitText
                text="Less complexity."
                tag="span"
                textAlign="left"
                delay={25}
              />
              <br />
              <span>More possibility.</span>
            </h1>
            <motion.p {...fade}>
              Bring clarity to your packaging compliance.
              <br />
              One connected platform for your data, your team,
              <br className="desktop-break" /> and a more sustainable tomorrow.
            </motion.p>
            <motion.div {...fade} className="hero-actions">
              <Button asChild>
                <a href="mailto:crm@ananttattva.com?subject=PPWM%20Demo">
                  Explore with a demo <ArrowRight size={19} />
                </a>
              </Button>
              <Button asChild variant="outline">
                <a href="#platform">Discover the platform</a>
              </Button>
            </motion.div>
            <div className="hero-trust">
              <span>
                <ShieldCheck size={17} /> Built for compliance
              </span>
              <span>
                <Globe2 size={17} /> Designed for a global world
              </span>
            </div>
          </div>
          <motion.div {...fade} className="hero-visual">
            <div className="orbit orbit-one" />
            <div className="orbit orbit-two" />
            <div className="floating-pill pill-one">
              <Leaf size={17} /> Sustainability starts here
            </div>
            <ProductPreview />
            <div className="floating-pill pill-two">
              <span className="green-dot" /> Connected. Organised. Ready.
            </div>
            <BorderBeam
              size={130}
              duration={12}
              colorFrom="#ff7a00"
              colorTo="#11bda2"
            />
          </motion.div>
        </div>
        <div className="hero-bottom">
          <span>YOUR PACKAGING. A BIGGER PICTURE.</span>
          <div>
            PPWR <i /> EPR reporting <i /> Recyclability <i /> Portfolio
            visibility
          </div>
          <a href="#platform" aria-label="Explore platform">
            ↓
          </a>
        </div>
      </section>
      <section className="benefit-strip">
        {[
          [ShieldCheck, "Reduce compliance risk", "Make room for confidence."],
          [FileCheck2, "Simplify your reporting", "Bring your data together."],
          [
            Recycle,
            "Improve recyclability",
            "See the opportunity in every material.",
          ],
          [
            ChartNoAxesCombined,
            "Get the complete picture",
            "From components to your portfolio.",
          ],
        ].map(([Icon, title, desc], i) => {
          const I = Icon as typeof Leaf;
          return (
            <div key={i}>
              <span className="icon-box">
                <I size={24} />
              </span>
              <div>
                <h3>{title as string}</h3>
                <p>{desc as string}</p>
              </div>
            </div>
          );
        })}
      </section>
      <section className="section platform-section" id="platform">
        <motion.div {...fade} className="section-heading">
          <div className="eyebrow">
            <Leaf size={14} /> THE PLATFORM
          </div>
          <h2>
            Everything connects.
            <br />
            <span>Compliance gets simpler.</span>
          </h2>
          <p>
            Move from scattered spreadsheets to an organised packaging
            workspace.
            <br />
            Turn the information you have into the clarity you need.
          </p>
        </motion.div>
        <div className="platform-grid">
          <motion.div {...fade} className="flow-diagram">
            <div className="flow-source">
              <Layers3 />
              <b>Your packaging data</b>
              <div>
                <span>Materials</span>
                <span>Components</span>
                <span>Weights</span>
              </div>
            </div>
            <div className="flow-lines">
              ↓ <span>↓</span> ↓
            </div>
            <div className="flow-core">
              <Leaf size={35} />
              <strong>PPWM</strong>
              <small>Compliance made simple</small>
            </div>
            <div className="flow-lines">
              ↓ <span>↓</span> ↓
            </div>
            <div className="flow-source">
              <Globe2 />
              <b>A world of requirements</b>
              <div>
                <span>PPWR</span>
                <span>EPR</span>
                <span>Recyclability</span>
              </div>
            </div>
          </motion.div>
          <div className="steps">
            {[
              [
                Database,
                "01",
                "Bring your data together",
                "Organise materials, components, weights and product information in one shared workspace.",
              ],
              [
                Recycle,
                "02",
                "Understand your packaging",
                "Give your team a clear starting point for material analysis and compliance assessments.",
              ],
              [
                FileCheck2,
                "03",
                "Prepare with confidence",
                "Keep client information and the people responsible connected to your compliance journey.",
              ],
            ].map(([Icon, n, title, desc]) => {
              const I = Icon as typeof Leaf;
              return (
                <motion.article {...fade} key={n as string}>
                  <span key="number" className="step-number">
                    {n as string}
                  </span>
                  <div key="content">
                    <I key="icon" />
                    <h3>{title as string}</h3>
                    <p>{desc as string}</p>
                  </div>
                  <ArrowUpRight key="arrow" />
                </motion.article>
              );
            })}
          </div>
        </div>
      </section>
      <section className="section solutions-section" id="solutions">
        <div className="section-top">
          <div>
            <div className="eyebrow">BUILT AROUND YOUR BUSINESS</div>
            <h2>
              A better way to
              <br />
              <span>move forward.</span>
            </h2>
          </div>
          <p>
            One workspace. A shared direction.
            <br />
            Connect your team to what matters.
          </p>
        </div>
        <div className="solution-grid">
          {[
            [
              ShieldCheck,
              "01 / COMPLIANCE",
              "PPWR readiness",
              "Build a structured foundation for packaging documentation and regulatory preparation.",
              "mint",
            ],
            [
              FileCheck2,
              "02 / REPORTING",
              "EPR, without the data chaos",
              "Bring the packaging information needed for your reporting process into one place.",
              "peach",
            ],
            [
              Recycle,
              "03 / CIRCULARITY",
              "See beyond the lifecycle",
              "Understand your materials and create a clearer path toward more recyclable packaging.",
              "blue",
            ],
            [
              FlaskConical,
              "04 / COLLABORATION",
              "Your team, in sync",
              "Onboard clients, assign access and keep every stakeholder working from the same picture.",
              "lavender",
            ],
          ].map(([Icon, label, title, desc, color]) => {
            const I = Icon as typeof Leaf;
            return (
              <motion.article
                {...fade}
                className={`solution-card ${color}`}
                key={label as string}
              >
                <div key="art" className="solution-art">
                  <I key="art-icon" strokeWidth={1.2} />
                  <div className="art-orbit" />
                </div>
                <small key="label">{label as string}</small>
                <h3 key="title">{title as string}</h3>
                <p key="description">{desc as string}</p>
                <a
                  key="link"
                  href="mailto:crm@ananttattva.com?subject=PPWM%20Platform"
                >
                  Let's talk <ArrowUpRight size={16} />
                </a>
              </motion.article>
            );
          })}
        </div>
      </section>
      <section className="about-band" id="about">
        <div>
          <span className="eyebrow">THE ANANT TATTVA APPROACH</span>
          <h2>
            Small details.
            <br />
            <span>Lasting impact.</span>
          </h2>
        </div>
        <div>
          <p>
            We believe that better decisions begin with better information. PPWM
            brings packaging data and people together, helping you take the next
            step with clarity.
          </p>
          <div className="about-checks">
            <span>
              <Check /> Structured information
            </span>
            <span>
              <Check /> Responsible collaboration
            </span>
            <span>
              <Check /> A sustainability mindset
            </span>
          </div>
        </div>
      </section>
      <section className="cta-section" id="contact">
        <Leaf size={40} />
        <h2>
          Your next chapter
          <br />
          starts with clarity.
        </h2>
        <p>Let’s make packaging compliance a little less complicated.</p>
        <Button asChild>
          <a href="mailto:crm@ananttattva.com?subject=PPWM%20Demo">
            Let's build a better picture <ArrowRight size={18} />
          </a>
        </Button>
      </section>
      <footer>
        <div className="footer-main">
          <div>
            <Brand />
            <p>
              Connected data. Clearer decisions.
              <br />A more sustainable tomorrow.
            </p>
          </div>
          <div>
            <b>Platform</b>
            <a href="#platform">How it works</a>
            <a href="#solutions">Solutions</a>
            <Link href="/login">Workspace sign in</Link>
          </div>
          <div>
            <b>Company</b>
            <a href="#about">Our approach</a>
            <a href="mailto:crm@ananttattva.com">Get in touch</a>
            <a href="mailto:crm@ananttattva.com?subject=PPWM%20Demo">
              Book a demo
            </a>
          </div>
          <div className="footer-contact">
            <small>LET’S TALK</small>
            <a href="mailto:crm@ananttattva.com">
              crm@ananttattva.com <ArrowUpRight size={17} />
            </a>
            <p>
              Thoughtful technology.
              <br />
              Meaningful progress.
            </p>
          </div>
        </div>
        <div className="footer-bottom">
          <span>
            © {new Date().getFullYear()} Anant Tattva. All rights reserved.
          </span>
          <span>
            Made for a more circular world <Leaf size={13} />
          </span>
        </div>
      </footer>
    </main>
  );
}

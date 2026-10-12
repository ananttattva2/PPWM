"use client";
import Image from "next/image";
import { motion } from "motion/react";
import {
  Leaf,
  Package,
  Tag,
  Layers3,
  FileText,
  Landmark,
  Recycle,
  Globe2,
  Database,
  Calculator,
  ArrowRight,
  ChartNoAxesCombined,
  ChartPie,
} from "lucide-react";
const steps = [
  {
    number: 1,
    icon: Database,
    title: "Systematically Approach the Data Chaos",
    description:
      "Centralise all your packaging data — materials, components, weights and product information — in one organised platform.",
    tone: "orange",
  },
  {
    number: 2,
    icon: Calculator,
    title: "Assess and Calculate",
    description:
      "Prepare your packaging data for assessments against selected guidelines, recyclability grades and applicable EPR calculations.",
    tone: "teal",
  },
  {
    number: 3,
    icon: FileText,
    title: "Report",
    description:
      "Bring together the information needed for accurate, audit-ready EPR, recyclability and other regulatory reports.",
    tone: "blue",
  },
];
export default function ComplianceSection() {
  return (
    <section
      className="compliance-section"
      id="platform"
      aria-labelledby="compliance-heading"
    >
      <div className="compliance-wash" aria-hidden="true" />
      <Recycle
        className="compliance-recycle"
        aria-hidden="true"
        strokeWidth={2.8}
      />
      <span className="decorative-leaf leaf-top" aria-hidden="true" />
      <span className="decorative-leaf leaf-left" aria-hidden="true" />
      <span className="decorative-leaf leaf-right" aria-hidden="true" />
      <div className="compliance-heading">
        <div className="compliance-badge">
          <Leaf size={18} fill="currentColor" /> Packaging Compliance
        </div>
        <h2 id="compliance-heading">
          Without Digging Through{" "}
          <span>
            Hundreds of Pages
            <br className="compliance-title-break" /> of Guidelines
          </span>
        </h2>
        <p>
          Regulations continue to grow, become more complex, and yet differ
          significantly from one another.
          <br className="desktop-break" /> Dedicating resources to research and
          map them to your portfolio, to stay compliant is not the answer.
        </p>
      </div>
      <div className="compliance-content">
        <div
          className="compliance-diagram"
          role="img"
          aria-label="Packaging data and regulations connect through PPWM to support packaging compliance"
        >
          <svg
            className="compliance-ribbons"
            viewBox="0 0 600 500"
            fill="none"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="complianceTeal">
                <stop stopColor="#c4eee5" stopOpacity=".25" />
                <stop offset=".6" stopColor="#49d2be" stopOpacity=".35" />
                <stop offset="1" stopColor="#bceee7" stopOpacity=".05" />
              </linearGradient>
              <linearGradient id="complianceOrange">
                <stop stopColor="#ffb664" stopOpacity=".14" />
                <stop offset=".5" stopColor="#ffba73" stopOpacity=".5" />
                <stop offset="1" stopColor="#fff3e3" stopOpacity=".05" />
              </linearGradient>
            </defs>
            <path
              d="M-100 230C85 70 105 300 275 245S418 195 650 297"
              stroke="url(#complianceTeal)"
              strokeWidth="57"
            />
            <path
              d="M-90 305C50 410 135 236 260 243S432 162 650 191"
              stroke="url(#complianceOrange)"
              strokeWidth="45"
            />
            <path
              d="M-20 328C70 318 90 326 139 290S265 261 347 280S486 349 627 373"
              stroke="url(#complianceOrange)"
              strokeWidth="24"
            />
            <path
              d="M10 120C130 140 103 230 188 241M483 244C523 235 548 215 604 201M466 292C512 309 541 344 598 350"
              stroke="#12b4ae"
              strokeWidth="1.4"
              strokeDasharray="3 5"
              className="ribbon-dashes"
            />
            <path
              d="M30 354C124 400 135 275 190 271M472 269C523 276 525 331 607 319"
              stroke="#f0af65"
              strokeWidth="1.4"
              strokeDasharray="3 5"
            />
            <path
              d="M257 124C257 151 250 151 264 178M326 124V178M397 124C398 150 388 157 386 178M270 343V312M334 343V312M396 343V312"
              stroke="#13bab0"
              strokeWidth="2.2"
              strokeDasharray="3 4"
              className="ribbon-dashes"
            />
            <path
              d="m258 168 6 10 5-10m51-1 6 11 6-11m55 0-2 11 8-8m-120 49-6-8-5 9m64 0-6-9-6 9m74 0-6-9-6 9"
              stroke="#13bab0"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <div className="diagram-card packaging-data">
            <h3>
              <span>
                <Package size={24} />
              </span>
              Packaging Data
            </h3>
            <div className="diagram-items">
              {[
                [Package, "Materials"],
                [Tag, "Components"],
                [Layers3, "Weights"],
                [FileText, "Product Info"],
              ].map(([Icon, label]) => {
                const I = Icon as typeof Leaf;
                return (
                  <div key={label as string}>
                    <span>
                      <I size={23} />
                    </span>
                    <small>{label as string}</small>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="diagram-core">
            <div>
              <span>
                <Leaf size={36} />
              </span>
              <strong>PPWM</strong>
            </div>
            <p>Compliance Made Simple</p>
          </div>
          <div className="diagram-card regulations-data">
            <h3>
              <span>
                <Landmark size={23} />
              </span>
              Regulations
            </h3>
            <div className="diagram-items">
              {[
                [FileText, "EPR Report"],
                [Recycle, "Recyclability"],
                [Globe2, "Others"],
              ].map(([Icon, label]) => {
                const I = Icon as typeof Leaf;
                return (
                  <div key={label as string}>
                    <span>
                      <I size={25} />
                    </span>
                    <small>{label as string}</small>
                  </div>
                );
              })}
            </div>
          </div>
          <span className="diagram-orb orb-chart">
            <ChartNoAxesCombined size={22} />
          </span>
          <span className="diagram-orb orb-database">
            <Database size={25} />
          </span>
          <span className="diagram-orb orb-file">
            <FileText size={24} />
          </span>
          <span className="diagram-orb orb-pie">
            <ChartPie size={24} />
          </span>
          <Image
            className="packaging-still-life"
            src="/images/packaging-still-life.webp"
            alt="Recyclable packaging: bottles, a cardboard box and an aluminium can, surrounded by green leaves"
            width={680}
            height={915}
            sizes="(max-width: 600px) 135px, 260px"
          />
        </div>
        <div className="compliance-process">
          <h3>
            Bridge the Gap Between
            <br />
            <span className="teal-text">Regulations</span> and{" "}
            <span className="orange-text">Your Packaging Portfolio</span>
          </h3>
          <div className="compliance-step-list">
            {steps.map(({ number, icon: Icon, title, description, tone }) => (
              <motion.article
                key={number}
                className={`compliance-step ${tone}`}
                initial={{ opacity: 1, y: 10 }}
                whileInView={{ y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: number * 0.06 }}
              >
                <span className="compliance-step-number">{number}</span>
                <span className="compliance-step-icon">
                  <Icon size={35} />
                </span>
                <div>
                  <h4>{title}</h4>
                  <p>{description}</p>
                </div>
                <a
                  className="compliance-step-arrow"
                  href={`mailto:crm@ananttattva.com?subject=${encodeURIComponent(`PPWM — ${title}`)}`}
                  aria-label={`Ask about ${title}`}
                >
                  <ArrowRight size={23} />
                </a>
              </motion.article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

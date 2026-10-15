export const PPWR_SOURCE = "https://eur-lex.europa.eu/eli/reg/2025/40/oj";
export type TimelineMilestone = {
  date: string;
  title: string;
  article: string;
  detail: string;
};
export type TimelineYear = {
  year: number;
  color: string;
  commission: TimelineMilestone[];
  business: TimelineMilestone[];
};
export const ppwrTimeline: TimelineYear[] = [
  {
    year: 2026,
    color: "#0099de",
    commission: [
      {
        date: "12 February 2026",
        title: "EPR reporting",
        article: "Art. 44(14)",
        detail:
          "Implementing act for producer registration and reporting formats.",
      },
      {
        date: "12 August 2026",
        title: "Harmonised labels",
        article: "Arts. 12–13",
        detail:
          "Implementing acts for sorting labels, reusable packaging and digital material identification.",
      },
      {
        date: "31 December 2026",
        title: "Recycled content methods",
        article: "Art. 7",
        detail:
          "Calculation, verification, recycling sustainability criteria and third-country equivalence methods.",
      },
    ],
    business: [
      {
        date: "12 August 2026",
        title: "General application",
        article: "Art. 71",
        detail:
          "The Regulation generally applies. Individual obligations have their own transition periods.",
      },
      {
        date: "12 August 2026",
        title: "Substances of concern",
        article: "Art. 5",
        detail:
          "PFAS concentration limits apply to food-contact packaging, subject to the article’s conditions.",
      },
    ],
  },
  {
    year: 2027,
    color: "#00b8da",
    commission: [
      {
        date: "12 February 2027",
        title: "Packaging minimisation",
        article: "Art. 10",
        detail:
          "Request European standards supporting minimum packaging weight and volume.",
      },
      {
        date: "12 February 2027",
        title: "Restricted formats guidance",
        article: "Art. 25",
        detail:
          "Guidelines clarify Annex V restrictions and examples of exemptions.",
      },
      {
        date: "12 February / 30 June 2027",
        title: "Reuse methods",
        article: "Arts. 11, 30",
        detail:
          "Minimum rotations for reusable packaging, followed by reuse-target calculation rules.",
      },
    ],
    business: [
      {
        date: "12 February 2027",
        title: "Recyclability by design",
        article: "Art. 6(1)",
        detail:
          "Packaging must be recyclable; detailed performance grades apply from the later Article 6 deadlines.",
      },
      {
        date: "12 February 2027",
        title: "Bring-your-own container",
        article: "Art. 32",
        detail:
          "Hospitality distributors provide a system to fill customers' own containers for takeaway food and drinks.",
      },
    ],
  },
  {
    year: 2028,
    color: "#00bea4",
    commission: [
      {
        date: "1 January 2028",
        title: "Design for recycling",
        article: "Art. 6(4)",
        detail:
          "Delegated acts establish recycling design criteria and performance grades.",
      },
      {
        date: "12 February 2028",
        title: "Empty-space calculation",
        article: "Art. 24",
        detail:
          "Implementing methodology for the empty-space ratio in grouped, transport and e-commerce packaging.",
      },
    ],
    business: [
      {
        date: "12 February 2028",
        title: "Reusable takeaway option",
        article: "Art. 33",
        detail:
          "Hospitality distributors offer a reusable option for takeaway food and drinks; exemptions apply.",
      },
      {
        date: "12 February 2028",
        title: "Sales packaging empty space",
        article: "Art. 24(4)",
        detail:
          "Fillers minimise empty space to what is necessary for packaging functionality and product protection.",
      },
      {
        date: "12 February 2028",
        title: "Compostable packaging",
        article: "Art. 9",
        detail:
          "Specified permeable tea/coffee bags and sticky fruit and vegetable labels must be compostable.",
      },
      {
        date: "12 August 2028 or later",
        title: "Sorting labels",
        article: "Art. 12",
        detail:
          "Harmonised material labels apply from this date or 24 months after the relevant implementing acts, whichever is later.",
      },
    ],
  },
  {
    year: 2029,
    color: "#00bc62",
    commission: [],
    business: [
      {
        date: "1 January 2029",
        title: "Deposit return systems",
        article: "Art. 50",
        detail:
          "Member States achieve 90% separate collection of covered single-use plastic bottles and metal beverage containers; exemptions apply.",
      },
      {
        date: "12 February 2029 or later",
        title: "Reusable packaging labels",
        article: "Art. 12(2)",
        detail:
          "Reuse identification applies from this date or 30 months after the relevant implementing act, whichever is later.",
      },
    ],
  },
  {
    year: 2030,
    color: "#d3ae00",
    commission: [
      {
        date: "1 January 2030",
        title: "Recycling at scale method",
        article: "Art. 6(5)",
        detail:
          "Implementing acts establish the assessment methodology for recycling at scale.",
      },
      {
        date: "12 February 2030",
        title: "Green public procurement",
        article: "Art. 63",
        detail:
          "Implementing acts specify minimum mandatory procurement requirements for packaging.",
      },
    ],
    business: [
      {
        date: "1 January 2030",
        title: "Refill space in larger stores",
        article: "Art. 28",
        detail:
          "Final distributors with sales areas over 400 m² endeavour to dedicate 10% of that area to refill stations.",
      },
      {
        date: "1 January 2030 or later",
        title: "Recyclability grades A, B or C",
        article: "Art. 6",
        detail:
          "Design-for-recycling performance requirements apply from 2030 or 24 months after delegated acts, whichever is later.",
      },
      {
        date: "1 January 2030 or later",
        title: "Minimum recycled content",
        article: "Art. 7",
        detail:
          "Plastic targets: 30% contact-sensitive PET, 10% other contact-sensitive plastics, 30% beverage bottles and 35% other plastics. Later-act timing and exemptions apply.",
      },
      {
        date: "1 January 2030",
        title: "Minimisation & restrictions",
        article: "Arts. 10, 24–25",
        detail:
          "Reduce packaging weight and volume; covered empty space is limited to 50%, subject to implementation timing. Annex V format restrictions begin.",
      },
      {
        date: "1 January 2030",
        title: "Reuse & refill targets",
        article: "Arts. 29, 33",
        detail:
          "Covered transport packaging: 40% reusable; grouped packaging and beverages: 10%. Hospitality endeavours to offer 10% in reusable formats. Scope and exemptions apply.",
      },
      {
        date: "By 2030",
        title: "Packaging waste prevention",
        article: "Art. 43",
        detail:
          "Member States reduce per-capita packaging waste by at least 5% against 2018.",
      },
    ],
  },
  {
    year: 2032,
    color: "#ff902d",
    commission: [
      {
        date: "12 February 2032",
        title: "Implementation reviews",
        article: "Arts. 7, 24-25, 43",
        detail:
          "Review recycled content targets, empty-space requirements, restricted formats and packaging waste prevention.",
      },
    ],
    business: [],
  },
  {
    year: 2033,
    color: "#ff7418",
    commission: [
      {
        date: "12 August 2033",
        title: "Substances assessment",
        article: "Art. 5(9)",
        detail:
          "Assess whether substance restrictions and recycling-design criteria sufficiently minimise substances of concern.",
      },
    ],
    business: [],
  },
  {
    year: 2034,
    color: "#f45191",
    commission: [
      {
        date: "By 12 August 2034",
        title: "Regulation evaluation",
        article: "Art. 69",
        detail:
          "Commission evaluates the Regulation’s contribution to the internal market and environmental sustainability of packaging.",
      },
    ],
    business: [],
  },
  {
    year: 2035,
    color: "#e22ba4",
    commission: [],
    business: [
      {
        date: "1 January 2035 or later",
        title: "Recycled at scale",
        article: "Art. 6",
        detail:
          "Packaging must also be recycled at scale from 2035 or five years after the relevant implementing acts, whichever is later.",
      },
      {
        date: "By 2035",
        title: "Packaging waste prevention",
        article: "Art. 43",
        detail:
          "Member States reduce per-capita packaging waste by at least 10% against 2018.",
      },
    ],
  },
  {
    year: 2038,
    color: "#a52bea",
    commission: [],
    business: [
      {
        date: "1 January 2038",
        title: "Recyclability grades A or B",
        article: "Art. 6",
        detail:
          "Only packaging meeting recyclability performance grades A or B may be placed on the market, subject to Article 6 exemptions.",
      },
    ],
  },
  {
    year: 2040,
    color: "#8423d9",
    commission: [],
    business: [
      {
        date: "1 January 2040",
        title: "Higher recycled content",
        article: "Art. 7",
        detail:
          "Plastic targets increase to 50% contact-sensitive PET, 25% other contact-sensitive plastics and 65% for beverage bottles and other plastics, subject to exemptions.",
      },
      {
        date: "By 2040",
        title: "Reuse ambitions",
        article: "Art. 29",
        detail:
          "Operators endeavour to reach 70% reusable transport packaging, 25% grouped packaging and 40% beverages, within the article’s scope.",
      },
      {
        date: "By 2040",
        title: "Packaging waste prevention",
        article: "Art. 43",
        detail:
          "Member States reduce per-capita packaging waste by at least 15% against 2018.",
      },
    ],
  },
];

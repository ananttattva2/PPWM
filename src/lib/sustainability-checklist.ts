export function proofNotApplicableReason(
  requirementId: string,
  family: string | null | undefined,
  foodGrade: string | undefined,
): string | null {
  if (!family) return "Select and save a material before uploading proof.";
  if (
    ["recycled", "biobased", "compostable"].includes(requirementId) &&
    family !== "Plastic"
  )
    return "Not applicable to the selected material. Proof is not required.";
  if (requirementId === "pfas" && foodGrade?.trim().toLowerCase() === "no")
    return "Not applicable to non-food-grade packaging. Proof is not required.";
  return null;
}

export const sustainabilityRequirements = [
  {
    id: "heavy",
    title: "Heavy metal limit",
    description:
      "Limits on heavy metals in packaging materials to reduce environmental and health risks.",
    bullets: [
      "Lead, cadmium, mercury and chromium (VI)",
      "Combined limit: 100 mg/kg; exemptions apply",
    ],
    accent: "#ff7919",
    article: "Art. 5(4)",
  },
  {
    id: "pfas",
    title: "PFAS restriction",
    description:
      "Restrictions on PFAS in food-contact packaging to protect human health and the environment.",
    bullets: [
      "Limits: 25 ppb / 250 ppb / 50 ppm, by test definition",
      "Covers food-contact packaging",
    ],
    accent: "#ff427f",
    article: "Art. 5(5)",
  },
  {
    id: "recyclable",
    title: "Recyclable design",
    description: "Packaging must be recyclable or designed for recycling.",
    bullets: [
      "Design-for-recycling criteria",
      "Recyclability grades A, B and C",
      "Phased requirements and exemptions apply",
    ],
    accent: "#249d48",
    article: "Art. 6",
  },
  {
    id: "recycled",
    title: "Minimum recycled content (plastic)",
    description: "Minimum recycled content requirements for plastic packaging.",
    bullets: [
      "Product-specific targets",
      "Calculation and verification methodology",
      "Scope varies by packaging type",
    ],
    accent: "#168bea",
    article: "Art. 7",
  },
  {
    id: "biobased",
    title: "Biobased plastic feedstock claims",
    description:
      "Evidence and transparent claims for biobased plastic feedstock in packaging.",
    bullets: [
      "Document the biobased feedstock",
      "Substantiate environmental claims",
      "Review applicable specifications",
    ],
    accent: "#8842e5",
    article: "Arts. 8, 14",
  },
  {
    id: "compostable",
    title: "Compostable packaging conditions",
    description:
      "Specified packaging must meet compostability requirements under harmonised standards.",
    bullets: [
      "Defined types: tea/coffee bags and fruit/vegetable labels",
      "Meet the relevant composting standards",
      "Retain testing and compliance evidence",
    ],
    accent: "#f9a000",
    article: "Art. 9",
  },
  {
    id: "minimisation",
    title: "Packaging minimisation",
    description:
      "Design packaging to reduce unnecessary material and empty space.",
    bullets: [
      "Sales, grouped, transport and e-commerce packaging",
      "Methodology for the empty-space ratio",
      "Preserve essential product protection",
    ],
    accent: "#00a8af",
    article: "Arts. 10, 24",
  },
  {
    id: "reusable",
    title: "Reusable packaging design",
    description:
      "Design requirements for packaging intended for multiple trips or rotations.",
    bullets: [
      "Design for multiple use and durability",
      "Minimum rotations where specified",
      "Evidence and compatible reuse systems",
    ],
    accent: "#ff4b68",
    article: "Art. 11",
  },
  {
    id: "labelling",
    title: "Labelling",
    description:
      "Harmonised labelling requirements to identify materials and support proper waste management.",
    bullets: [
      "Common specifications and formats",
      "Material identification and sorting symbols",
      "Supports recycling and reuse",
      "Phased application dates",
    ],
    accent: "#4771ff",
    article: "Arts. 12–14",
  },
] as const;

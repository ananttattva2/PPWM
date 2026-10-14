import { z } from "zod";
export const materialFamilies = [
  "Plastic",
  "Paper/cardboard",
  "Glass",
  "Wood",
  "Metals",
  "Multi-material",
] as const;
export const packagingCategories = [
  {
    id: "glass",
    family: "Glass",
    title: "Glass",
    detail: "Glass and composite packaging, majority glass",
  },
  {
    id: "paper",
    family: "Paper/cardboard",
    title: "Paper/cardboard",
    detail: "Paper/cardboard packaging",
  },
  {
    id: "paper-composite",
    family: "Paper/cardboard",
    title: "Paper/cardboard composite",
    detail: "Composite packaging, majority paper/cardboard",
  },
  {
    id: "steel",
    family: "Metals",
    title: "Steel",
    detail: "Steel and composite packaging, majority steel",
  },
  {
    id: "aluminium-rigid",
    family: "Metals",
    title: "Aluminium — rigid",
    detail: "Aluminium and composite, majority aluminium",
  },
  {
    id: "aluminium-flexible",
    family: "Metals",
    title: "Aluminium — flexible",
    detail: "Semi-rigid and flexible aluminium packaging",
  },
  {
    id: "pet-bottles",
    family: "Plastic",
    title: "PET — rigid bottles",
    detail: "PET bottles and similar rigid packaging",
  },
  {
    id: "pet-rigid",
    family: "Plastic",
    title: "PET — rigid",
    detail: "Other rigid PET packaging",
  },
  {
    id: "pet-flexible",
    family: "Plastic",
    title: "PET — flexible",
    detail: "Flexible PET films and packaging",
  },
  {
    id: "pe-rigid",
    family: "Plastic",
    title: "PE — rigid",
    detail: "Rigid polyethylene packaging",
  },
  {
    id: "pe-flexible",
    family: "Plastic",
    title: "PE — flexible",
    detail: "Polyethylene films and bags",
  },
  {
    id: "pp-rigid",
    family: "Plastic",
    title: "PP — rigid",
    detail: "Rigid polypropylene packaging",
  },
  {
    id: "pp-flexible",
    family: "Plastic",
    title: "PP — flexible",
    detail: "Polypropylene films and flexible packaging",
  },
  {
    id: "hdpe-pp",
    family: "Plastic",
    title: "HDPE and PP — rigid",
    detail: "Rigid HDPE and polypropylene packaging",
  },
  {
    id: "ps-xps",
    family: "Plastic",
    title: "PS and XPS — rigid",
    detail: "Rigid polystyrene and extruded polystyrene",
  },
  {
    id: "eps",
    family: "Plastic",
    title: "EPS — rigid",
    detail: "Expanded polystyrene packaging",
  },
  {
    id: "other-rigid",
    family: "Plastic",
    title: "Other rigid plastics",
    detail: "PVC, PC and other plastics, including rigid multi-materials",
  },
  {
    id: "other-flexible",
    family: "Plastic",
    title: "Other flexible plastics",
    detail: "Other plastics, including flexible multi-materials",
  },
  {
    id: "biodegradable",
    family: "Plastic",
    title: "Biodegradable plastics",
    detail: "Rigid PHA, PHB and flexible plastics such as PLA",
  },
  {
    id: "wood-cork",
    family: "Wood",
    title: "Wood, cork",
    detail: "Wooden packaging, including cork",
  },
  {
    id: "textile",
    family: "Multi-material",
    title: "Textile",
    detail: "Natural and synthetic textile fibres",
  },
  {
    id: "ceramics",
    family: "Multi-material",
    title: "Ceramics / porcelain / stoneware",
    detail: "Clay and stone packaging",
  },
] as const;
export const classificationSchema = z
  .object({
    rowNumber: z.number().int().min(1).max(1001),
    componentId: z.string().regex(/^[a-zA-Z0-9-]{1,60}$/),
    family: z.enum(materialFamilies),
    categoryId: z.enum(
      packagingCategories.map((category) => category.id) as [
        string,
        ...string[],
      ],
    ),
  })
  .refine(
    (value) =>
      value.family === "Multi-material" ||
      packagingCategories.some(
        (category) =>
          category.id === value.categoryId && category.family === value.family,
      ),
    {
      message: "Choose a category for the selected material.",
      path: ["categoryId"],
    },
  );
export type Classification = z.infer<typeof classificationSchema>;

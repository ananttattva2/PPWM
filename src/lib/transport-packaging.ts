import { z } from "zod";

const wholeNumber = z.number().int().min(0).max(100000);
const text = z.string().trim().max(160);

export const transportComponentSchema = z.object({
  id: z.string().regex(/^[a-zA-Z0-9-]{1,60}$/),
  name: text,
  material: text,
  quantityPerLoad: wholeNumber,
  weightEach: z.number().min(0).max(10000000),
});

export const transportPackagingSchema = z.object({
  rowNumber: z.number().int().min(1).max(1001),
  used: z.enum(["yes", "no", "na"]),
  loadName: text,
  groupsPerLoad: wholeNumber,
  numberOfLoads: wholeNumber,
  components: z.array(transportComponentSchema).max(30),
  palletReusable: z.boolean(),
  returnSystem: text,
  recordedRotations: wholeNumber,
});

export type TransportPackagingData = z.infer<typeof transportPackagingSchema>;

export function transportWeightPerLoad(data: TransportPackagingData) {
  return data.components.reduce(
    (total, component) =>
      total + component.quantityPerLoad * component.weightEach,
    0,
  );
}

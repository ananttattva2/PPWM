export const PROOF_MAX_SIZE = 10 * 1024 * 1024;
export const PROOF_BATCH_LIMIT = 6;
export type SustainabilityProof = {
  id: string;
  requirementId: string;
  name: string;
  type: string;
  size: number;
};
export { validMediaSignature as validProofSignature } from "./media-types";

export const PROOF_MAX_SIZE = 10 * 1024 * 1024;
export const PROOF_BATCH_LIMIT = 6;
export type SustainabilityProof = {
  id: string;
  requirementId: string;
  name: string;
  type: string;
  size: number;
};
export function validProofSignature(type: string, bytes: Uint8Array) {
  if (type === "application/pdf")
    return new TextDecoder().decode(bytes.slice(0, 5)) === "%PDF-";
  if (type === "image/png")
    return [137, 80, 78, 71, 13, 10, 26, 10].every(
      (value, index) => bytes[index] === value,
    );
  if (type === "image/jpeg")
    return bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
  if (type === "image/webp")
    return (
      new TextDecoder().decode(bytes.slice(0, 4)) === "RIFF" &&
      new TextDecoder().decode(bytes.slice(8, 12)) === "WEBP"
    );
  return false;
}

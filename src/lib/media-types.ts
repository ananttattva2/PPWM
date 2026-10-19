export const mediaTypes = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
  "text/csv",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
  "text/plain",
  "video/mp4",
  "video/webm",
  "video/quicktime",
] as const;
export const mediaAccept =
  ".png,.jpg,.jpeg,.webp,.gif,.pdf,.xlsx,.xls,.csv,.doc,.docx,.txt,.mp4,.webm,.mov";
export function validMediaSignature(type: string, bytes: Uint8Array) {
  const text = (start: number, end: number) =>
    new TextDecoder().decode(bytes.slice(start, end));
  if (type === "application/pdf") return text(0, 5) === "%PDF-";
  if (type === "image/png")
    return [137, 80, 78, 71, 13, 10, 26, 10].every(
      (value, index) => bytes[index] === value,
    );
  if (type === "image/jpeg")
    return bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
  if (type === "image/webp")
    return text(0, 4) === "RIFF" && text(8, 12) === "WEBP";
  if (type === "image/gif") return ["GIF87a", "GIF89a"].includes(text(0, 6));
  if (
    [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ].includes(type)
  )
    return (
      bytes[0] === 80 && bytes[1] === 75 && bytes[2] === 3 && bytes[3] === 4
    );
  if (["application/vnd.ms-excel", "application/msword"].includes(type))
    return [208, 207, 17, 224, 161, 177, 26, 225].every(
      (value, index) => bytes[index] === value,
    );
  if (["video/mp4", "video/quicktime"].includes(type))
    return text(4, 8) === "ftyp";
  if (type === "video/webm")
    return [26, 69, 223, 163].every((value, index) => bytes[index] === value);
  if (["text/csv", "text/plain"].includes(type))
    return bytes.length > 0 && !bytes.slice(0, 8192).includes(0);
  return false;
}

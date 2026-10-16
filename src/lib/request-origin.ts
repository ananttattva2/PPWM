export function sameRequestOrigin(request: Pick<Request, "url" | "headers">) {
  const suppliedOrigin = request.headers.get("origin");
  if (!suppliedOrigin) return false;
  const external = new URL(request.url);
  // Next.js may construct request.url with its listening port behind a local
  // port alias. The HTTP Host still identifies the browser's actual origin.
  const host = request.headers.get("host");
  if (host) {
    const parsed = new URL(`${external.protocol}//${host}`);
    if (parsed.host !== host || parsed.username || parsed.password)
      return false;
    external.host = parsed.host;
  }
  return suppliedOrigin === external.origin;
}

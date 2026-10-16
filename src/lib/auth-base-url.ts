export function authBaseURL(configuredURL = "http://localhost:3000") {
  const url = new URL(configuredURL);
  if (!["localhost", "127.0.0.1", "[::1]"].includes(url.hostname))
    return configuredURL;
  return {
    allowedHosts: [
      "localhost:3000",
      "localhost:7000",
      "127.0.0.1:3000",
      "127.0.0.1:7000",
      "[::1]:3000",
      "[::1]:7000",
    ],
    fallback: configuredURL,
    protocol: "http" as const,
  };
}

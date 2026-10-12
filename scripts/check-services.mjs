import { MongoClient } from "mongodb";
const client = new MongoClient(process.env.MONGODB_URI, {
  serverSelectionTimeoutMS: 12000,
});
try {
  await client.connect();
  await client.db(process.env.MONGODB_DB).command({ ping: 1 });
  console.log("MongoDB Atlas: connected");
} catch (e) {
  console.log(
    "MongoDB Atlas:",
    e.name,
    String(e.message).replace(/mongodb[^\s]+/g, "[redacted URI]"),
  );
  process.exitCode = 1;
} finally {
  await client.close();
}
try {
  const r = await fetch(
    `https://login.microsoftonline.com/${process.env.MS_TENANT_ID}/oauth2/v2.0/token`,
    {
      method: "POST",
      body: new URLSearchParams({
        client_id: process.env.MS_CLIENT_ID,
        client_secret: process.env.MS_CLIENT_SECRET,
        scope: "https://graph.microsoft.com/.default",
        grant_type: "client_credentials",
      }),
      signal: AbortSignal.timeout(15000),
    },
  );
  const data = await r.json();
  console.log(
    "Microsoft Graph authentication:",
    r.ok ? "connected" : `${r.status} ${data.error || "failed"}`,
  );
  if (r.ok) {
    const payload = JSON.parse(
      Buffer.from(data.access_token.split(".")[1], "base64url").toString(),
    );
    console.log(
      "Mail.Send application permission:",
      payload.roles?.includes("Mail.Send") ? "present" : "missing",
    );
  } else process.exitCode = 1;
} catch (e) {
  console.log("Microsoft Graph authentication:", e.name);
  process.exitCode = 1;
}

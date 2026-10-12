import "server-only";
import { MongoClient } from "mongodb";
import { setServers } from "node:dns/promises";
if (process.env.MONGODB_DNS_SERVERS)
  setServers(process.env.MONGODB_DNS_SERVERS.split(","));
const globalDb = globalThis as unknown as { mongo?: MongoClient };
export function getClient() {
  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI is required");
  return (globalDb.mongo ??= new MongoClient(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 10000,
  }));
}
export function db() {
  return getClient().db(process.env.MONGODB_DB || "ppwm");
}

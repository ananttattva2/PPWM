import { test } from "node:test";
import assert from "node:assert/strict";
import {
  readMedia,
  removeMedia,
  storeMedia,
} from "../src/lib/cloudinary-storage";

test("media uses private local storage during unconfigured development", async () => {
  const configuredUrl = process.env.CLOUDINARY_URL;
  const environment = process.env.NODE_ENV;
  delete process.env.CLOUDINARY_URL;
  Reflect.set(process.env, "NODE_ENV", "development");
  const bytes = new TextEncoder().encode("local evidence");
  try {
    const stored = await storeMedia(bytes, "evidence.txt", "text/plain");
    assert.equal(stored.storage.provider, "local");
    assert.deepEqual(await readMedia(stored), bytes);
    await removeMedia(stored.storage);
    await assert.rejects(readMedia(stored));
  } finally {
    if (configuredUrl === undefined) delete process.env.CLOUDINARY_URL;
    else process.env.CLOUDINARY_URL = configuredUrl;
    if (environment === undefined)
      Reflect.deleteProperty(process.env, "NODE_ENV");
    else Reflect.set(process.env, "NODE_ENV", environment);
  }
});

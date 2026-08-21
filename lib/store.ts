import { readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { list, put } from "@vercel/blob";

export function createJsonStore<T>(pathname: string, defaultValue: T) {
  const localPath = join(process.cwd(), "data", pathname);

  async function get(): Promise<T> {
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      try {
        const { blobs } = await list({ prefix: pathname.replace(/\.json$/, "") });
        const blob = blobs.find((b) => b.pathname === pathname);
        if (blob) {
          const res = await fetch(blob.url);
          if (res.ok) return (await res.json()) as T;
        }
      } catch {
        // fall through to local
      }
    }
    try {
      return JSON.parse(readFileSync(localPath, "utf-8"));
    } catch {
      return defaultValue;
    }
  }

  async function save(value: T): Promise<void> {
    const json = JSON.stringify(value, null, 2);
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      await put(pathname, json, {
        access: "public",
        contentType: "application/json",
        addRandomSuffix: false,
        allowOverwrite: true,
      });
    } else {
      writeFileSync(localPath, json);
    }
  }

  return { get, save };
}

import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

/**
 * Private photo storage. Supabase Storage (private bucket, service-role key)
 * when configured; a local folder in development. Files are only ever served
 * through the staff photo route.
 */
export type PhotoStorage = {
  put(objectPath: string, bytes: Uint8Array, mimeType: string): Promise<void>;
  get(objectPath: string): Promise<Uint8Array | null>;
  remove(objectPath: string): Promise<void>;
};

function supabaseStorage(url: string, key: string, bucket: string): PhotoStorage {
  const base = `${url.replace(/\/$/, "")}/storage/v1/object`;
  const headers = { authorization: `Bearer ${key}`, apikey: key };
  return {
    async put(objectPath, bytes, mimeType) {
      const response = await fetch(`${base}/${bucket}/${encodeURI(objectPath)}`, {
        method: "POST",
        headers: { ...headers, "content-type": mimeType, "x-upsert": "false" },
        body: Buffer.from(bytes),
      });
      if (!response.ok) throw new Error(`Photo upload failed (${response.status}).`);
    },
    async get(objectPath) {
      const response = await fetch(`${base}/authenticated/${bucket}/${encodeURI(objectPath)}`, { headers });
      if (response.status === 404 || response.status === 400) return null;
      if (!response.ok) throw new Error(`Photo download failed (${response.status}).`);
      return new Uint8Array(await response.arrayBuffer());
    },
    async remove(objectPath) {
      await fetch(`${base}/${bucket}`, { method: "DELETE", headers: { ...headers, "content-type": "application/json" }, body: JSON.stringify({ prefixes: [objectPath] }) });
    },
  };
}

function localStorage(root: string): PhotoStorage {
  const resolve = (objectPath: string) => {
    const full = path.resolve(root, objectPath);
    if (!full.startsWith(path.resolve(root))) throw new Error("Invalid photo path.");
    return full;
  };
  return {
    async put(objectPath, bytes) {
      const full = resolve(objectPath);
      await mkdir(path.dirname(full), { recursive: true });
      await writeFile(full, bytes);
    },
    async get(objectPath) {
      try {
        return new Uint8Array(await readFile(resolve(objectPath)));
      } catch {
        return null;
      }
    },
    async remove(objectPath) {
      await rm(resolve(objectPath), { force: true });
    },
  };
}

let cached: PhotoStorage | null = null;

export function getPhotoStorage(): PhotoStorage {
  if (cached) return cached;
  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, UPLOAD_BUCKET, NODE_ENV, PHOTO_LOCAL_DIR } = process.env;
  if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) cached = supabaseStorage(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, UPLOAD_BUCKET || "repair-ticket-photos");
  else if (NODE_ENV !== "production") cached = localStorage(PHOTO_LOCAL_DIR || path.join(process.cwd(), ".data", "photos"));
  else throw new Error("Photo storage is not configured: set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
  return cached;
}

/** For tests. */
export function setPhotoStorage(storage: PhotoStorage | null) {
  cached = storage;
}

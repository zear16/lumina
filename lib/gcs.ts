import { Storage } from "@google-cloud/storage";

const BUCKET_NAME = process.env.GCS_BUCKET_NAME!;

function getStorage(): Storage {
  const json = process.env.GCS_SERVICE_ACCOUNT_JSON!;
  const credentials = JSON.parse(json);
  return new Storage({ credentials });
}

export interface GCSItem {
  type: "folder" | "image";
  name: string;      // display name (last path segment)
  key: string;       // full GCS object key or prefix
  coverKey?: string; // first image key inside folder (folders only)
}

export async function listObjects(prefix: string): Promise<GCSItem[]> {
  const storage = getStorage();
  const bucket = storage.bucket(BUCKET_NAME);

  const normalizedPrefix = prefix ? (prefix.endsWith("/") ? prefix : `${prefix}/`) : "";

  const [, , apiResponse] = await bucket.getFiles({
    prefix: normalizedPrefix,
    delimiter: "/",
    autoPaginate: false,
  });

  const items: GCSItem[] = [];

  // Folders (common prefixes) — fetch first image in parallel
  const prefixes: string[] = (apiResponse as any).prefixes ?? [];
  const folderItems = await Promise.all(
    prefixes.map(async (p) => {
      const trimmed = p.replace(/\/$/, "");
      const name = trimmed.split("/").pop()!;
      const coverKey = await getFirstImageKey(bucket, p);
      return { type: "folder" as const, name, key: p, coverKey };
    })
  );
  items.push(...folderItems);

  // Image files
  const files: any[] = (apiResponse as any).items ?? [];
  for (const file of files) {
    const key: string = file.name;
    if (key === normalizedPrefix) continue; // skip the directory placeholder
    if (!/\.(jpe?g|png|gif|webp|heic|avif)$/i.test(key)) continue;
    const name = key.split("/").pop()!;
    items.push({ type: "image", name, key });
  }

  return items.sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" })
  );
}

async function getFirstImageKey(bucket: any, folderPrefix: string): Promise<string | undefined> {
  const [files] = await bucket.getFiles({ prefix: folderPrefix, maxResults: 20 });
  const sorted = (files as any[])
    .map((f: any) => f.name as string)
    .filter((n) => /\.(jpe?g|png|gif|webp|heic|avif)$/i.test(n))
    .sort((a: string, b: string) =>
      a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" })
    );
  return sorted[0];
}

export async function getSignedUrl(key: string): Promise<string> {
  const storage = getStorage();
  const bucket = storage.bucket(BUCKET_NAME);
  const file = bucket.file(key);

  const [url] = await file.getSignedUrl({
    action: "read",
    expires: Date.now() + 60 * 60 * 1000, // 1 hour
  });

  return url;
}

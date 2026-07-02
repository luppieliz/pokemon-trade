import { promises as fs } from "fs";
import path from "path";
import { get, put } from "@vercel/blob";
import type { Enquiry } from "./types";

// Same storage strategy as listings: Vercel Blob (private) in production,
// local file in dev. Logging is best-effort — it must never block a visitor's
// enquiry, so failures are swallowed (Telegram remains the primary delivery).

const DATA_FILE = path.join(process.cwd(), "data", "enquiries.json");
const BLOB_KEY = "enquiries.json";
const MAX = 1000; // keep the most recent N to bound the store size

function useBlob(): boolean {
  return !!process.env.BLOB_READ_WRITE_TOKEN;
}
function isServerless(): boolean {
  return process.env.VERCEL === "1";
}

async function readBlob(): Promise<Enquiry[]> {
  const result = await get(BLOB_KEY, { access: "private" });
  if (!result) return [];
  try {
    const text = await new Response(result.stream).text();
    const data = JSON.parse(text);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

async function writeBlob(list: Enquiry[]): Promise<void> {
  await put(BLOB_KEY, JSON.stringify(list, null, 2), {
    access: "private",
    contentType: "application/json",
    addRandomSuffix: false,
    allowOverwrite: true,
  });
}

async function readFile(): Promise<Enquiry[]> {
  try {
    const raw = await fs.readFile(DATA_FILE, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeFile(list: Enquiry[]): Promise<void> {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(list, null, 2), "utf8");
}

export async function getEnquiries(): Promise<Enquiry[]> {
  return useBlob() ? readBlob() : readFile();
}

/** Append an enquiry (newest first). Best-effort — never throws. */
export async function addEnquiry(entry: Enquiry): Promise<void> {
  try {
    const list = await getEnquiries();
    list.unshift(entry);
    if (list.length > MAX) list.length = MAX;
    if (useBlob()) {
      await writeBlob(list);
    } else if (!isServerless()) {
      await writeFile(list);
    }
    // On serverless without Blob there's nowhere durable to write — skip.
  } catch {
    // Logging must not break the enquiry; Telegram is the primary record.
  }
}

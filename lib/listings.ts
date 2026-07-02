import { promises as fs } from "fs";
import path from "path";
import { get, put } from "@vercel/blob";
import type { Listing } from "./types";

// Storage backend:
//   • On Vercel the filesystem is read-only, so we persist listings in Vercel
//     Blob (enabled automatically when BLOB_READ_WRITE_TOKEN is present).
//   • Locally (no token) we use data/listings.json so dev needs zero setup.

const DATA_FILE = path.join(process.cwd(), "data", "listings.json");
const BLOB_KEY = "listings.json";

function useBlob(): boolean {
  return !!process.env.BLOB_READ_WRITE_TOKEN;
}

// True on Vercel, where the filesystem is read-only and Blob is required.
function isServerless(): boolean {
  return process.env.VERCEL === "1";
}

// ---- Blob backend --------------------------------------------------------

async function readBlob(): Promise<Listing[]> {
  // get() returns null if the blob doesn't exist yet (nothing listed).
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

async function writeBlob(listings: Listing[]): Promise<void> {
  await put(BLOB_KEY, JSON.stringify(listings, null, 2), {
    access: "private",
    contentType: "application/json",
    addRandomSuffix: false,
    allowOverwrite: true,
  });
}

// ---- Local file backend --------------------------------------------------

async function readFile(): Promise<Listing[]> {
  try {
    const raw = await fs.readFile(DATA_FILE, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeFile(listings: Listing[]): Promise<void> {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(listings, null, 2), "utf8");
}

// ---- Public API ----------------------------------------------------------

export async function getListings(): Promise<Listing[]> {
  return useBlob() ? readBlob() : readFile();
}

export async function saveListings(listings: Listing[]): Promise<void> {
  if (useBlob()) return writeBlob(listings);
  if (isServerless()) {
    throw new Error(
      "Storage isn't connected. In your Vercel project: Storage → Create Database → Blob → connect it to this project, then redeploy."
    );
  }
  return writeFile(listings);
}

export async function addListing(listing: Listing): Promise<Listing[]> {
  const listings = await getListings();
  listings.unshift(listing);
  await saveListings(listings);
  return listings;
}

export async function removeListing(listingId: string): Promise<Listing[]> {
  const listings = (await getListings()).filter((l) => l.listingId !== listingId);
  await saveListings(listings);
  return listings;
}

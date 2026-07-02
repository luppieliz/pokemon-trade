import { promises as fs } from "fs";
import path from "path";
import { list, put } from "@vercel/blob";
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

// ---- Blob backend --------------------------------------------------------

async function readBlob(): Promise<Listing[]> {
  const { blobs } = await list({ prefix: BLOB_KEY });
  const blob = blobs.find((b) => b.pathname === BLOB_KEY);
  if (!blob) return [];
  const res = await fetch(blob.url, { cache: "no-store" });
  if (!res.ok) return [];
  const data = await res.json().catch(() => []);
  return Array.isArray(data) ? data : [];
}

async function writeBlob(listings: Listing[]): Promise<void> {
  await put(BLOB_KEY, JSON.stringify(listings, null, 2), {
    access: "public",
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
  return useBlob() ? writeBlob(listings) : writeFile(listings);
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

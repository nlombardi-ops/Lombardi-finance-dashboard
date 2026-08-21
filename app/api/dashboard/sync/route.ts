import { NextRequest, NextResponse } from "next/server";
import { listFilesInFolder, downloadFile } from "@/lib/drive/client";
import { createJsonStore } from "@/lib/store";
import type { AreaData, FinanceItem } from "@/lib/types";

// ADAPT: one Drive folder ID per area you want synced. Get each ID from the
// folder's Drive URL (…/folders/<this-part>). Only list areas you've
// actually wired a parser for below — an area with no parser will just
// download files and store nothing.
const FOLDER_IDS: Record<string, string> = {
  // bollette: "PUT_FOLDER_ID_HERE",
};

// TODO: this is a stub, not a working parser. PDF/HTML bill templates vary
// per provider — inspect a real sample bill first, then write the actual
// regex extraction. This example shape is copied from the source project's
// pattern (see ONBOARDING.md §8) so the next parser you write has something
// to follow; it intentionally returns null (skip) until adapted.
function parseBollettaPdf(rawText: string): FinanceItem | null {
  const text = rawText.replace(/ /g, " ").replace(/​/g, "");
  const totalMatch = text.match(/Totale\s*(?:da pagare|a pagare)?\s*[:\s]*([\d.,]+)\s*€/i);
  if (!totalMatch) return null; // unrecognized template — skip, don't throw

  const amount = parseFloat(totalMatch[1].replace(/\./g, "").replace(",", "."));
  return {
    label: "Bolletta (sincronizzata)",
    amount,
    frequency: "monthly",
    date: new Date().toISOString().slice(0, 10),
  };
}

async function syncArea(areaId: string, folderId: string): Promise<{ synced: number; skipped: number }> {
  const files = await listFilesInFolder(folderId);
  const store = createJsonStore<AreaData>(`${areaId}.json`, { items: [] });
  const current = await store.get();

  let synced = 0;
  let skipped = 0;

  for (const file of files) {
    const buf = await downloadFile(file.id);
    const text = buf.toString("utf-8"); // ADAPT: run through a PDF text extractor if these are PDFs
    const parsed = areaId === "bollette" ? parseBollettaPdf(text) : null;
    if (parsed) {
      current.items.push(parsed);
      synced++;
    } else {
      skipped++;
    }
  }

  await store.save(current);
  return { synced, skipped };
}

export async function GET(request: NextRequest) {
  // Vercel injects this header on cron-triggered requests.
  if (request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results: Record<string, { synced: number; skipped: number } | string> = {};
  for (const [areaId, folderId] of Object.entries(FOLDER_IDS)) {
    try {
      results[areaId] = await syncArea(areaId, folderId);
    } catch (err) {
      results[areaId] = err instanceof Error ? err.message : String(err);
    }
  }

  return NextResponse.json({ results });
}

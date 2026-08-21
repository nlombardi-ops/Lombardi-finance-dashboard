import { readFileSync } from "fs";
import { join } from "path";
import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { calcCostUsd } from "@/lib/cost";
import { AREAS } from "@/lib/areas";
import type { AreaData } from "@/lib/types";

const MAX_HISTORY = 12;

function readAreaData(id: string): AreaData {
  try {
    const raw = readFileSync(join(process.cwd(), "data", `${id}.json`), "utf-8");
    return JSON.parse(raw) as AreaData;
  } catch {
    return { items: [] };
  }
}

function buildContext(): string {
  return AREAS.map((area) => {
    const { items } = readAreaData(area.id);
    if (items.length === 0) return `${area.label} (${area.group}): nessuna voce registrata.`;
    const lines = items
      .map((i) => `- ${i.label}: ${i.amount}€ (${i.frequency})${i.notes ? ` — ${i.notes}` : ""}`)
      .join("\n");
    return `${area.label} (${area.group}):\n${lines}`;
  }).join("\n\n");
}

export async function POST(request: NextRequest) {
  const authCookie = request.cookies.get("dashboard_auth");
  if (!authCookie?.value || authCookie.value !== process.env.DASHBOARD_TOKEN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { messages?: { role: "user" | "assistant"; content: string }[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const messages = body.messages;
  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: "Missing messages" }, { status: 400 });
  }

  const lastMessage = messages[messages.length - 1];
  if (lastMessage.role !== "user" || !lastMessage.content?.trim()) {
    return NextResponse.json({ error: "Last message must be a non-empty user message" }, { status: 400 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY not configured on this deployment" }, { status: 500 });
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const trimmedHistory = messages.slice(-MAX_HISTORY).map((m) => ({
    role: m.role,
    content: m.content,
  }));

  let response;
  try {
    response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system: `Sei un assistente per le finanze personali di un dashboard familiare. Rispondi SOLO usando i dati di entrate e costi riportati sotto — è tutto ciò che è stato caricato nel sistema. Se la risposta non è nei dati, dillo chiaramente invece di indovinare.

Sii conciso e diretto. Rispondi nella stessa lingua della domanda (italiano o inglese).

${buildContext()}`,
      messages: trimmedHistory,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `Anthropic API error: ${msg}` }, { status: 500 });
  }

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    return NextResponse.json({ error: "No response returned from model" }, { status: 500 });
  }

  const cost = calcCostUsd("claude-sonnet-4-6", response.usage.input_tokens, response.usage.output_tokens);
  return NextResponse.json({ reply: textBlock.text, _cost_usd: cost });
}

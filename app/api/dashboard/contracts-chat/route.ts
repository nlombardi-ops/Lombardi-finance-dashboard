import { readFileSync } from "fs";
import { join } from "path";
import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { calcCostUsd } from "@/lib/cost";
import type { Contract, ContractsData } from "@/lib/types";

const MAX_HISTORY = 12;

function readContracts(): Contract[] {
  try {
    const raw = readFileSync(join(process.cwd(), "data", "contratti.json"), "utf-8");
    return (JSON.parse(raw) as ContractsData).contracts;
  } catch {
    return [];
  }
}

function buildContext(): string {
  const contracts = readContracts();
  if (contracts.length === 0) {
    return "Nessun contratto è ancora stato caricato nel sistema.";
  }

  return contracts
    .map((c) => {
      const lines = [
        `- ${c.name} (${c.provider}, tipo: ${c.type})`,
        `  Stato: ${c.status}. Attivo dal: ${c.start_date ?? "sconosciuto"}.`,
        `  Fine permanenza: ${c.permanencia_end ?? "nessuna — libero da disdire in qualsiasi momento"}.`,
        `  Rinnovo automatico: ${c.auto_renew ? "sì" : "no"}.`,
        `  Preavviso di disdetta richiesto: ${c.notice_period_days != null ? `${c.notice_period_days} giorni` : "non specificato"}.`,
        `  Condizioni: ${c.key_terms}`,
        c.drive_link ? `  Documento: ${c.drive_link}` : null,
      ].filter(Boolean);
      return lines.join("\n");
    })
    .join("\n\n");
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

  const today = new Date().toISOString().slice(0, 10);

  let response;
  try {
    response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1536,
      system: `Sei un consulente esperto di contratti per una dashboard finanziaria familiare. Il tuo compito è essere l'unica fonte di verità su tutto ciò che riguarda i contratti in essere: permanenza, disdetta, rinnovo automatico, penali, coperture, obblighi e scadenze.

DATA DI OGGI: ${today}. Usa sempre questa data come riferimento per calcolare giorni/mesi rimanenti — non indovinare.

REGOLE:
1. Rispondi SOLO in base ai dati sui contratti riportati sotto. Se un'informazione non è presente, dillo chiaramente e indica cosa servirebbe (es. "controlla il contratto originale per la clausola di penale") — non inventare mai importi, date o clausole.
2. Quando rispondi, cita sempre il contratto specifico (nome + fornitore) da cui proviene l'informazione, soprattutto se la domanda riguarda più contratti.
3. Per qualsiasi domanda su scadenze o permanenza, calcola esplicitamente i giorni/mesi rimanenti rispetto a oggi, e se il contratto ha un preavviso di disdetta (notice_period_days), calcola anche l'ultima data utile per disdire in tempo.
4. Segnala PROATTIVAMENTE, anche senza che venga chiesto, se noti: rinnovo automatico imminente, finestra di disdetta che si sta chiudendo, o condizioni potenzialmente sfavorevoli (penali alte, permanenza lunga senza vantaggi evidenti nelle condizioni).
5. Se la domanda è generica ("quali contratti ho?", "cosa devo controllare questo mese?"), fai una sintesi ordinata per urgenza (prima le scadenze più vicine).
6. Sii conciso e diretto. Rispondi nella stessa lingua della domanda — italiano, spagnolo o inglese. Il testo originale dei contratti (key_terms) è probabilmente in spagnolo: se traduci un termine per rispondere in un'altra lingua, mantieni tra parentesi il termine spagnolo originale quando è rilevante per non perdere precisione legale (es. "permanencia", "penalización por cancelación anticipada").

CONTRATTI SUL SISTEMA:
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

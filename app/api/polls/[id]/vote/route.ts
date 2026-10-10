import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// POST /api/polls/[id]/vote — Body: { optionId }. One vote per call.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID.test(id)) return NextResponse.json({ error: "Invalid poll link." }, { status: 400 });
  try {
    const { optionId } = await req.json();
    if (!UUID.test(String(optionId ?? "")))
      return NextResponse.json({ error: "Pick an option." }, { status: 400 });

    const db = getSupabase();
    // Confirm the option belongs to this poll (stops cross-poll vote stuffing).
    const { data: opt, error: oErr } = await db
      .from("options")
      .select("id, votes")
      .eq("id", optionId)
      .eq("poll_id", id)
      .single();
    if (oErr || !opt) return NextResponse.json({ error: "Option not found." }, { status: 404 });

    // Demo-simple increment. A high-traffic app would use an atomic RPC instead.
    const { error: uErr } = await db
      .from("options")
      .update({ votes: (opt.votes ?? 0) + 1 })
      .eq("id", optionId);
    if (uErr) throw uErr;

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Something went wrong.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

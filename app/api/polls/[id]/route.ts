import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// GET /api/polls/[id] — fetch a poll with its options + vote counts.
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID.test(id)) return NextResponse.json({ error: "Invalid poll link." }, { status: 400 });
  try {
    const db = getSupabase();
    const { data: poll, error: pErr } = await db
      .from("polls")
      .select("id, question, created_at")
      .eq("id", id)
      .single();
    if (pErr || !poll) return NextResponse.json({ error: "Poll not found." }, { status: 404 });

    const { data: options, error: oErr } = await db
      .from("options")
      .select("id, label, votes")
      .eq("poll_id", id)
      .order("created_at");
    if (oErr) throw oErr;

    return NextResponse.json({ poll, options });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Something went wrong.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

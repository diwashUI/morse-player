import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

// POST /api/polls — create a poll. Body: { question, options: string[] }
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const question = String(body.question ?? "").trim();
    const options = (Array.isArray(body.options) ? body.options : [])
      .map((o: unknown) => String(o ?? "").trim())
      .filter(Boolean);

    if (question.length < 2 || question.length > 140)
      return NextResponse.json({ error: "Question must be 2–140 characters." }, { status: 400 });
    if (options.length < 2 || options.length > 6)
      return NextResponse.json({ error: "Give 2–6 options." }, { status: 400 });

    const db = getSupabase();
    const { data: poll, error: pErr } = await db
      .from("polls")
      .insert({ question })
      .select("id")
      .single();
    if (pErr || !poll) throw pErr ?? new Error("Couldn't save the poll.");

    const { error: oErr } = await db
      .from("options")
      .insert(options.map((label: string) => ({ poll_id: poll.id, label })));
    if (oErr) throw oErr;

    return NextResponse.json({ id: poll.id });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Something went wrong.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

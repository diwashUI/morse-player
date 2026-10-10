import { NextResponse } from "next/server";
import { getWrapped, WrappedError } from "@/lib/github";

// GET /api/wrapped/[username] — our backend: fetches GitHub, returns Wrapped stats.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;
  try {
    const stats = await getWrapped(username.trim());
    return NextResponse.json(stats);
  } catch (err) {
    if (err instanceof WrappedError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { inngest } from "@/inngest/client";

export async function POST(request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const { scope, id } = body || {};
    if (!scope || !id)
      return NextResponse.json({ error: "Invalid" }, { status: 400 });

    if (scope === "individual") {
      await inngest.send({
        name: "event.generate.individual",
        data: { userId: id },
      });
    } else if (scope === "community") {
      await inngest.send({
        name: "event.generate.community",
        data: { communityId: id },
      });
    } else {
      return NextResponse.json({ error: "Invalid scope" }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Internal" }, { status: 500 });
  }
}

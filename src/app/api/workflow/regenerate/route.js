import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { inngest } from "@/inngest/client";
import { prisma as db } from "@/lib/db"; // adjust import based on your DB setup

export async function POST(request) {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session?.user?.id)
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const body = await request.json().catch(() => ({}));
        const { scope, id } = body || {};
        if (!scope || !id)
            return NextResponse.json({ error: "Invalid" }, { status: 400 });
            const userCommunity = await db.community.findFirst({
                where: { leaderId: id },
                select: { id: true },
            });
        if (scope === "individual") {
            // Find community ID for the user

            await inngest.send({
                name: "event.generate.individual",
                data: { userId: id, communityId: userCommunity?.communityId || id },
            });
        } else if (scope === "community") {
            await inngest.send({
                name: "event.generate.community",
                data: { userId:id,communityId: userCommunity?.id },
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

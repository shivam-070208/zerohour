import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { headers } from "next/headers";

export async function GET() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // find community led by this user
    const community = await prisma.community.findFirst({
      where: { leaderId: session.user.id },
    });
    if (!community) {
      return NextResponse.json(
        { error: "No community found for this leader" },
        { status: 404 },
      );
    }

    const requests = await prisma.communityRequest.findMany({
      where: { communityId: community.id },
      orderBy: { requestedAt: "desc" },
      include: {
        user: {
          select: { id: true, name: true, email: true, image: true },
        },
      },
    });

    const payload = requests.map((r) => ({
      id: r.id,
      status: r.status,
      requestedAt: r.requestedAt,
      user: r.user
        ? {
            id: r.user.id,
            name: r.user.name,
            email: r.user.email,
            image: r.user.image,
          }
        : null,
    }));

    return NextResponse.json({
      communityId: community.id,
      communityName: community.name,
      requests: payload,
    });
  } catch (err) {
    console.error("GET /api/community/requests error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

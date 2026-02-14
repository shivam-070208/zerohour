import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    const requests = await prisma.communityRequest.findMany({
      where: { userId },
      select: { id: true, communityId: true, status: true, requestedAt: true },
      orderBy: { requestedAt: "desc" },
    });

    const member = await prisma.member.findFirst({
      where: { userId },
      include: {
        community: {
          select: {
            id: true,
            name: true,
            description: true,
            leaderId: true,
            leader: {
              select: { id: true, name: true, email: true },
            },
            members: {
              include: {
                user: { select: { id: true, name: true, email: true } },
              },
              orderBy: { joinedAt: "desc" },
            },
          },
        },
      },
    });

    return NextResponse.json({
      requests,
      isMember: !!member,
      memberCommunity: member
        ? {
            ...member.community,
            memberCount: member.community.members.length,
          }
        : null,
    });
  } catch (err) {
    console.error("GET /api/user/requests error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

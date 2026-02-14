import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const communityId = body?.communityId;
    if (!communityId || typeof communityId !== "string") {
      return NextResponse.json(
        { error: "communityId is required" },
        { status: 400 },
      );
    }

    const userId = session.user.id;

    // ensure community exists
    const community = await prisma.community.findUnique({
      where: { id: communityId },
    });
    if (!community)
      return NextResponse.json(
        { error: "Community not found" },
        { status: 404 },
      );

    // ensure user isn't already a member
    const member = await prisma.member.findFirst({ where: { userId } });
    if (member)
      return NextResponse.json(
        { error: "User already a member of a community" },
        { status: 400 },
      );

    // check any pending request
    const pending = await prisma.communityRequest.findFirst({
      where: { userId, status: "PENDING" },
    });
    if (pending)
      return NextResponse.json(
        { error: "You already have a pending request" },
        { status: 400 },
      );

    const created = await prisma.communityRequest.create({
      data: { userId, communityId, status: "PENDING" },
    });

    return NextResponse.json(
      {
        message: "Request sent",
        request: {
          id: created.id,
          communityId: created.communityId,
          status: created.status,
        },
      },
      { status: 201 },
    );
  } catch (err) {
    console.error("POST /api/user/request error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

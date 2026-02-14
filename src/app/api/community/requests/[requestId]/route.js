import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { headers } from "next/headers";

export async function POST(request, { params: paramsPromise }) {
  try {
    const { requestId } = await paramsPromise;
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await request.json().catch(() => ({}));
    const action = (body?.action || "").toUpperCase();
    if (!["APPROVE", "REJECT"].includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    // load request
    const joinRequest = await prisma.communityRequest.findUnique({
      where: { id: requestId },
    });
    if (!joinRequest)
      return NextResponse.json({ error: "Request not found" }, { status: 404 });

    // verify leader owns the community
    const community = await prisma.community.findUnique({
      where: { id: joinRequest.communityId },
    });
    if (!community || community.leaderId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (joinRequest.status !== "PENDING") {
      return NextResponse.json(
        { error: "Request already processed" },
        { status: 400 },
      );
    }

    const newStatus = action === "APPROVE" ? "APPROVED" : "REJECTED";

    await prisma.communityRequest.update({
      where: { id: requestId },
      data: { status: newStatus },
    });

    if (newStatus === "APPROVED") {
      // create membership
      await prisma.member.create({
        data: {
          userId: joinRequest.userId,
          communityId: joinRequest.communityId,
        },
      });
    }

    return NextResponse.json({ success: true, status: newStatus });
  } catch (err) {
    console.error("POST /api/community/requests/[requestId] error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

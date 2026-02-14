import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function DELETE(request, { params: paramsPromise }) {
  try {
    const { memberId } = await paramsPromise;
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!memberId) {
      return NextResponse.json(
        { error: "Member ID is required" },
        { status: 400 },
      );
    }

    const member = await prisma.member.findUnique({
      where: { id: memberId },
      include: {
        community: {
          select: { leaderId: true, id: true },
        },
      },
    });

    if (!member) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    if (member.community.leaderId !== session.user.id) {
      return NextResponse.json(
        { error: "You are not authorized to remove this member" },
        { status: 403 },
      );
    }

    // Delete the member
    await prisma.member.delete({
      where: { id: memberId },
    });

    return NextResponse.json(
      { message: "Member removed successfully" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error removing member:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

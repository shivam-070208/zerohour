import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const communityId = searchParams.get("communityId");

    let recommendation;

    if (userId) {
      recommendation = await prisma.recommendation.findFirst({
        where: { userId, communityId: null },
      });
    } else if (communityId) {
      recommendation = await prisma.recommendation.findFirst({
        where: { communityId, userId: null },
      });
    }

    if (!recommendation) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ id: recommendation.id });
  } catch (err) {
    console.error("Error fetching recommendation ID:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

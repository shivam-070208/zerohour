import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const communities = await prisma.community.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        leaderId: true,
        members: { select: { id: true } },
      },
      orderBy: { name: "asc" },
    });

    const payload = communities.map((c) => ({
      id: c.id,
      name: c.name,
      description: c.description,
      memberCount: c.members.length,
      leaderId: c.leaderId,
    }));

    return NextResponse.json({ communities: payload });
  } catch (err) {
    console.error("GET /api/communities error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

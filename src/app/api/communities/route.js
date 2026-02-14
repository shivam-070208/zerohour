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
        leader: {
          select: { id: true, name: true, email: true }
        },
        members: { 
          include: {
            user: { select: { id: true, name: true, email: true } }
          },
          orderBy: { joinedAt: 'desc' }
        },
      },
      orderBy: { name: "asc" },
    });

    const payload = communities.map((c) => ({
      id: c.id,
      name: c.name,
      description: c.description,
      memberCount: c.members.length,
      leaderId: c.leaderId,
      leader: c.leader,
      members: c.members.map(m => ({
        id: m.id,
        joinedAt: m.joinedAt,
        user: m.user
      }))
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

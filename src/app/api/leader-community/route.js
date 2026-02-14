import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const community = await prisma.Community.findFirst({
      where: { leaderId: session.user.id },
      select: {
        id: true,
        name: true,
        description: true,
        resourceUsage: true,
        infrastructure: true,
        environmentalConcerns: true,
        leaderId: true,
        members: {
          select: {
            id: true,
            userId: true,
          },
        },
      },
    });

    if (!community) {
      return NextResponse.json({
        hasCommunity: false,
        community: null,
      });
    }

    return NextResponse.json({
      hasCommunity: true,
      community: {
        id: community.id,
        name: community.name,
        description: community.description,
        memberCount: community.members.length,
      },
    });
  } catch (error) {
    console.error("Error fetching community:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

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
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: { joinedAt: "desc" },
        },
      },
    });

    if (!community) {
      return NextResponse.json({
        hasCommunity: false,
        community: null,
        communityName: null,
        members: [],
      });
    }

    // Fetch household data for each member
    const membersWithData = await Promise.all(
      community.members.map(async (m) => {
        const householdData = await prisma.household.findFirst({
          where: { userId: m.user.id },
        });
        return {
          id: m.id,
          joinedAt: m.joinedAt,
          user: m.user,
          householdData: householdData || null,
        };
      }),
    );

    return NextResponse.json({
      hasCommunity: true,
      communityName: community.name,
      community: {
        id: community.id,
        name: community.name,
        description: community.description,
        memberCount: community.members.length,
      },
      members: membersWithData,
    });
  } catch (error) {
    console.error("Error fetching community:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

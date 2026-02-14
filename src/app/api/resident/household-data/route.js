import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { headers } from "next/headers";
import { inngest } from "@/inngest/client";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const householdData = await prisma.household.findFirst({
      where: { userId: session.user.id },
    });

    return NextResponse.json({
      householdData: householdData || null,
    });
  } catch (err) {
    console.error("GET /api/resident/household-data error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      energyUsage,
      waterUsage,
      wasteGenerated,
      transportation,
      commuteDistance,
      location,
    } = body;

    // Check if data already exists
    const existing = await prisma.household.findFirst({
      where: { userId: session.user.id },
    });

    let householdData;
    if (existing) {
      // Update existing
      householdData = await prisma.household.update({
        where: { id: existing.id },
        data: {
          energyUsage: energyUsage
            ? parseFloat(energyUsage)
            : existing.energyUsage,
          waterUsage: waterUsage ? parseFloat(waterUsage) : existing.waterUsage,
          wasteGenerated: wasteGenerated
            ? parseFloat(wasteGenerated)
            : existing.wasteGenerated,
          transportation: transportation || existing.transportation,
          commuteDistance: commuteDistance
            ? parseFloat(commuteDistance)
            : existing.commuteDistance,
          location: location || existing.location,
          updatedAt: new Date(),
        },
      });
    } else {
      // Create new
      householdData = await prisma.household.create({
        data: {
          userId: session.user.id,
          energyUsage: energyUsage ? parseFloat(energyUsage) : 0,
          waterUsage: waterUsage ? parseFloat(waterUsage) : 0,
          wasteGenerated: wasteGenerated ? parseFloat(wasteGenerated) : 0,
          transportation: transportation || "",
          commuteDistance: commuteDistance ? parseFloat(commuteDistance) : 0,
          location: location || "",
        },
      });
    }

    // Trigger Inngest events to generate workflows
    try {
      // Individual-level plan
      await inngest.send({
        name: "event.generate.individual",
        data: { userId: session.user.id, householdData },
      });

      // If the user is a member of a community, trigger community-level plan
      const member = await prisma.member.findFirst({
        where: { userId: session.user.id },
      });
      if (member?.communityId) {
        await inngest.send({
          name: "event.generate.community",
          data: { communityId: member.communityId },
        });
      }
    } catch (e) {
      console.error("Failed to send inngest event:", e);
    }

    return NextResponse.json({ householdData });
  } catch (err) {
    console.error("POST /api/resident/household-data error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

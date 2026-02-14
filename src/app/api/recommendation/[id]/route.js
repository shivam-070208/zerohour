import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request, { params }) {
  try {
    const { id } = params;
    const recommendation = await prisma.recommendation.findUnique({
      where: { id },
      include: {
        nodes: {
          select: {
            id: true,
            label: true,
            position: true,
            status: true,
          },
        },
        edges: {
          select: {
            id: true,
            sourceNodeId: true,
            targetNodeId: true,
          },
        },
      },
    });

    if (!recommendation) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Convert nodes to XYFlow format
    const nodes = (recommendation.nodes || []).map((n) => ({
      id: n.id,
      data: { label: n.label },
      position: n.position || { x: 0, y: 0 },
    }));

    const edges = (recommendation.edges || []).map((e) => ({
      id: e.id,
      source: e.sourceNodeId,
      target: e.targetNodeId,
    }));

    return NextResponse.json({
      recommendation: {
        id: recommendation.id,
        recommendation: recommendation.recommendation,
        category: recommendation.category,
        status: recommendation.status,
      },
      nodes,
      edges,
    });
  } catch (err) {
    console.error("Error fetching recommendation:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

import { serve } from "inngest/next";
import { inngest } from "../../../inngest/client";
import { callGemini, buildPlanPrompt } from "@/lib/gemini";
import { prisma } from "@/lib/db";

const individualFn = inngest.createFunction(
  {
    id: "generate-individual-plan",
  },
  {
    event: "event.generate.individual",
  },
  async ({ event }) => {
    const data = event.data || {};
    const prompt = buildPlanPrompt({ scope: "individual", context: data });
    const resp = await callGemini(prompt, { maxTokens: 800 });

    let out = null;
    if (resp?.json) out = resp.json;
    else if (resp?.text) {
      try {
        out = JSON.parse(resp.text);
      } catch (e) {
          out = { text: resp.text };
      }
    } else {
        out = resp;
    }
    console.log(out)

    // Persist to Prisma: create or update recommendation with nodes and edges
    try {
      const userId = data.userId || (data?.householdData?.userId ?? "unknown");
      const nodes = (out?.nodes || []).map((node) => ({
        label: node.data?.label || node.id,
        position: node.position || { x: 0, y: 0 },
        status: "PENDING",
      }));
      const edges = out?.edges || [];

      let recommendation = await prisma.recommendation.findFirst({
        where: { userId, communityId: null },
      });

      if (!recommendation) {
        recommendation = await prisma.recommendation.create({
          data: {
            userId,
            recommendation: "Individual Sustainability Plan",
            category: "ENERGY",
            status: "PENDING",
          },
        });
      }

      // Delete old nodes/edges and create new ones
      await prisma.edge.deleteMany({
        where: { sourceNode: { recommendationId: recommendation.id } },
      });
      await prisma.node.deleteMany({
        where: { recommendationId: recommendation.id },
      });

      const createdNodes = await Promise.all(
        nodes.map((n) =>
          prisma.node.create({
            data: {
              recommendationId: recommendation.id,
              ...n,
            },
          }),
        ),
      );

      const nodeMap = createdNodes.reduce((acc, node, idx) => {
        acc[edges[idx]?.source || idx.toString()] = node.id;
        return acc;
      }, {});

      await Promise.all(
        edges.map((e) =>
          prisma.edge.create({
            data: {
              sourceNodeId: nodeMap[e.source] || createdNodes[0]?.id,
              targetNodeId:
                nodeMap[e.target] || createdNodes[createdNodes.length - 1]?.id,
            },
          }),
        ),
      );
    } catch (e) {
      console.error("Failed to save individual workflow to Prisma:", e);
    }

    return { plan: out };
  },
);

const communityFn = inngest.createFunction(
  {
    id: "generate-community-plan",
  },
  {
    event: "event.generate.community",
  },
  async ({ event }) => {
    const data = event.data || {};
    const prompt = buildPlanPrompt({ scope: "community", context: data });
    const resp = await callGemini(prompt, { maxTokens: 1200 });

    let out = null;
    console.log(resp)
    if (resp?.json) out = resp.json;
    else if (resp?.text) {
      try {
        out = JSON.parse(resp.text);
      } catch (e) {
        out = { text: resp.text };
      }
    } else {
      out = resp;
    }

    // Persist to Prisma: create or update recommendation with nodes and edges
    try {
      const communityId = data.communityId;
      console.log(communityId)
      const nodes = (out?.nodes || []).map((node) => ({
        label: node.data?.label || node.id,
        position: node.position || { x: 0, y: 0 },
        status: "PENDING",
      }));
      const edges = out?.edges || [];

      let recommendation = await prisma.recommendation.findFirst({
        where: { communityId, userId: null },
      });

      if (!recommendation) {
        recommendation = await prisma.recommendation.create({
          data: {
            communityId,
            recommendation: "Community Sustainability Plan",
            category: "ENERGY",
            status: "PENDING",
          },
        });
      }

      // Delete old nodes/edges and create new ones
      await prisma.edge.deleteMany({
        where: { sourceNode: { recommendationId: recommendation.id } },
      });
      await prisma.node.deleteMany({
        where: { recommendationId: recommendation.id },
      });

      const createdNodes = await Promise.all(
        nodes.map((n) =>
          prisma.node.create({
            data: {
              recommendationId: recommendation.id,
              ...n,
            },
          }),
        ),
      );

      const nodeMap = createdNodes.reduce((acc, node, idx) => {
        acc[edges[idx]?.source || idx.toString()] = node.id;
        return acc;
      }, {});

      await Promise.all(
        edges.map((e) =>
          prisma.edge.create({
            data: {
              sourceNodeId: nodeMap[e.source] || createdNodes[0]?.id,
              targetNodeId:
                nodeMap[e.target] || createdNodes[createdNodes.length - 1]?.id,
            },
          }),
        ),
      );
    } catch (e) {
      console.error("Failed to save community workflow to Prisma:", e);
    }

    return { plan: out };
  },
);

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [individualFn, communityFn],
});

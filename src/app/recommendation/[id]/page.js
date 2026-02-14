"use client";
import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

export default function RecommendationPage() {
  const params = useParams();
  const router = useRouter();
  const { id } = params;

  const [recommendation, setRecommendation] = useState(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRecommendation = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/recommendation/${id}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Not found");
        console.log(data)
        setRecommendation(data.recommendation);
        setNodes(data.nodes || []);
        setEdges(data.edges || []);
      } catch (err) {
        console.error("Error fetching recommendation:", err);
        setError(err.message || "Failed to load");
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchRecommendation();
  }, [id]);

  const regenerate = async () => {
    try {
      if (recommendation?.userId) {
        await fetch("/api/workflow/regenerate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            scope: "individual",
            id: recommendation.userId,
          }),
        });
      } else if (recommendation?.communityId) {
        
        await fetch("/api/workflow/regenerate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            scope: "community",
            id: recommendation.communityId,
          }),
        });
      }
      // Refresh page after a moment
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="w-full h-screen flex flex-col">
      <div className="p-4 border-b bg-white flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold">
            {recommendation?.recommendation}
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Category: {recommendation?.category}
          </p>
          <p className="text-sm text-gray-600">
            Status: {recommendation?.status}
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => router.back()} variant="outline">
            Back
          </Button>
          <Button
            onClick={regenerate}
            className="bg-amber-600 hover:bg-amber-700 text-white"
          >
            Regenerate
          </Button>
        </div>
      </div>

      <div className="flex-1 relative">
        {loading ? (
          <div className="w-full h-full flex items-center justify-center">
            Loading...
          </div>
        ) : error ? (
          <div className="w-full h-full flex items-center justify-center text-red-600">
            {error}
          </div>
        ) : (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
          >
            <Background />
            <Controls />
            <MiniMap />
          </ReactFlow>
        )}
      </div>
    </div>
  );
}

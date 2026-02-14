"use client";
import React, { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// Simple Spinner component (if not already in your UI kit)
function Spinner() {
  return (
    <div className="flex items-center justify-center space-x-2">
      <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
      <span className="sr-only">Loading...</span>
    </div>
  );
}

export default function ResidentPage() {
  const [loading, setLoading] = useState(true);
  const [communities, setCommunities] = useState([]);
  const [requests, setRequests] = useState([]);
  const [isMember, setIsMember] = useState(false);
  const [userId, setUserId] = useState(null);
  const [error, setError] = useState(null);
  const [sending, setSending] = useState(false);
  const [expandedCommunity, setExpandedCommunity] = useState(null);

  const load = async () => {
    try {
      setLoading(true);
      const { data: session } = await authClient.getSession();
      if (session?.user?.id) setUserId(session.user.id);

      const [cRes, rRes] = await Promise.all([
        fetch("/api/communities"),
        fetch("/api/user/requests"),
      ]);

      const cData = await cRes.json();
      const rData = await rRes.json();

      setCommunities(cData.communities || []);
      setRequests(rData.requests || []);
      setIsMember(!!rData.isMember);
    } catch (err) {
      console.error("Resident load error:", err);
      setError("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const userHasPending = () => requests.some((r) => r.status === "PENDING");

  const handleRequest = async (communityId) => {
    if (userHasPending()) return;
    try {
      setSending(true);
      const res = await fetch("/api/user/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ communityId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || data?.message || "Failed");
      // refresh
      await load();
    } catch (err) {
      console.error("Request error:", err);
      setError(err.message || "Failed to send request");
    } finally {
      setSending(false);
    }
  };

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner />
      </div>
    );
  if (error)
    return (
      <div className="p-8 text-red-600 flex items-center justify-center min-h-[40vh]">
        {error}
      </div>
    );

  if (isMember) {
    return (
      <div className="p-8">
        <Card className="max-w-3xl">
          <CardHeader>
            <CardTitle>You are a community member</CardTitle>
            <CardDescription>
              Manage your membership from the community dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent>{/* Could add links to community */}</CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Available Communities</h2>
        <p className="text-sm text-gray-600">
          Request to join one community at a time.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {communities.map((c) => (
          <Card key={c.id} className="p-4">
            <CardHeader>
              <CardTitle>{c.name}</CardTitle>
              <CardDescription className="mt-1">
                {c.description}
              </CardDescription>
              {c.leader && (
                <p className="text-xs text-gray-500 mt-2">
                  Leader: {c.leader.name || c.leader.email}
                </p>
              )}
            </CardHeader>
            <CardContent>
              <p className="text-sm text-neutral-600 mb-3">
                Members: {c.memberCount}
              </p>

              {/* Members List Collapsible */}
              {c.members && c.members.length > 0 && (
                <div className="mb-4 border-t pt-3">
                  <button
                    onClick={() =>
                      setExpandedCommunity(
                        expandedCommunity === c.id ? null : c.id
                      )
                    }
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    {expandedCommunity === c.id ? "Hide" : "Show"} Members
                  </button>

                  {expandedCommunity === c.id && (
                    <div className="mt-2 space-y-2">
                      {c.members.map((member) => (
                        <div
                          key={member.id}
                          className="flex items-center justify-between rounded-md bg-gray-50 p-2 text-sm"
                        >
                          <div>
                            <p className="font-medium">
                              {member.user?.name || member.user?.email || "Unknown"}
                            </p>
                            <p className="text-xs text-gray-500">
                              {member.user?.email}
                            </p>
                            <p className="text-xs text-gray-400">
                              Joined:{" "}
                              {new Date(member.joinedAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="mt-4">
                <Button
                  disabled={userHasPending() || sending}
                  onClick={() => handleRequest(c.id)}
                  className="bg-primary text-white"
                >
                  {sending && !userHasPending() ? (
                    <span className="flex items-center">
                      <Spinner />
                      <span className="ml-2">Sending...</span>
                    </span>
                  ) : userHasPending() ? (
                    "Request Pending"
                  ) : (
                    "Request To Join"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-8 max-w-3xl">
        <h3 className="text-xl font-semibold">Your Requests</h3>
        {requests.length === 0 && (
          <p className="text-sm text-gray-600">No requests yet.</p>
        )}
        {requests.map((r) => (
          <div key={r.id} className="mt-3 rounded-lg border p-3">
            <p className="font-medium">Community ID: {r.communityId}</p>
            <p className="text-sm">Status: {r.status}</p>
            <p className="text-xs text-gray-500">
              Requested at: {new Date(r.requestedAt).toLocaleString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

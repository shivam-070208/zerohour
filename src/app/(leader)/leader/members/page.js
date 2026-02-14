"use client";
import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function LeaderMembersPage() {
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState([]);
  const [requests, setRequests] = useState([]);
  const [communityName, setCommunityName] = useState("");
  const [processing, setProcessing] = useState(null);
  const [error, setError] = useState(null);
  const [showRequestsModal, setShowRequestsModal] = useState(false);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [expandedMember, setExpandedMember] = useState(null);

  const loadMembers = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/leader-community");
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to load");
      setCommunityName(data.communityName || "");
      setMembers(data.members || []);
    } catch (err) {
      console.error("Load members error:", err);
      setError(err.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  const loadRequests = async () => {
    try {
      setRequestsLoading(true);
      const res = await fetch("/api/community/requests");
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to load");
      setRequests(data.requests || []);
    } catch (err) {
      console.error("Load requests error:", err);
      toast.error(err.message || "Failed to load requests");
    } finally {
      setRequestsLoading(false);
    }
  };

  useEffect(() => {
    loadMembers();
  }, []);

  const handleRemoveMember = async (memberId) => {
    if (!confirm("Are you sure you want to remove this member?")) return;

    try {
      setProcessing(memberId);
      const res = await fetch(`/api/community/members/${memberId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed");
      toast.success("Member removed successfully");
      await loadMembers();
    } catch (err) {
      console.error("Remove member error:", err);
      toast.error(err.message || "Failed to remove member");
    } finally {
      setProcessing(null);
    }
  };

  const handleRequestAction = async (id, action) => {
    try {
      setProcessing(id);
      const res = await fetch(`/api/community/requests/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed");
      toast.success(`Request ${action.toLowerCase()}ed`);
      await loadRequests();
      if (action === "APPROVE") {
        await loadMembers();
      }
    } catch (err) {
      console.error("Action error:", err);
      toast.error(err.message || "Failed to process request");
    } finally {
      setProcessing(null);
    }
  };

  const openRequestsModal = async () => {
    setShowRequestsModal(true);
    await loadRequests();
  };

  if (loading) return <div className="p-8">Loading...</div>;
  if (error) return <div className="p-8 text-red-600">{error}</div>;

  const pendingRequests = requests.filter((r) => r.status === "PENDING");

  return (
    <div className="p-8">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">
            Community Members - {communityName || "Your Community"}
          </h2>
          <p className="text-gray-600 mt-1">Total members: {members.length}</p>
        </div>
        <Button
          onClick={openRequestsModal}
          className="bg-blue-600 hover:bg-blue-700 text-white relative"
        >
          Join Requests
          {pendingRequests.length > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {pendingRequests.length}
            </span>
          )}
        </Button>
      </div>

      {/* Members List */}
      {members.length === 0 ? (
        <Card className="max-w-3xl">
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600">No members yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 mt-4 max-w-4xl">
          {members.map((member) => (
            <Card key={member.id} className="p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <CardTitle className="text-lg">
                    {member.user?.name || member.user?.email || "Unknown"}
                  </CardTitle>
                  <p className="text-xs text-gray-500 mt-1">
                    {member.user?.email}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Joined: {new Date(member.joinedAt).toLocaleDateString()}
                  </p>

                  {/* Household Data Toggle */}
                  {member.householdData && (
                    <div className="mt-3 border-t pt-3">
                      <button
                        onClick={() =>
                          setExpandedMember(
                            expandedMember === member.id ? null : member.id,
                          )
                        }
                        className="text-sm font-medium text-blue-600 hover:underline"
                      >
                        {expandedMember === member.id
                          ? "Hide Household Data"
                          : "View Household Data"}
                      </button>

                      {expandedMember === member.id && (
                        <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                          <div className="bg-gray-50 p-2 rounded">
                            <p className="text-gray-600">Energy Usage</p>
                            <p className="font-semibold">
                              {member.householdData.energyUsage || "—"} kWh
                            </p>
                          </div>
                          <div className="bg-gray-50 p-2 rounded">
                            <p className="text-gray-600">Water Usage</p>
                            <p className="font-semibold">
                              {member.householdData.waterUsage || "—"} gal
                            </p>
                          </div>
                          <div className="bg-gray-50 p-2 rounded">
                            <p className="text-gray-600">Waste Generated</p>
                            <p className="font-semibold">
                              {member.householdData.wasteGenerated || "—"} kg
                            </p>
                          </div>
                          <div className="bg-gray-50 p-2 rounded">
                            <p className="text-gray-600">Transportation</p>
                            <p className="font-semibold">
                              {member.householdData.transportation || "—"}
                            </p>
                          </div>
                          <div className="bg-gray-50 p-2 rounded">
                            <p className="text-gray-600">Commute Distance</p>
                            <p className="font-semibold">
                              {member.householdData.commuteDistance || "—"} km
                            </p>
                          </div>
                          <div className="bg-gray-50 p-2 rounded">
                            <p className="text-gray-600">Location</p>
                            <p className="font-semibold">
                              {member.householdData.location || "—"}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {!member.householdData && (
                    <p className="text-xs text-gray-400 mt-3">
                      No household data submitted yet
                    </p>
                  )}
                </div>
                <Button
                  disabled={processing === member.id}
                  onClick={() => handleRemoveMember(member.id)}
                  variant="destructive"
                  className="bg-red-600 hover:bg-red-700 text-white whitespace-nowrap ml-4"
                >
                  {processing === member.id ? "Removing..." : "Remove"}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Requests Modal */}
      {showRequestsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-end z-50 transition-opacity">
          <div className="bg-white w-full max-w-md h-screen overflow-y-auto shadow-lg animate-slide-in">
            <div className="p-6 sticky top-0 bg-white border-b">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold">Join Requests</h3>
                <button
                  onClick={() => setShowRequestsModal(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="p-6">
              {requestsLoading ? (
                <p className="text-center text-gray-600">Loading requests...</p>
              ) : pendingRequests.length === 0 ? (
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-sm text-gray-600">
                      No pending requests at the moment.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {pendingRequests.map((request) => (
                    <Card key={request.id} className="p-4">
                      <CardHeader>
                        <CardTitle className="text-base">
                          {request.user?.name ||
                            request.user?.email ||
                            "Unknown"}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-xs text-gray-500 mb-3">
                          {request.user?.email}
                        </p>
                        <p className="text-xs text-gray-400 mb-3">
                          Requested:{" "}
                          {new Date(request.requestedAt).toLocaleString()}
                        </p>

                        <div className="flex gap-2">
                          <Button
                            disabled={processing === request.id}
                            onClick={() =>
                              handleRequestAction(request.id, "APPROVE")
                            }
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white text-sm"
                          >
                            {processing === request.id ? "..." : "Approve"}
                          </Button>
                          <Button
                            disabled={processing === request.id}
                            onClick={() =>
                              handleRequestAction(request.id, "REJECT")
                            }
                            variant="outline"
                            className="flex-1 text-sm"
                          >
                            {processing === request.id ? "..." : "Reject"}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slide-in {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}

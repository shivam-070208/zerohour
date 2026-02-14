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
  const [memberCommunity, setMemberCommunity] = useState(null);
  const [userId, setUserId] = useState(null);
  const [error, setError] = useState(null);
  const [sending, setSending] = useState(false);
  const [expandedCommunity, setExpandedCommunity] = useState(null);
  const [showDataModal, setShowDataModal] = useState(false);
  const [householdData, setHouseholdData] = useState(null);
  const [formData, setFormData] = useState({
    energyUsage: "",
    waterUsage: "",
    wasteGenerated: "",
    transportation: "",
    commuteDistance: "",
    location: "",
  });
  const [savingData, setSavingData] = useState(false);

  const loadHouseholdData = async () => {
    try {
      const res = await fetch("/api/resident/household-data");
      const data = await res.json();
      if (res.ok && data.householdData) {
        setHouseholdData(data.householdData);
        setFormData({
          energyUsage: data.householdData.energyUsage || "",
          waterUsage: data.householdData.waterUsage || "",
          wasteGenerated: data.householdData.wasteGenerated || "",
          transportation: data.householdData.transportation || "",
          commuteDistance: data.householdData.commuteDistance || "",
          location: data.householdData.location || "",
        });
      }
    } catch (err) {
      console.error("Load household data error:", err);
    }
  };

  const saveHouseholdData = async () => {
    try {
      setSavingData(true);
      const res = await fetch("/api/resident/household-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to save");
      setHouseholdData(data.householdData);
      setShowDataModal(false);
    } catch (err) {
      console.error("Save error:", err);
      alert(err.message || "Failed to save data");
    } finally {
      setSavingData(false);
    }
  };

  const handleDataFormChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleOpenDataModal = async () => {
    await loadHouseholdData();
    setShowDataModal(true);
  };

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
      setMemberCommunity(rData.memberCommunity || null);
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

  useEffect(() => {
    if (isMember) {
      loadHouseholdData();
    }
  }, [isMember]);

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

  if (isMember && memberCommunity) {
    return (
      <div className="p-8">
        <div className="mb-6 flex justify-between items-start">
          <div>
            <h2 className="text-3xl font-bold">{memberCommunity.name}</h2>
            <p className="text-gray-600 mt-2">{memberCommunity.description}</p>
          </div>
          <Button
            onClick={handleOpenDataModal}
            className="bg-blue-600 hover:bg-blue-700 text-white whitespace-nowrap"
          >
            Household Data
          </Button>
        </div>

        {/* Household Data Summary */}
        {householdData && (
          <div className="mb-8 grid gap-4 md:grid-cols-4">
            <Card className="p-4">
              <CardHeader>
                <CardTitle className="text-sm">Energy Use</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {householdData.energyUsage}
                </p>
                <p className="text-xs text-gray-500">kWh/month</p>
              </CardContent>
            </Card>
            <Card className="p-4">
              <CardHeader>
                <CardTitle className="text-sm">Transportation</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {householdData.transportation}
                </p>
                <p className="text-xs text-gray-500">km/month</p>
              </CardContent>
            </Card>
            <Card className="p-4">
              <CardHeader>
                <CardTitle className="text-sm">Waste</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {householdData.wasteGenerated}
                </p>
                <p className="text-xs text-gray-500">kg/month</p>
              </CardContent>
            </Card>
            <Card className="p-4">
              <CardHeader>
                <CardTitle className="text-sm">Water Use</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{householdData.waterUsage}</p>
                <p className="text-xs text-gray-500">gallons/month</p>
              </CardContent>
            </Card>
            <Card className="p-4">
              <CardHeader>
                <CardTitle className="text-sm">Commute Distance</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {householdData.commuteDistance}
                </p>
                <p className="text-xs text-gray-500">km</p>
              </CardContent>
            </Card>
            <Card className="p-4">
              <CardHeader>
                <CardTitle className="text-sm">Location</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {householdData.location || "—"}
                </p>
                <p className="text-xs text-gray-500">Location</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Community Info */}
        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <Card className="p-4">
            <CardHeader>
              <CardTitle className="text-sm">Total Members</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">
                {memberCommunity.memberCount}
              </p>
            </CardContent>
          </Card>

          <Card className="p-4">
            <CardHeader>
              <CardTitle className="text-sm">Community Leader</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-medium">
                {memberCommunity.leader?.name || memberCommunity.leader?.email}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {memberCommunity.leader?.email}
              </p>
            </CardContent>
          </Card>

          <Card className="p-4">
            <CardHeader>
              <CardTitle className="text-sm">Member Status</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-semibold text-green-600">Active</p>
            </CardContent>
          </Card>
        </div>

        {/* Members List */}
        <div className="max-w-4xl">
          <h3 className="text-2xl font-bold mb-4">Community Members</h3>
          {memberCommunity.members && memberCommunity.members.length > 0 ? (
            <div className="space-y-3">
              {memberCommunity.members.map((member) => (
                <Card key={member.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">
                        {member.user?.name || member.user?.email || "Unknown"}
                      </p>
                      <p className="text-sm text-gray-500">
                        {member.user?.email}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Joined {new Date(member.joinedAt).toLocaleDateString()}
                      </p>
                    </div>
                    {memberCommunity.leader?.id === member.user?.id && (
                      <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800">
                        Leader
                      </span>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-gray-600">No members yet.</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Household Data Modal */}
        {showDataModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Household Data</CardTitle>
                  <button
                    onClick={() => setShowDataModal(false)}
                    className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
                  >
                    ×
                  </button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Energy Usage (kWh/month)
                  </label>
                  <input
                    type="number"
                    placeholder="e.g., 500"
                    value={formData.energyUsage}
                    onChange={(e) =>
                      handleDataFormChange("energyUsage", e.target.value)
                    }
                    className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Water Usage (gallons/month)
                  </label>
                  <input
                    type="number"
                    placeholder="e.g., 5000"
                    value={formData.waterUsage}
                    onChange={(e) =>
                      handleDataFormChange("waterUsage", e.target.value)
                    }
                    className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Waste Generated (kg/month)
                  </label>
                  <input
                    type="number"
                    placeholder="e.g., 50"
                    value={formData.wasteGenerated}
                    onChange={(e) =>
                      handleDataFormChange("wasteGenerated", e.target.value)
                    }
                    className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Transportation Mode (e.g., car, bus, bike)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., car, public transit"
                    value={formData.transportation}
                    onChange={(e) =>
                      handleDataFormChange("transportation", e.target.value)
                    }
                    className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Commute Distance (km)
                  </label>
                  <input
                    type="number"
                    placeholder="e.g., 25"
                    value={formData.commuteDistance}
                    onChange={(e) =>
                      handleDataFormChange("commuteDistance", e.target.value)
                    }
                    className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Location/Address
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Downtown, Suburbs"
                    value={formData.location}
                    onChange={(e) =>
                      handleDataFormChange("location", e.target.value)
                    }
                    className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={() => setShowDataModal(false)}
                    variant="outline"
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={saveHouseholdData}
                    disabled={savingData}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {savingData ? "Saving..." : "Save Data"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
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
                        expandedCommunity === c.id ? null : c.id,
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
                              {member.user?.name ||
                                member.user?.email ||
                                "Unknown"}
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

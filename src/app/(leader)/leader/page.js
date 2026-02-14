"use client";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label, LabelInputContainer } from "@/components/ui/input";
import { Error } from "@/components/ui/error";
import { toast } from "sonner";
import { BottomGradient } from "@/components/ui/bottom-gradient";
import { authClient } from "@/lib/auth-client";
import Link from "next/link";

const communitySchema = z.object({
  name: z
    .string()
    .min(3, "Community name must be at least 3 characters")
    .max(100, "Community name must be less than 100 characters"),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(500, "Description must be less than 500 characters"),
  resourceUsage: z
    .string()
    .min(10, "Please provide details about resource usage")
    .max(1000, "Resource usage description is too long"),
  infrastructure: z
    .string()
    .min(10, "Please provide details about infrastructure")
    .max(1000, "Infrastructure description is too long"),
  environmentalConcerns: z
    .string()
    .min(10, "Please provide details about environmental concerns")
    .max(1000, "Environmental concerns description is too long"),
});

function CreateCommunity({ onCommunityCreated, userId }) {
  const form = useForm({
    defaultValues: {
      name: "",
      description: "",
      resourceUsage: "",
      infrastructure: "",
      environmentalConcerns: "",
    },
    resolver: zodResolver(communitySchema),
  });

  const onSubmit = async (data) => {
    const toastId = toast.loading("Creating community...");

    try {
      const response = await fetch("/api/community/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: data.name,
          description: data.description,
          resourceUsage: data.resourceUsage,
          infrastructure: data.infrastructure,
          environmentalConcerns: data.environmentalConcerns,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.errors?.[0] || "Failed to create community");
      }

      toast.dismiss(toastId);
      toast.success("Community created successfully!");
      form.reset();
      // Give a slight delay before refreshing
      setTimeout(() => {
        onCommunityCreated();
      }, 1000);
    } catch (error) {
      toast.dismiss(toastId);
      toast.error(error.message || "Failed to create community");
    }
  };

  const isPending = form.formState.isSubmitting;

  return (
    <Card className="mx-auto w-full max-w-2xl border-0 shadow-lg">
      <CardHeader className="text-center bg-gradient-to-b from-primary/10 to-transparent pb-6">
        <CardTitle className="text-2xl text-gray-900">
          Create a Community
        </CardTitle>
        <CardDescription className="mt-2 text-gray-700">
          Share information about your community, resources, infrastructure, and environmental concerns
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <LabelInputContainer>
            <Label htmlFor="name" className="text-gray-900 font-medium">
              Community Name
            </Label>
            <Error enabled={!!form.formState.errors.name}>
              {form.formState.errors.name?.message}
            </Error>
            <Input
              {...form.register("name")}
              id="name"
              type="text"
              placeholder="Enter community name"
              disabled={isPending}
              className="placeholder:text-neutral-500"
            />
          </LabelInputContainer>

          <LabelInputContainer>
            <Label htmlFor="description" className="text-gray-900 font-medium">
              Description
            </Label>
            <Error enabled={!!form.formState.errors.description}>
              {form.formState.errors.description?.message}
            </Error>
            <textarea
              {...form.register("description")}
              id="description"
              placeholder="Describe your community..."
              disabled={isPending}
              className="placeholder:text-neutral-500 rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm text-gray-900 placeholder-neutral-500 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:bg-neutral-100"
              rows={3}
            />
          </LabelInputContainer>

          <LabelInputContainer>
            <Label
              htmlFor="resourceUsage"
              className="text-gray-900 font-medium"
            >
              Resource Usage
            </Label>
            <p className="text-xs text-gray-600 mt-1">
              Describe water, energy, and waste usage patterns
            </p>
            <Error enabled={!!form.formState.errors.resourceUsage}>
              {form.formState.errors.resourceUsage?.message}
            </Error>
            <textarea
              {...form.register("resourceUsage")}
              id="resourceUsage"
              placeholder="E.g., Average daily water consumption, electricity usage, waste management practices..."
              disabled={isPending}
              className="placeholder:text-neutral-500 rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm text-gray-900 placeholder-neutral-500 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:bg-neutral-100"
              rows={3}
            />
          </LabelInputContainer>

          <LabelInputContainer>
            <Label
              htmlFor="infrastructure"
              className="text-gray-900 font-medium"
            >
              Infrastructure
            </Label>
            <p className="text-xs text-gray-600 mt-1">
              Describe existing infrastructure and facilities
            </p>
            <Error enabled={!!form.formState.errors.infrastructure}>
              {form.formState.errors.infrastructure?.message}
            </Error>
            <textarea
              {...form.register("infrastructure")}
              id="infrastructure"
              placeholder="E.g., Water systems, power grids, transportation, public facilities, green spaces..."
              disabled={isPending}
              className="placeholder:text-neutral-500 rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm text-gray-900 placeholder-neutral-500 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:bg-neutral-100"
              rows={3}
            />
          </LabelInputContainer>

          <LabelInputContainer>
            <Label
              htmlFor="environmentalConcerns"
              className="text-gray-900 font-medium"
            >
              Environmental Concerns
            </Label>
            <p className="text-xs text-gray-600 mt-1">
              List primary environmental issues in your community
            </p>
            <Error enabled={!!form.formState.errors.environmentalConcerns}>
              {form.formState.errors.environmentalConcerns?.message}
            </Error>
            <textarea
              {...form.register("environmentalConcerns")}
              id="environmentalConcerns"
              placeholder="E.g., Air quality concerns, water pollution, deforestation, waste management issues, climate impacts..."
              disabled={isPending}
              className="placeholder:text-neutral-500 rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm text-gray-900 placeholder-neutral-500 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:bg-neutral-100"
              rows={3}
            />
          </LabelInputContainer>

          <Button
            type="submit"
            disabled={isPending}
            className="bg-primary hover:bg-primary/90 group/btn w-full cursor-pointer text-white disabled:opacity-50"
          >
            {isPending ? "Creating..." : "Create Community"}
            <BottomGradient />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function CommunityInfo({ community }) {
  return (
    <div className="mx-auto max-w-3xl w-full">
      <Card className="border border-neutral-200 shadow-md bg-white">
        <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5 pb-6 rounded-t-lg">
          <CardTitle className="text-2xl font-bold text-gray-900 flex flex-col sm:flex-row sm:items-baseline gap-2">
            <span>{community.name}</span>
            <span className="ml-0 sm:ml-4 px-3 py-1 text-xs bg-primary/10 text-primary-700 rounded-full font-medium tracking-wide">
              Community
            </span>
          </CardTitle>
          <CardDescription className="mt-2 text-base text-gray-700">
            {community.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
            <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-6">
              <p className="text-xs font-medium text-neutral-600 uppercase tracking-wide">
                Community ID
              </p>
              <p className="mt-2 font-mono text-sm text-gray-900 break-all">
                {community.id}
              </p>
            </div>
            <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-6">
              <p className="text-xs font-medium text-neutral-600 uppercase tracking-wide">
                Total Members
              </p>
              <p className="mt-2 text-3xl font-bold text-primary-700">
                {community.memberCount}
              </p>
            </div>
          </div>

          <div className="space-y-4 pt-2">
            <div className="rounded-lg border border-neutral-100 bg-white p-5">
              <h4 className="text-lg font-semibold text-gray-800 mb-1 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary/50"></span>
                Resource Usage
              </h4>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {community.resourceUsage}
              </p>
            </div>

            <div className="rounded-lg border border-neutral-100 bg-white p-5">
              <h4 className="text-lg font-semibold text-gray-800 mb-1 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary/50"></span>
                Infrastructure
              </h4>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {community.infrastructure}
              </p>
            </div>

            <div className="rounded-lg border border-neutral-100 bg-white p-5">
              <h4 className="text-lg font-semibold text-gray-800 mb-1 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary/50"></span>
                Environmental Concerns
              </h4>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {community.environmentalConcerns}
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <Link href="/leader/members" className="flex-1">
              <Button className="bg-primary hover:bg-primary/90 text-white w-full">
                Manage Members
              </Button>
            </Link>
            <Button variant="outline" className="border-neutral-300 flex-1">
              Community Settings
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function LeaderPage() {
  const [loading, setLoading] = useState(true);
  const [hasCommunity, setHasCommunity] = useState(false);
  const [community, setCommunity] = useState(null);
  const [userId, setUserId] = useState(null);
  const [error, setError] = useState(null);

  const fetchCommunityStatus = async (currentUserId) => {
    try {
      const res = await fetch("/api/leader-community", { cache: "no-store" });
      const data = await res.json();
      setHasCommunity(data.hasCommunity);
      if (data.hasCommunity) {
        setCommunity(data.community);
      }
      setLoading(false);
    } catch (error) {
      console.error("Error fetching community:", error);
      setError(error.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    const getSession = async () => {
      try {
        const { data: session } = await authClient.getSession();
        console.log(session);
        if (session?.user?.id) {
          setUserId(session.user.id);
          await fetchCommunityStatus(session.user.id);
        } else {
          // If no session, still try to fetch (will fail if not authenticated)
          await fetchCommunityStatus(null);
        }
      } catch (err) {
        console.error("Session error:", err);
        setError("Failed to load session");
        setLoading(false);
      }
    };
    getSession();
  }, []);

  if (error) {
    return (
      <div className="flex min-h-dvh w-full items-center justify-center p-4 bg-white">
        <Card className="w-full max-w-md border-0 shadow-lg">
          <CardHeader className="text-center bg-red-50">
            <CardTitle className="text-red-600">
              Error Loading Dashboard
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <p className="text-center text-gray-700">{error}</p>
            <Button
              onClick={() => window.location.reload()}
              className="mt-4 w-full bg-primary text-white"
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-dvh w-full items-center justify-center bg-white">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-neutral-300 border-t-primary"></div>
          <p className="mt-4 text-lg font-medium text-gray-900">Loading...</p>
        </div>
      </div>
    );
  }

  if (!hasCommunity) {
    return (
      <div className="min-h-dvh w-full bg-white flex items-center justify-center p-4">
        {userId ? (
          <CreateCommunity
            onCommunityCreated={() => fetchCommunityStatus(userId)}
            userId={userId}
          />
        ) : (
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <CardTitle>Loading User</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-center text-neutral-600">
                Please wait while we load your profile...
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-dvh w-full bg-gradient-to-br from-white via-neutral-50 to-primary/10">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-10">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900">
            Dashboard
          </h1>
          <p className="mt-3 text-lg text-gray-600">Manage your community</p>
        </div>
        {community && <CommunityInfo community={community} />}
      </div>
    </div>
  );
}

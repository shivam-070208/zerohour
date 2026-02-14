"use client";

import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import { BottomGradient } from "@/components/ui/bottom-gradient";
import { useRouter } from "next/navigation";

const RoleOptions = [
  {
    id: "RESIDENT",
    title: "Resident",
    description: "Browse communities and join as a member",
    icon: "👤",
  },
  {
    id: "COMMUNITY_LEADER",
    title: "Community Leader",
    description: "Create and manage your own community",
    icon: "👥",
  },
];

export default function SetRolePage() {
  const [selectedRole, setSelectedRole] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSelectRole = async (roleId) => {
    setSelectedRole(roleId);
    setIsLoading(true);
    const toastId = toast.loading("Setting your role...");

    try {
      const response = await fetch("/api/auth/set-role", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ role: roleId }),
      });

      if (!response.ok) {
        throw new Error("Failed to set role");
      }

      toast.dismiss(toastId);
      toast.success("Role set successfully!");

      // Redirect based on role
      setTimeout(() => {
        if (roleId === "RESIDENT") {
          router.push("/resident");
        } else if (roleId === "COMMUNITY_LEADER") {
          router.push("/leader");
        }
      }, 1000);
    } catch (error) {
      toast.dismiss(toastId);
      toast.error(error.message || "Failed to set role");
      setIsLoading(false);
      setSelectedRole(null);
    }
  };

  return (
    <Card className="mx-auto w-full max-w-2xl">
      <CardHeader className="text-center">
        <Image
          src="/logo.png"
          height={80}
          width={140}
          alt="logo"
          className="mx-auto"
        />
        <CardTitle>Choose Your Role</CardTitle>
        <CardDescription>
          Select how you want to participate in the community
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2">
          {RoleOptions.map((option) => (
            <button
              key={option.id}
              onClick={() => handleSelectRole(option.id)}
              disabled={isLoading}
              className={`group relative overflow-hidden rounded-lg border-2 p-6 text-left transition-all duration-300 ${
                selectedRole === option.id
                  ? "border-primary bg-primary/10"
                  : "border-neutral-200 hover:border-primary hover:bg-neutral-50"
              } ${isLoading ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="mb-2 text-3xl">{option.icon}</div>
                  <h3 className="text-lg font-semibold">{option.title}</h3>
                  <p className="mt-2 text-sm text-neutral-600">
                    {option.description}
                  </p>
                </div>
                {selectedRole === option.id && (
                  <div className="ml-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary">
                    <span className="text-white">✓</span>
                  </div>
                )}
              </div>
              <BottomGradient />
            </button>
          ))}
        </div>

        {selectedRole && (
          <div className="mt-6 text-center">
            <p className="mb-4 text-sm text-neutral-600">
              Proceeding as{" "}
              <span className="font-semibold">
                {RoleOptions.find((r) => r.id === selectedRole)?.title}
              </span>
            </p>
          </div>
        )}

        <div className="mt-6 text-center text-sm text-neutral-600">
          <p>You can change your role later in your account settings</p>
        </div>
      </CardContent>
    </Card>
  );
}

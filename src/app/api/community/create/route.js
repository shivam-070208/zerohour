import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/db";
import { authRequire } from "@/lib/auth-utils";
import { Role } from "@/generated/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

function validateBody(body) {
  const errors = [];
  
  if (!body || typeof body !== "object") {
    errors.push("Invalid JSON body");
    return errors;
  }
  if (!body.name || typeof body.name !== "string" || !body.name.trim()) {
    errors.push("'name' is required and must be a non-empty string");
  }
  if (!body.description || typeof body.description !== "string") {
    errors.push("'description' is required and must be a string");
  }
  if (!body.resourceUsage || typeof body.resourceUsage !== "string") {
    errors.push("'resourceUsage' is required and must be a string");
  }
  if (!body.infrastructure || typeof body.infrastructure !== "string") {
    errors.push("'infrastructure' is required and must be a string");
  }
  if (
    !body.environmentalConcerns ||
    typeof body.environmentalConcerns !== "string"
  ) {
    errors.push("'environmentalConcerns' is required and must be a string");
  }
  // leaderId should be determined from auth/session, not client
  if (body.leaderId) {
    errors.push("'leaderId' should not be provided by client");
  }
  // Remove 'location' validation as it is not part of schema (error points out it's unknown)
  if (
    body.establishedYear !== undefined &&
    (!Number.isInteger(body.establishedYear) || body.establishedYear < 0)
  ) {
    errors.push("'establishedYear' must be a positive integer if provided");
  }
  return errors;
}



async function getUserById(userId) {
  if (!userId) return null;
  return await prisma.user.findUnique({
    where: { id: userId },
  });
}



export async function POST(request) {
  // Enforce authentication and get session
  await authRequire();
  let body;
  try {
    body = await request.json();
  } catch (e) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const errors = validateBody(body);
  if (errors.length) {
    return NextResponse.json({ errors }, { status: 400 });
  }

  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let userRole = session.user.role;
  if (!userRole) {
    const user = await getUserById(session.user.id);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    userRole = user.role;
    session.user.role = userRole;
  }
  // Only allow if the session user is a COMMUNITY_LEADER
  if (session.user.role !== Role.COMMUNITY_LEADER) {
    return NextResponse.json(
      { error: "Forbidden: Only community leaders can create a community" },
      { status: 403 },
    );
  }

  // Remove 'location' from payload because it's not in the schema
  // Only include fields that exist on the Community model (see error details)
  const payload = {
    id: randomUUID(),
    name: body.name.trim(),
    description: body.description,
    resourceUsage: body.resourceUsage,
    infrastructure: body.infrastructure,
    environmentalConcerns: body.environmentalConcerns,
    leaderId: session.user.id,
  };

  try {
    const created = await prisma.Community.create({ data: payload });
    return NextResponse.json({ community: created }, { status: 201 });
  } catch (e) {
    // Prisma error handling
    return NextResponse.json(
      { error: e?.message || "Failed to create community" },
      { status: 500 },
    );
  }
}

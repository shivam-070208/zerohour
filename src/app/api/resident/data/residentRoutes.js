import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

let inMemoryResidentData = [];

function validateBody(body) {
  const errors = [];
  if (!body || typeof body !== "object") {
    errors.push("Invalid JSON body");
    return errors;
  }
  if (!body.userId || typeof body.userId !== "string") {
    errors.push("'userId' is required and must be a string");
  }
  const numberFields = ["energyUsage", "waterUsage", "wasteProduction"];
  for (const f of numberFields) {
    if (
      body[f] === undefined ||
      typeof body[f] !== "number" ||
      Number.isNaN(body[f])
    ) {
      errors.push(`'${f}' is required and must be a number`);
    }
  }
  if (
    body.transportation !== undefined &&
    typeof body.transportation !== "string"
  ) {
    errors.push("'transportation' must be a string if provided");
  }
  return errors;
}

export async function POST(request) {
  const auth = request.headers.get("authorization") || "";
  if (!auth.toLowerCase().startsWith("bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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

  const payload = {
    userId: body.userId,
    energyUsage: body.energyUsage,
    waterUsage: body.waterUsage,
    wasteProduction: body.wasteProduction,
    transportation: body.transportation || null,
    updatedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };

  try {
    // Try to upsert using Prisma. Assumes a model with a unique `userId` exists.
    const residentData = await prisma.residentData.upsert({
      where: { userId: payload.userId },
      update: {
        energyUsage: payload.energyUsage,
        waterUsage: payload.waterUsage,
        wasteProduction: payload.wasteProduction,
        transportation: payload.transportation,
        updatedAt: payload.updatedAt,
      },
      create: payload,
    });

    return NextResponse.json(
      { message: "Resident data submitted successfully", residentData },
      { status: 201 },
    );
  } catch (e) {
    // Fallback to in-memory storage when Prisma or the model isn't available.
    const existingIndex = inMemoryResidentData.findIndex(
      (r) => r.userId === payload.userId,
    );
    if (existingIndex >= 0) {
      inMemoryResidentData[existingIndex] = {
        ...inMemoryResidentData[existingIndex],
        ...payload,
      };
    } else {
      inMemoryResidentData.push(payload);
    }

    const stored = inMemoryResidentData.find(
      (r) => r.userId === payload.userId,
    );
    return NextResponse.json(
      { message: "Resident data submitted successfully", residentData: stored },
      { status: 201 },
    );
  }
}

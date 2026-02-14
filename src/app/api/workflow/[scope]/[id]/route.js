import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export async function GET(request, { params }) {
  const { scope, id } = params;
  try {
    const file = path.join(
      process.cwd(),
      "public",
      "workflows",
      `${scope}-${id}.json`,
    );
    const data = await fs.readFile(file, "utf8");
    const json = JSON.parse(data);
    return NextResponse.json({ plan: json });
  } catch (e) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}

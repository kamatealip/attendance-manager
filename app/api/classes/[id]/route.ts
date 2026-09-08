import { NextResponse } from "next/server";
import { updateClass } from "../../../../lib/db/classes";

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  const id = Number((await context.params).id);
  if (!Number.isInteger(id) || id <= 0) return NextResponse.json({ error: "Invalid class id" }, { status: 400 });
  try {
    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const section = typeof body.section === "string" ? body.section.trim() : "";
    const academicYear = typeof body.academicYear === "string" ? body.academicYear.trim() : "";
    if (!name || !section || !academicYear) return NextResponse.json({ error: "name, section and academicYear are required" }, { status: 400 });
    const record = await updateClass(id, name, section, academicYear);
    if (!record) return NextResponse.json({ error: "Class not found" }, { status: 404 });
    return NextResponse.json({ data: record });
  } catch (error) {
    console.error("Failed to update class", error);
    return NextResponse.json({ error: "Unable to update class" }, { status: 500 });
  }
}

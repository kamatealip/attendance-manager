import { NextResponse } from "next/server";

import { createClass, listClasses } from "../../../lib/db/classes";

export async function GET() {
  try {
    const classes = await listClasses();
    return NextResponse.json({ data: classes });
  } catch (error) {
    console.error("Failed to list classes", error);
    return NextResponse.json({ error: "Unable to load classes" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const section = typeof body.section === "string" ? body.section.trim() : "";
    const academicYear = typeof body.academicYear === "string" ? body.academicYear.trim() : "";

    if (!name || !section || !academicYear) {
      return NextResponse.json(
        { error: "name, section and academicYear are required" },
        { status: 400 },
      );
    }

    const record = await createClass(name, section, academicYear);
    return NextResponse.json({ data: record }, { status: 201 });
  } catch (error) {
    console.error("Failed to create class", error);
    return NextResponse.json({ error: "Unable to create class" }, { status: 500 });
  }
}

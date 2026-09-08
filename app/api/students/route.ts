import { NextResponse } from "next/server";

import { createStudent, listStudents } from "../../../lib/db/students";

export async function GET(request: Request) {
  try {
    const classIdValue = new URL(request.url).searchParams.get("classId");
    const classId = classIdValue ? Number(classIdValue) : undefined;

    if (classIdValue && (!Number.isInteger(classId) || classId <= 0)) {
      return NextResponse.json({ error: "classId must be a positive integer" }, { status: 400 });
    }

    const students = await listStudents(classId);
    return NextResponse.json({ data: students });
  } catch (error) {
    console.error("Failed to list students", error);
    return NextResponse.json({ error: "Unable to load students" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const rollNumber = typeof body.rollNumber === "string" ? body.rollNumber.trim() : "";
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const classId = Number(body.classId);

    if (!rollNumber || !name || !Number.isInteger(classId) || classId <= 0) {
      return NextResponse.json(
        { error: "rollNumber, name and a valid classId are required" },
        { status: 400 },
      );
    }

    const student = await createStudent(rollNumber, name, classId);
    return NextResponse.json({ data: student }, { status: 201 });
  } catch (error) {
    console.error("Failed to create student", error);
    return NextResponse.json({ error: "Unable to create student" }, { status: 500 });
  }
}

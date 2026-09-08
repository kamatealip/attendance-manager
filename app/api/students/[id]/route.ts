import { NextResponse } from "next/server";
import { deactivateStudent, updateStudent } from "../../../../lib/db/students";

function parseId(value: string) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  const id = parseId((await context.params).id);
  if (!id) return NextResponse.json({ error: "Invalid student id" }, { status: 400 });
  try {
    const body = await request.json();
    const rollNumber = typeof body.rollNumber === "string" ? body.rollNumber.trim() : "";
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const classId = Number(body.classId);
    if (!rollNumber || !name || !Number.isInteger(classId) || classId <= 0) return NextResponse.json({ error: "rollNumber, name and a valid classId are required" }, { status: 400 });
    const student = await updateStudent(id, rollNumber, name, classId);
    if (!student) return NextResponse.json({ error: "Student not found" }, { status: 404 });
    return NextResponse.json({ data: student });
  } catch (error) {
    console.error("Failed to update student", error);
    return NextResponse.json({ error: "Unable to update student" }, { status: 500 });
  }
}

export async function DELETE(_: Request, context: { params: Promise<{ id: string }> }) {
  const id = parseId((await context.params).id);
  if (!id) return NextResponse.json({ error: "Invalid student id" }, { status: 400 });
  try {
    const student = await deactivateStudent(id);
    if (!student) return NextResponse.json({ error: "Student not found" }, { status: 404 });
    return NextResponse.json({ data: student });
  } catch (error) {
    console.error("Failed to deactivate student", error);
    return NextResponse.json({ error: "Unable to deactivate student" }, { status: 500 });
  }
}

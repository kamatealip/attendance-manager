import { NextResponse } from "next/server";

import {
  listAttendanceByDate,
  upsertAttendance,
  type AttendanceStatus,
} from "../../../lib/db/attendance";

const statuses: AttendanceStatus[] = ["present", "absent", "late"];

function isDate(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export async function GET(request: Request) {
  const date = new URL(request.url).searchParams.get("date");

  if (!isDate(date)) {
    return NextResponse.json({ error: "A date in YYYY-MM-DD format is required" }, { status: 400 });
  }

  try {
    const records = await listAttendanceByDate(date);
    return NextResponse.json({ data: records });
  } catch (error) {
    console.error("Failed to list attendance", error);
    return NextResponse.json({ error: "Unable to load attendance" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const studentId = Number(body.studentId);
    const date = body.date;
    const status = body.status as AttendanceStatus;

    if (!Number.isInteger(studentId) || studentId <= 0 || !isDate(date) || !statuses.includes(status)) {
      return NextResponse.json(
        { error: "studentId, date and a valid attendance status are required" },
        { status: 400 },
      );
    }

    const record = await upsertAttendance(studentId, date, status);
    return NextResponse.json({ data: record }, { status: 200 });
  } catch (error) {
    console.error("Failed to save attendance", error);
    return NextResponse.json({ error: "Unable to save attendance" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";

import {
  bulkUpsertAttendance,
  type AttendanceStatus,
} from "../../../../../lib/db/attendance";

const statuses: AttendanceStatus[] = ["present", "absent", "late"];

function isDate(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const date = body.date;
    const records = body.records;

    if (!isDate(date) || !Array.isArray(records) || records.length === 0 || records.length > 500) {
      return NextResponse.json(
        { error: "date and a non-empty records array are required" },
        { status: 400 },
      );
    }

    const seen = new Set<number>();
    const normalized = records.map((record: unknown) => {
      if (!record || typeof record !== "object") throw new Error("invalid record");
      const value = record as Record<string, unknown>;
      const studentId = Number(value.studentId);
      const status = value.status as AttendanceStatus;
      if (!Number.isInteger(studentId) || studentId <= 0 || seen.has(studentId) || !statuses.includes(status)) {
        throw new Error("invalid record");
      }
      seen.add(studentId);
      return { studentId, status };
    });

    const saved = await bulkUpsertAttendance(date, normalized);
    return NextResponse.json({ data: saved });
  } catch (error) {
    if (error instanceof Error && error.message === "invalid record") {
      return NextResponse.json(
        { error: "Each record needs a unique positive studentId and valid attendance status" },
        { status: 400 },
      );
    }

    console.error("Failed to bulk save attendance", error);
    return NextResponse.json({ error: "Unable to save attendance" }, { status: 500 });
  }
}

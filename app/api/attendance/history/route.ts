import { NextResponse } from "next/server";

import { listAttendanceHistory } from "../../../../../lib/db/attendance";

export async function GET() {
  try {
    const records = await listAttendanceHistory();
    return NextResponse.json({ data: records });
  } catch (error) {
    console.error("Failed to list attendance history", error);
    return NextResponse.json({ error: "Unable to load attendance history" }, { status: 500 });
  }
}

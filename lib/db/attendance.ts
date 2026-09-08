import { sql } from "../db";

export type AttendanceStatus = "present" | "absent" | "late";

export type AttendanceRecord = {
  id: number;
  studentId: number;
  attendanceDate: string;
  status: AttendanceStatus;
};

export async function listAttendanceByDate(date: string) {
  return sql<AttendanceRecord[]>`
    SELECT
      id,
      student_id AS "studentId",
      attendance_date::text AS "attendanceDate",
      status
    FROM attendance_records
    WHERE attendance_date = ${date}::date
    ORDER BY student_id
  `;
}

export async function upsertAttendance(
  studentId: number,
  date: string,
  status: AttendanceStatus,
) {
  const [record] = await sql<AttendanceRecord[]>`
    INSERT INTO attendance_records (student_id, attendance_date, status)
    VALUES (${studentId}, ${date}::date, ${status})
    ON CONFLICT (student_id, attendance_date)
    DO UPDATE SET status = EXCLUDED.status, updated_at = NOW()
    RETURNING
      id,
      student_id AS "studentId",
      attendance_date::text AS "attendanceDate",
      status
  `;

  return record;
}

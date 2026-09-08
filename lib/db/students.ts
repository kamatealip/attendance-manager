import { sql } from "../db";

export type Student = { id: number; rollNumber: string; name: string; classId: number; active: boolean };

export async function listStudents(classId?: number) {
  if (classId) return sql<Student[]>`SELECT id, roll_number AS "rollNumber", name, class_id AS "classId", active FROM students WHERE class_id = ${classId} AND active = TRUE ORDER BY roll_number`;
  return sql<Student[]>`SELECT id, roll_number AS "rollNumber", name, class_id AS "classId", active FROM students WHERE active = TRUE ORDER BY class_id, roll_number`;
}

export async function createStudent(rollNumber: string, name: string, classId: number) {
  const [student] = await sql<Student[]>`INSERT INTO students (roll_number, name, class_id) VALUES (${rollNumber}, ${name}, ${classId}) RETURNING id, roll_number AS "rollNumber", name, class_id AS "classId", active`;
  return student;
}

export async function updateStudent(id: number, rollNumber: string, name: string, classId: number) {
  const [student] = await sql<Student[]>`UPDATE students SET roll_number = ${rollNumber}, name = ${name}, class_id = ${classId} WHERE id = ${id} AND active = TRUE RETURNING id, roll_number AS "rollNumber", name, class_id AS "classId", active`;
  return student;
}

export async function deactivateStudent(id: number) {
  const [student] = await sql<Student[]>`UPDATE students SET active = FALSE WHERE id = ${id} AND active = TRUE RETURNING id, roll_number AS "rollNumber", name, class_id AS "classId", active`;
  return student;
}

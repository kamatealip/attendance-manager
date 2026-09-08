import { sql } from "../db";

export type ClassRecord = {
  id: number;
  name: string;
  section: string;
  academicYear: string;
};

export async function listClasses() {
  return sql<ClassRecord[]>`
    SELECT
      id,
      name,
      section,
      academic_year AS "academicYear"
    FROM classes
    ORDER BY academic_year DESC, name, section
  `;
}

export async function createClass(
  name: string,
  section: string,
  academicYear: string,
) {
  const [record] = await sql<ClassRecord[]>`
    INSERT INTO classes (name, section, academic_year)
    VALUES (${name}, ${section}, ${academicYear})
    ON CONFLICT (name, section, academic_year)
    DO UPDATE SET name = EXCLUDED.name
    RETURNING
      id,
      name,
      section,
      academic_year AS "academicYear"
  `;

  return record;
}

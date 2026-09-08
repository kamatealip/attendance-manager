INSERT INTO classes (name, section, academic_year)
VALUES ('Computer Science', 'A', '2026-27')
ON CONFLICT (name, section, academic_year) DO NOTHING;

INSERT INTO students (roll_number, name, class_id)
SELECT seed.roll_number, seed.name, classes.id
FROM (
  VALUES
    ('CS001', 'Aarav Sharma'),
    ('CS002', 'Diya Patel'),
    ('CS003', 'Rohan Mehta'),
    ('CS004', 'Ananya Desai'),
    ('CS005', 'Kabir Shah'),
    ('CS006', 'Ishita Joshi'),
    ('CS007', 'Arjun Kulkarni'),
    ('CS008', 'Meera Nair')
) AS seed(roll_number, name)
CROSS JOIN classes
WHERE classes.name = 'Computer Science'
  AND classes.section = 'A'
  AND classes.academic_year = '2026-27'
ON CONFLICT (class_id, roll_number) DO NOTHING;

"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Clock3, RotateCcw, UserCheck, UserX } from "lucide-react";
import { Button } from "@/components/ui/button";

type Status = "present" | "absent" | "late";
type Student = { id: number; name: string; rollNumber: string; classId: number };
type Record = { studentId: number; attendanceDate: string; status: Status };

const statusConfig: Record<Status, { label: string; className: string; icon: typeof Check }> = {
  present: { label: "Present", className: "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100", icon: Check },
  absent: { label: "Absent", className: "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100", icon: UserX },
  late: { label: "Late", className: "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100", icon: Clock3 },
};

function dateKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(date);
}

export default function Home() {
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<Record<number, Status | "unmarked">>({});
  const [today, setToday] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<number | null>(null);
  const [error, setError] = useState("");

  const load = async () => {
    const date = dateKey();
    setLoading(true);
    setError("");
    try {
      const [studentsResponse, attendanceResponse] = await Promise.all([
        fetch("/api/students", { cache: "no-store" }),
        fetch(`/api/attendance?date=${date}`, { cache: "no-store" }),
      ]);
      if (!studentsResponse.ok || !attendanceResponse.ok) throw new Error("Unable to load attendance data");
      const studentPayload = await studentsResponse.json();
      const attendancePayload = await attendanceResponse.json();
      const roster = studentPayload.data as Student[];
      const records = attendancePayload.data as Record[];
      const next: Record<number, Status | "unmarked"> = Object.fromEntries(roster.map((student) => [student.id, "unmarked"]));
      for (const record of records) next[record.studentId] = record.status;
      setStudents(roster);
      setAttendance(next);
    } catch {
      setError("Could not connect to the attendance database. Check DATABASE_URL and the database health endpoint.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setToday(formatDate(new Date()));
    void load();
  }, []);

  const summary = useMemo(() => {
    const values = Object.values(attendance);
    return {
      total: students.length,
      present: values.filter((s) => s === "present").length,
      absent: values.filter((s) => s === "absent").length,
      late: values.filter((s) => s === "late").length,
      unmarked: values.filter((s) => s === "unmarked").length,
    };
  }, [attendance, students.length]);

  const setStatus = async (studentId: number, status: Status) => {
    setSaving(studentId);
    setError("");
    try {
      const response = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId, date: dateKey(), status }),
      });
      if (!response.ok) throw new Error();
      setAttendance((current) => ({ ...current, [studentId]: status }));
    } catch {
      setError("Attendance could not be saved. Please try again.");
    } finally {
      setSaving(null);
    }
  };

  const markAllPresent = async () => {
    for (const student of students) await setStatus(student.id, "present");
  };

  const completion = summary.total ? Math.round(((summary.total - summary.unmarked) / summary.total) * 100) : 0;

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 text-slate-950 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:flex-row sm:items-end sm:justify-between">
          <div><p className="text-sm font-medium uppercase tracking-[0.2em] text-emerald-600">Attendance Manager</p><h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Daily Attendance</h1><p className="mt-2 text-sm text-slate-500">{today || "Today"} · PostgreSQL is now the source of truth.</p></div>
          <div className="flex flex-wrap gap-2"><Button variant="outline" onClick={() => void load()} disabled={loading}><RotateCcw />Refresh</Button><Button onClick={() => void markAllPresent()} disabled={loading || saving !== null}><UserCheck />Mark all present</Button></div>
        </header>

        {error && <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard label="Total students" value={summary.total} detail="Database roster" />
          <SummaryCard label="Present" value={summary.present} detail={`${completion}% attendance marked`} />
          <SummaryCard label="Absent" value={summary.absent} detail="Requires follow-up" />
          <SummaryCard label="Late" value={summary.late} detail={`${summary.unmarked} still unmarked`} />
        </section>

        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-2 border-b border-slate-200 px-6 py-5 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-lg font-semibold">Class roster</h2><p className="text-sm text-slate-500">Changes are saved directly to PostgreSQL.</p></div><div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{completion}% complete</div></div>
          {loading ? <div className="px-6 py-12 text-center text-sm text-slate-500">Loading roster and attendance…</div> : <div className="divide-y divide-slate-100">{students.map((student) => { const status = attendance[student.id]; return <div key={student.id} className="flex flex-col gap-4 px-6 py-5 lg:flex-row lg:items-center lg:justify-between"><div className="flex min-w-0 items-center gap-4"><div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-sm font-semibold text-slate-700">{student.rollNumber}</div><div className="min-w-0"><p className="truncate font-semibold text-slate-900">{student.name}</p><p className="mt-1 text-sm text-slate-500">Student #{student.id}</p></div></div><div className="flex flex-wrap items-center gap-2">{Object.entries(statusConfig).map(([key, config]) => { const Icon = config.icon; const selected = status === key; return <button key={key} type="button" aria-pressed={selected} disabled={saving === student.id} onClick={() => void setStatus(student.id, key as Status)} className={`inline-flex h-9 items-center gap-2 rounded-full border px-3 text-sm font-medium transition ${config.className} ${selected ? "ring-2 ring-slate-900/10 ring-offset-1" : "opacity-70 hover:opacity-100"}`}>{<Icon />}{config.label}</button>; })}</div></div>; })}</div>}
        </section>
      </div>
    </main>
  );
}

function SummaryCard({ label, value, detail }: { label: string; value: number; detail: string }) {
  return <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-sm font-medium text-slate-500">{label}</p><div className="mt-3 flex items-end justify-between gap-4"><p className="text-3xl font-bold tracking-tight">{value}</p><div className="flex size-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-600"><UserCheck /></div></div><p className="mt-2 text-xs text-slate-400">{detail}</p></article>;
}

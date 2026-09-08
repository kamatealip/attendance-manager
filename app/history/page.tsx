"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, CalendarDays, Check, Clock3, Download, TrendingUp, UserX } from "lucide-react";
import { Button } from "@/components/ui/button";

type Status = "present" | "absent" | "late";
type Row = { studentId: number; studentName: string; rollNumber: string; attendanceDate: string; status: Status };

type StudentSummary = { studentId: number; name: string; marked: number; present: number; late: number; absent: number; rate: number };

function formatDate(key: string) {
  return new Intl.DateTimeFormat("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(new Date(`${key}T00:00:00`));
}
function shortDate(key: string) {
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" }).format(new Date(`${key}T00:00:00`));
}
function escapeCsv(value: string) { return `"${value.replaceAll('"', '""')}"`; }

function exportHistory(rows: Row[]) {
  const csv = "\uFEFF" + [["Date", "Roll", "Student", "Status"], ...rows.map((row) => [row.attendanceDate, row.rollNumber, row.studentName, row.status])].map((row) => row.map(escapeCsv).join(",")).join("\n") + "\n";
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const anchor = document.createElement("a"); anchor.href = url; anchor.download = `attendance-history-${new Date().toISOString().slice(0, 10)}.csv`; document.body.appendChild(anchor); anchor.click(); anchor.remove(); URL.revokeObjectURL(url);
}

export default function HistoryPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [selected, setSelected] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/attendance/history", { cache: "no-store" })
      .then(async (response) => { if (!response.ok) throw new Error(); return response.json(); })
      .then((payload) => { const data = payload.data as Row[]; setRows(data); setSelected(data[0]?.attendanceDate ?? ""); })
      .catch(() => setError("Could not load attendance history from PostgreSQL."))
      .finally(() => setLoading(false));
  }, []);

  const dates = useMemo(() => [...new Set(rows.map((row) => row.attendanceDate))], [rows]);
  const current = rows.filter((row) => row.attendanceDate === selected);
  const summaries = useMemo<StudentSummary[]>(() => {
    const map = new Map<number, StudentSummary>();
    for (const row of rows) {
      const item = map.get(row.studentId) ?? { studentId: row.studentId, name: row.studentName, marked: 0, present: 0, late: 0, absent: 0, rate: 0 };
      item.marked++;
      item[row.status]++;
      item.rate = Math.round(((item.present + item.late) / item.marked) * 100);
      map.set(row.studentId, item);
    }
    return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [rows]);

  return <main className="min-h-screen bg-slate-50 px-4 py-6 text-slate-950 sm:px-6 lg:px-10"><div className="mx-auto max-w-6xl space-y-6">
    <header className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:flex-row sm:items-end sm:justify-between"><div><Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900"><ArrowLeft className="size-4" /> Daily attendance</Link><p className="mt-5 text-sm font-medium uppercase tracking-[0.2em] text-emerald-600">Attendance Manager</p><h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Attendance history</h1><p className="mt-2 text-sm text-slate-500">Historical records are now read directly from PostgreSQL.</p></div><div className="flex flex-wrap gap-2"><div className="flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-600"><CalendarDays className="size-4" /> {dates.length} days</div>{rows.length > 0 && <Button variant="outline" onClick={() => exportHistory(rows)}><Download /> Export CSV</Button>}</div></header>
    {error && <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}
    {loading ? <section className="rounded-3xl border border-slate-200 bg-white px-6 py-16 text-center text-sm text-slate-500">Loading history…</section> : rows.length === 0 ? <section className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center shadow-sm"><CalendarDays className="mx-auto size-10 text-slate-300" /><h2 className="mt-4 text-lg font-semibold">No attendance history yet</h2><p className="mx-auto mt-2 max-w-md text-sm text-slate-500">Save attendance from the daily page and it will appear here.</p><Button asChild className="mt-6"><Link href="/">Go to daily attendance</Link></Button></section> : <>
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><div className="flex items-center gap-3"><div className="flex size-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700"><TrendingUp className="size-5" /></div><div><h2 className="font-semibold">Student attendance summary</h2><p className="text-sm text-slate-500">Present and Late count as attended.</p></div></div><div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{summaries.map((student) => <article key={student.studentId} className="rounded-2xl border border-slate-100 bg-slate-50 p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-semibold">{student.name}</p><p className="mt-1 text-xs text-slate-500">{student.marked} marked days</p></div><span className="rounded-full bg-white px-2.5 py-1 text-xs font-bold">{student.rate}%</span></div><div className="mt-3 flex gap-3 text-xs font-medium"><span className="text-emerald-700">{student.present} present</span><span className="text-amber-700">{student.late} late</span><span className="text-rose-700">{student.absent} absent</span></div></article>)}</div></section>
      <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]"><section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm"><h2 className="px-2 py-2 font-semibold">Saved days</h2><div className="mt-3 space-y-2">{dates.map((date) => { const day = rows.filter((row) => row.attendanceDate === date); const present = day.filter((r) => r.status === "present").length; const late = day.filter((r) => r.status === "late").length; const absent = day.filter((r) => r.status === "absent").length; return <button key={date} type="button" onClick={() => setSelected(date)} className={`w-full rounded-2xl border p-4 text-left ${selected === date ? "border-emerald-200 bg-emerald-50" : "border-slate-100 hover:bg-slate-50"}`}><div className="font-semibold">{shortDate(date)}</div><p className="mt-1 text-xs text-slate-500">{formatDate(date)}</p><div className="mt-3 flex gap-3 text-xs font-medium"><span className="text-emerald-700">{present} present</span><span className="text-rose-700">{absent} absent</span><span className="text-amber-700">{late} late</span></div></button>; })}</div></section>
      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"><div className="border-b border-slate-200 px-6 py-5"><p className="text-sm font-medium uppercase tracking-[0.16em] text-emerald-600">Daily record</p><h2 className="mt-1 text-2xl font-bold tracking-tight">{formatDate(selected)}</h2></div><div className="divide-y divide-slate-100">{current.map((row) => { const Icon = row.status === "present" ? Check : row.status === "absent" ? UserX : Clock3; const styles = row.status === "present" ? "bg-emerald-50 text-emerald-700" : row.status === "absent" ? "bg-rose-50 text-rose-700" : "bg-amber-50 text-amber-700"; return <div key={row.studentId} className="flex items-center justify-between gap-4 px-6 py-4"><div><p className="font-medium">{row.studentName}</p><p className="text-xs text-slate-500">Roll {row.rollNumber}</p></div><span className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold capitalize ${styles}`}><Icon className="size-3.5" />{row.status}</span></div>; })}</div></section></div>
    </>}
  </div></main>;
}

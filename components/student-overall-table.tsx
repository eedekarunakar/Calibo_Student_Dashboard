"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import type { StudentOverall } from "@/types/database";

const statusClasses: Record<StudentOverall["overall_status"], string> = {
  Beginner: "bg-red-100 text-red-800",
  Intermediate: "bg-yellow-100 text-yellow-800",
  Proficient: "bg-green-100 text-green-800"
};

export function StudentOverallTable({ students }: { students: StudentOverall[] }) {
  const [search, setSearch] = useState("");
  const [batch, setBatch] = useState("all");
  const [status, setStatus] = useState("all");

  const batches = useMemo(
    () => Array.from(new Set(students.map((student) => student.batch))).sort(),
    [students]
  );
  const filteredStudents = students.filter((student) => {
    const searchTerm = search.trim().toLowerCase();
    const matchesSearch = !searchTerm
      || student.student_name.toLowerCase().includes(searchTerm)
      || student.student_id.toLowerCase().includes(searchTerm);
    const matchesBatch = batch === "all" || student.batch === batch;
    const matchesStatus = status === "all" || student.overall_status === status;

    return matchesSearch && matchesBatch && matchesStatus;
  });

  return (
    <main className="mx-auto max-w-6xl space-y-6 px-6 py-8">
      <div>
        <h1 className="text-2xl font-semibold">Students</h1>
        <p className="mt-1 text-sm text-gray-600">Review student progress and overall performance.</p>
      </div>

      <div className="grid gap-4 rounded border p-4 md:grid-cols-[minmax(0,1fr)_12rem_12rem]">
        <label className="text-sm font-medium">
          Search students
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by name or student ID"
            className="mt-1 block w-full rounded border px-3 py-2 font-normal"
          />
        </label>
        <label className="text-sm font-medium">
          Batch
          <select value={batch} onChange={(event) => setBatch(event.target.value)} className="mt-1 block w-full rounded border px-3 py-2 font-normal">
            <option value="all">All batches</option>
            {batches.map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
        </label>
        <label className="text-sm font-medium">
          Status
          <select value={status} onChange={(event) => setStatus(event.target.value)} className="mt-1 block w-full rounded border px-3 py-2 font-normal">
            <option value="all">All statuses</option>
            <option value="Beginner">Beginner</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Proficient">Proficient</option>
          </select>
        </label>
      </div>

      <div className="overflow-x-auto rounded border">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b bg-gray-50">
            <tr>
              <th className="px-4 py-3 font-medium">Student</th>
              <th className="px-4 py-3 font-medium">Student ID</th>
              <th className="px-4 py-3 font-medium">Batch</th>
              <th className="px-4 py-3 font-medium">Overall</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Modules completed</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filteredStudents.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-gray-600">No students yet - <Link href="/admin/students" className="underline">add one to get started</Link>.</td></tr>
            ) : filteredStudents.map((student) => (
              <tr key={student.student_id}>
                <td className="px-4 py-3">
                  <Link href={`/students/${encodeURIComponent(student.student_id)}`} className="font-medium underline-offset-4 hover:underline">
                    {student.student_name}
                  </Link>
                </td>
                <td className="px-4 py-3">{student.student_id}</td>
                <td className="px-4 py-3">{student.batch}</td>
                <td className="px-4 py-3">{student.overall_pct == null ? "-" : `${student.overall_pct}%`}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusClasses[student.overall_status]}`}>
                    {student.overall_status}
                  </span>
                </td>
                <td className="px-4 py-3">{student.modules_completed}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
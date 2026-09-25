"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";

import { createSupabaseBrowserClient } from "@/lib/supabase";
import type { Student } from "@/types/database";

type StudentForm = {
  student_id: string;
  student_name: string;
  email: string;
  batch: string;
  enrollment_date: string;
};

const emptyForm: StudentForm = {
  student_id: "",
  student_name: "",
  email: "",
  batch: "Path3-Online",
  enrollment_date: ""
};

function formFromStudent(student: Student): StudentForm {
  return {
    student_id: student.student_id,
    student_name: student.student_name,
    email: student.email ?? "",
    batch: student.batch,
    enrollment_date: student.enrollment_date ?? ""
  };
}

export default function StudentsAdminPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [form, setForm] = useState<StudentForm>(emptyForm);
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  async function loadStudents() {
    setIsLoading(true);
    const supabase = createSupabaseBrowserClient();
    const { data, error } = await supabase
      .from("students")
      .select("student_id, student_name, email, batch, enrollment_date")
      .order("student_id");

    if (error) {
      setMessage({ type: "error", text: error.message });
    } else {
      setStudents(data ?? []);
    }
    setIsLoading(false);
  }

  useEffect(() => {
    void loadStudents();
  }, []);

  function updateForm(field: keyof StudentForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function resetForm() {
    setForm(emptyForm);
    setEditingStudentId(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    const studentId = form.student_id.trim();
    const studentName = form.student_name.trim();
    const batch = form.batch.trim();

    if (!studentId) {
      setMessage({ type: "error", text: "Student ID is required." });
      return;
    }
    if (!studentName) {
      setMessage({ type: "error", text: "Student name is required." });
      return;
    }
    if (!batch) {
      setMessage({ type: "error", text: "Batch is required." });
      return;
    }

    setIsSaving(true);
    const supabase = createSupabaseBrowserClient();
    const duplicateQuery = supabase
      .from("students")
      .select("student_id")
      .eq("student_id", studentId);
    const { data: duplicate, error: duplicateError } = editingStudentId
      ? await duplicateQuery.neq("student_id", editingStudentId).maybeSingle()
      : await duplicateQuery.maybeSingle();

    if (duplicateError) {
      setMessage({ type: "error", text: duplicateError.message });
      setIsSaving(false);
      return;
    }
    if (duplicate) {
      setMessage({ type: "error", text: "That student ID already exists." });
      setIsSaving(false);
      return;
    }

    const studentData = {
      student_id: studentId,
      student_name: studentName,
      email: form.email.trim() || null,
      batch,
      enrollment_date: form.enrollment_date || null
    };

    if (editingStudentId) {
      const { error } = await supabase
        .from("students")
        .update(studentData as never)
        .eq("student_id", editingStudentId);

      if (error) {
        setMessage({ type: "error", text: error.message });
      } else {
        setMessage({ type: "success", text: "Student updated." });
        resetForm();
        await loadStudents();
      }
    } else {
      const { error } = await supabase.from("students").insert(studentData as never);

      if (error) {
        setMessage({ type: "error", text: error.message });
      } else {
        setMessage({ type: "success", text: "Student added." });
        resetForm();
        await loadStudents();
      }
    }
    setIsSaving(false);
  }

  async function handleDelete(studentId: string) {
    if (!window.confirm(`Delete student ${studentId}?`)) {
      return;
    }

    setMessage(null);
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.from("students").delete().eq("student_id", studentId);

    if (error) {
      setMessage({ type: "error", text: error.message });
    } else {
      setStudents((current) => current.filter((student) => student.student_id !== studentId));
      if (editingStudentId === studentId) {
        resetForm();
      }
      setMessage({ type: "success", text: "Student deleted." });
    }
  }

  return (
    <main className="mx-auto max-w-6xl space-y-8 px-6 py-8">
      <div>
        <h1 className="text-2xl font-semibold">Manage students</h1>
        <p className="mt-1 text-sm text-gray-600">Add, update, or remove student records.</p>
      </div>

      <form id="student-form" onSubmit={handleSubmit} className="grid gap-4 rounded border p-6 md:grid-cols-2">
        <h2 className="md:col-span-2 text-lg font-medium">
          {editingStudentId ? `Edit ${editingStudentId}` : "Add a student"}
        </h2>

        <label className="text-sm font-medium">
          Student ID *
          <input value={form.student_id} onChange={(event) => updateForm("student_id", event.target.value)} required className="mt-1 block w-full rounded border px-3 py-2" placeholder="ST040" />
        </label>
        <label className="text-sm font-medium">
          Student name *
          <input value={form.student_name} onChange={(event) => updateForm("student_name", event.target.value)} required className="mt-1 block w-full rounded border px-3 py-2" />
        </label>
        <label className="text-sm font-medium">
          Email
          <input type="email" value={form.email} onChange={(event) => updateForm("email", event.target.value)} className="mt-1 block w-full rounded border px-3 py-2" />
        </label>
        <label className="text-sm font-medium">
          Batch
          <input value={form.batch} onChange={(event) => updateForm("batch", event.target.value)} className="mt-1 block w-full rounded border px-3 py-2" />
        </label>
        <label className="text-sm font-medium">
          Enrollment date
          <input type="date" value={form.enrollment_date} onChange={(event) => updateForm("enrollment_date", event.target.value)} className="mt-1 block w-full rounded border px-3 py-2" />
        </label>
        <div className="flex items-end gap-3">
          <button type="submit" disabled={isSaving} className="rounded bg-black px-4 py-2 text-white disabled:opacity-50">
            {isSaving ? "Saving..." : editingStudentId ? "Update student" : "Add student"}
          </button>
          {editingStudentId && <button type="button" onClick={resetForm} className="rounded border px-4 py-2">Cancel</button>}
        </div>
        {message && <p className={`md:col-span-2 text-sm ${message.type === "error" ? "text-red-600" : "text-green-700"}`} role="status">{message.text}</p>}
      </form>

      <section>
        <h2 className="mb-3 text-lg font-medium">Existing students</h2>
        <div className="overflow-x-auto rounded border">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b bg-gray-50">
              <tr>
                <th className="px-4 py-3 font-medium">Student ID</th>
                <th className="px-4 py-3 font-medium">Student name</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Batch</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {isLoading ? (
                <tr><td colSpan={5} className="px-4 py-6 text-gray-600">Loading students...</td></tr>
              ) : students.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-6 text-gray-600">No students yet - <Link href="#student-form" className="underline">add one to get started</Link>.</td></tr>
              ) : students.map((student) => (
                <tr key={student.student_id}>
                  <td className="px-4 py-3">{student.student_id}</td>
                  <td className="px-4 py-3">{student.student_name}</td>
                  <td className="px-4 py-3">{student.email || "-"}</td>
                  <td className="px-4 py-3">{student.batch}</td>
                  <td className="flex gap-2 px-4 py-3">
                    <button type="button" onClick={() => { setEditingStudentId(student.student_id); setForm(formFromStudent(student)); setMessage(null); }} className="rounded border px-3 py-1">Edit</button>
                    <button type="button" onClick={() => void handleDelete(student.student_id)} className="rounded border border-red-300 px-3 py-1 text-red-700">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
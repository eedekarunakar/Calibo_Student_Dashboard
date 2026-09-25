"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";

import { createSupabaseBrowserClient } from "@/lib/supabase";
import type { Assessment, AssessmentType, Modules, QpmWeightage, Student } from "@/types/database";

const assessmentTypes: AssessmentType[] = [
  "Formative",
  "Summative",
  "Defense",
  "Qualitative Performance Markers"
];

type AssessmentForm = {
  student_id: string;
  module_code: string;
  unit: string;
  assessment_type: AssessmentType;
  assessment_name: string;
  score: string;
  max_score: string;
};

type RecentAssessment = Assessment & { student_name: string };

const emptyForm: AssessmentForm = {
  student_id: "",
  module_code: "",
  unit: "1",
  assessment_type: "Formative",
  assessment_name: "",
  score: "",
  max_score: "10"
};

export default function AssessmentsAdminPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [modules, setModules] = useState<Modules[]>([]);
  const [markers, setMarkers] = useState<QpmWeightage[]>([]);
  const [recentAssessments, setRecentAssessments] = useState<RecentAssessment[]>([]);
  const [form, setForm] = useState<AssessmentForm>(emptyForm);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  async function loadReferenceData() {
    setIsLoading(true);
    const supabase = createSupabaseBrowserClient();
    const [studentsResult, modulesResult, markersResult, assessmentsResult] = await Promise.all([
      supabase.from("students").select("student_id, student_name, email, batch, enrollment_date").order("student_name"),
      supabase.from("modules").select("module_code, module_name").order("module_code"),
      supabase.from("qpm_weightage").select("marker_name, max_score").order("marker_name"),
      supabase.from("assessments").select("id, student_id, module_code, unit, assessment_type, assessment_name, score, max_score").order("id", { ascending: false }).limit(10)
    ]);

    const firstError = studentsResult.error || modulesResult.error || markersResult.error || assessmentsResult.error;
    if (firstError) {
      setMessage({ type: "error", text: firstError.message });
      setIsLoading(false);
      return;
    }

    const loadedStudents = (studentsResult.data ?? []) as Student[];
    const loadedModules = (modulesResult.data ?? []) as Modules[];
    const loadedMarkers = (markersResult.data ?? []) as QpmWeightage[];
    const loadedAssessments = (assessmentsResult.data ?? []) as Assessment[];
    const studentNames = new Map(loadedStudents.map((student) => [student.student_id, student.student_name]));
    setStudents(loadedStudents);
    setModules(loadedModules);
    setMarkers(loadedMarkers);
    setRecentAssessments(loadedAssessments.map((assessment) => ({
      ...assessment,
      student_name: studentNames.get(assessment.student_id) ?? assessment.student_id
    })));
    setIsLoading(false);
  }

  useEffect(() => {
    void loadReferenceData();
  }, []);

  function updateForm(field: keyof AssessmentForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function handleTypeChange(value: AssessmentType) {
    const isQpm = value === "Qualitative Performance Markers";
    setForm((current) => ({
      ...current,
      assessment_type: value,
      assessment_name: "",
      max_score: isQpm ? "5" : "10"
    }));
  }

  function handleMarkerChange(markerName: string) {
    const marker = markers.find((item) => item.marker_name === markerName);
    setForm((current) => ({
      ...current,
      assessment_name: markerName,
      max_score: marker ? String(marker.max_score) : "5"
    }));
  }

  function resetForm() {
    setForm((current) => ({ ...emptyForm, student_id: current.student_id }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    const score = Number(form.score);
    const maxScore = Number(form.max_score);
    const unit = Number(form.unit);

    if (!form.student_id) {
      setMessage({ type: "error", text: "Select a student." });
      return;
    }
    if (!form.module_code) {
      setMessage({ type: "error", text: "Select a module." });
      return;
    }
    if (!form.assessment_name.trim()) {
      setMessage({ type: "error", text: "Assessment name is required." });
      return;
    }
    if (!Number.isFinite(score) || !Number.isFinite(maxScore) || score < 0 || maxScore <= 0) {
      setMessage({ type: "error", text: "Enter valid score and max score values." });
      return;
    }
    if (score > maxScore) {
      setMessage({ type: "error", text: "Score cannot be greater than max score." });
      return;
    }
    if (!Number.isInteger(unit) || unit < 1) {
      setMessage({ type: "error", text: "Unit must be a positive whole number." });
      return;
    }

    setIsSaving(true);
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.from("assessments").insert({
      student_id: form.student_id,
      module_code: form.module_code,
      unit: String(unit),
      assessment_type: form.assessment_type,
      assessment_name: form.assessment_name.trim(),
      score,
      max_score: maxScore
    } as never);

    if (error) {
      setMessage({ type: "error", text: error.message });
    } else {
      setMessage({ type: "success", text: "Assessment score logged." });
      resetForm();
      await loadReferenceData();
    }
    setIsSaving(false);
  }

  return (
    <main className="mx-auto max-w-6xl space-y-8 px-6 py-8">
      <div>
        <h1 className="text-2xl font-semibold">Log assessment score</h1>
        <p className="mt-1 text-sm text-gray-600">Record scores for a student assessment.</p>
      </div>

      <form id="assessment-form" onSubmit={handleSubmit} className="grid gap-4 rounded border p-6 md:grid-cols-2">
        <label className="text-sm font-medium">
          Student *
          <input
            list="student-options"
            value={form.student_id}
            onChange={(event) => updateForm("student_id", event.target.value)}
            required
            placeholder="Search by name or student ID"
            className="mt-1 block w-full rounded border px-3 py-2"
          />
          <datalist id="student-options">
            {students.map((student) => (
              <option key={student.student_id} value={student.student_id}>{student.student_name}</option>
            ))}
          </datalist>
        </label>

        <label className="text-sm font-medium">
          Module *
          <select value={form.module_code} onChange={(event) => updateForm("module_code", event.target.value)} required className="mt-1 block w-full rounded border px-3 py-2">
            <option value="">Select a module</option>
            {modules.map((module) => <option key={module.module_code} value={module.module_code}>{module.module_name}</option>)}
          </select>
        </label>

        <label className="text-sm font-medium">
          Unit
          <input type="number" min="1" step="1" value={form.unit} onChange={(event) => updateForm("unit", event.target.value)} className="mt-1 block w-full rounded border px-3 py-2" />
        </label>

        <label className="text-sm font-medium">
          Assessment type *
          <select value={form.assessment_type} onChange={(event) => handleTypeChange(event.target.value as AssessmentType)} className="mt-1 block w-full rounded border px-3 py-2">
            {assessmentTypes.map((type) => <option key={type} value={type}>{type}</option>)}
          </select>
        </label>

        <label className="text-sm font-medium">
          Assessment name *
          {form.assessment_type === "Qualitative Performance Markers" ? (
            <select value={form.assessment_name} onChange={(event) => handleMarkerChange(event.target.value)} required className="mt-1 block w-full rounded border px-3 py-2">
              <option value="">Select a marker</option>
              {markers.map((marker) => <option key={marker.marker_name} value={marker.marker_name}>{marker.marker_name}</option>)}
            </select>
          ) : (
            <input value={form.assessment_name} onChange={(event) => updateForm("assessment_name", event.target.value)} required className="mt-1 block w-full rounded border px-3 py-2" />
          )}
        </label>

        <label className="text-sm font-medium">
          Score *
          <input type="number" min="0" step="any" value={form.score} onChange={(event) => updateForm("score", event.target.value)} required className="mt-1 block w-full rounded border px-3 py-2" />
        </label>

        <label className="text-sm font-medium">
          Max score *
          <input type="number" min="1" step="any" value={form.max_score} onChange={(event) => updateForm("max_score", event.target.value)} required className="mt-1 block w-full rounded border px-3 py-2" />
        </label>

        <div className="flex items-end gap-3 md:col-span-2">
          <button type="submit" disabled={isSaving} className="rounded bg-black px-4 py-2 text-white disabled:opacity-50">{isSaving ? "Saving..." : "Log score"}</button>
          {message && <p className={`text-sm ${message.type === "error" ? "text-red-600" : "text-green-700"}`} role="status">{message.text}</p>}
        </div>
      </form>

      <section>
        <h2 className="mb-3 text-lg font-medium">Recently logged assessments</h2>
        <div className="overflow-x-auto rounded border">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b bg-gray-50"><tr>
              <th className="px-4 py-3 font-medium">Student</th>
              <th className="px-4 py-3 font-medium">Module</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Assessment</th>
              <th className="px-4 py-3 font-medium">Score</th>
            </tr></thead>
            <tbody className="divide-y">
              {isLoading ? (
                <tr><td colSpan={5} className="px-4 py-6 text-gray-600">Loading assessments...</td></tr>
              ) : recentAssessments.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-6 text-gray-600">No assessments logged yet - <Link href="#assessment-form" className="underline">log one above</Link>.</td></tr>
              ) : recentAssessments.map((assessment) => (
                <tr key={assessment.id}>
                  <td className="px-4 py-3">{assessment.student_name}</td>
                  <td className="px-4 py-3">{assessment.module_code}</td>
                  <td className="px-4 py-3">{assessment.assessment_type}</td>
                  <td className="px-4 py-3">{assessment.assessment_name}</td>
                  <td className="px-4 py-3">{assessment.score}/{assessment.max_score}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
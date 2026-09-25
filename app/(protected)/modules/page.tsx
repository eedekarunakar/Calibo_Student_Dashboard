import Link from "next/link";

import { createSupabaseServerClient } from "@/lib/supabase-server";
import type { ModuleScores, StudentOverall } from "@/types/database";

const modules = ["M1", "M2", "M3", "M4", "M5", "M6", "M7", "M8"];

function scoreClass(score: number | null | undefined) {
  if (score == null) return "bg-gray-100 text-gray-500";
  if (score < 60) return "bg-red-100 text-red-800";
  if (score < 80) return "bg-yellow-100 text-yellow-800";
  return "bg-green-100 text-green-800";
}

export default async function ModulesPage({
  searchParams
}: {
  searchParams: { batch?: string };
}) {
  const supabase = createSupabaseServerClient();
  const [studentsResult, scoresResult] = await Promise.all([
    supabase
      .from("student_overall")
      .select("student_id, student_name, batch, overall_pct, overall_status, modules_completed")
      .order("student_name"),
    supabase
      .from("module_scores")
      .select("student_id, module_code, module_pct, module_status, module_level")
  ]);

  if (studentsResult.error || scoresResult.error) {
    return (
      <main className="mx-auto max-w-6xl px-6 py-8">
        <h1 className="text-2xl font-semibold">Module progress</h1>
        <p className="mt-4 text-red-600">
          Unable to load module progress: {studentsResult.error?.message ?? scoresResult.error?.message}
        </p>
      </main>
    );
  }

  const students = (studentsResult.data ?? []) as StudentOverall[];
  const scores = (scoresResult.data ?? []) as ModuleScores[];
  const batches = Array.from(new Set(students.map((student) => student.batch))).sort();
  const selectedBatch = searchParams.batch && batches.includes(searchParams.batch)
    ? searchParams.batch
    : "all";
  const filteredStudents = selectedBatch === "all"
    ? students
    : students.filter((student) => student.batch === selectedBatch);
  const scoreByStudentAndModule = new Map(
    scores.map((score) => [`${score.student_id}:${score.module_code}`, score.module_pct])
  );

  return (
    <main className="mx-auto max-w-6xl space-y-6 px-6 py-8">
      <div>
        <h1 className="text-2xl font-semibold">Module progress</h1>
        <p className="mt-1 text-sm text-gray-600">Compare module completion across students.</p>
      </div>

      <form action="/modules" method="get" className="flex flex-wrap items-end gap-3 rounded border p-4">
        <label className="text-sm font-medium">
          Batch
          <select name="batch" defaultValue={selectedBatch} className="mt-1 block rounded border px-3 py-2 font-normal">
            <option value="all">All batches</option>
            {batches.map((batch) => <option key={batch} value={batch}>{batch}</option>)}
          </select>
        </label>
        <button type="submit" className="rounded bg-black px-4 py-2 text-sm text-white">Filter</button>
        {selectedBatch !== "all" && <Link href="/modules" className="rounded border px-4 py-2 text-sm">Clear</Link>}
      </form>

      <div className="overflow-x-auto rounded border">
        <table className="min-w-[760px] text-left text-sm">
          <thead className="border-b bg-gray-50">
            <tr>
              <th className="sticky left-0 bg-gray-50 px-4 py-3 font-medium">Student</th>
              {modules.map((module) => <th key={module} className="px-3 py-3 text-center font-medium">{module}</th>)}
            </tr>
          </thead>
          <tbody className="divide-y">
            {filteredStudents.length === 0 ? (
              <tr><td colSpan={9} className="px-4 py-8 text-gray-600">No students found for this batch. <Link href="/admin/students" className="underline">Add a student</Link>.</td></tr>
            ) : filteredStudents.map((student) => (
              <tr key={student.student_id}>
                <th className="sticky left-0 whitespace-nowrap bg-white px-4 py-3 font-medium">
                  <Link href={`/students/${encodeURIComponent(student.student_id)}`} className="underline-offset-4 hover:underline">
                    {student.student_name}
                  </Link>
                  <span className="ml-2 text-xs font-normal text-gray-500">{student.student_id}</span>
                </th>
                {modules.map((module) => {
                  const score = scoreByStudentAndModule.get(`${student.student_id}:${module}`);
                  return (
                    <td key={module} className="px-3 py-3 text-center">
                      <span className={`inline-flex min-w-14 justify-center rounded px-2 py-1 font-medium ${scoreClass(score)}`}>
                        {score == null ? "-" : `${score}%`}
                      </span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
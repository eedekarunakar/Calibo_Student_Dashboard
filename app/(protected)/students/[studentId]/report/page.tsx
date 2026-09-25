import Link from "next/link";

import { PrintButton } from "@/components/print-button";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import type { Diagnostics, ModuleScores, ModuleTypeScores, StudentOverall } from "@/types/database";

const modules = [
  { code: "M1", name: "AI fundamentals" },
  { code: "M2", name: "Python" },
  { code: "M3", name: "Data engineering" },
  { code: "M4", name: "Machine learning" },
  { code: "M5", name: "Deep learning" },
  { code: "M6", name: "Generative AI" },
  { code: "M7", name: "DevOps" },
  { code: "M8", name: "Stat" }
];

const assessmentTypes = [
  "Formative",
  "Summative",
  "Defense",
  "Qualitative Performance Markers"
] as const;

function percentage(value: number | null | undefined) {
  return value == null ? "-" : `${value}%`;
}

function statusClass(status: StudentOverall["overall_status"]) {
  if (status === "Beginner") return "bg-red-100 text-red-800";
  if (status === "Intermediate") return "bg-yellow-100 text-yellow-800";
  return "bg-green-100 text-green-800";
}

export default async function StudentReportPage({
  params
}: {
  params: { studentId: string };
}) {
  const supabase = createSupabaseServerClient();
  const [studentResult, scoresResult, typeScoresResult, diagnosticsResult] = await Promise.all([
    supabase
      .from("student_overall")
      .select("student_id, student_name, batch, overall_pct, overall_status, modules_completed")
      .eq("student_id", params.studentId)
      .maybeSingle(),
    supabase
      .from("module_scores")
      .select("student_id, module_code, module_pct, module_status, module_level")
      .eq("student_id", params.studentId),
    supabase
      .from("module_type_scores")
      .select("student_id, module_code, assessment_type, type_pct")
      .eq("student_id", params.studentId),
    supabase
      .from("diagnostics")
      .select("student_id, module, diagnostic_level, trainer_notes")
      .eq("student_id", params.studentId)
  ]);

  if (studentResult.error || !studentResult.data) {
    return (
      <main className="mx-auto max-w-5xl px-6 py-8">
        <h1 className="text-2xl font-semibold">Student report unavailable</h1>
        <p className="mt-4 text-red-600">{studentResult.error?.message ?? "No student record was found."}</p>
        <Link href={`/students/${encodeURIComponent(params.studentId)}`} className="mt-4 inline-block underline">Back to student</Link>
      </main>
    );
  }

  const student = studentResult.data as StudentOverall;
  const scores = (scoresResult.data ?? []) as ModuleScores[];
  const typeScores = (typeScoresResult.data ?? []) as ModuleTypeScores[];
  const diagnostics = (diagnosticsResult.data ?? []) as Diagnostics[];

  return (
    <main className="report-page mx-auto max-w-5xl space-y-8 px-6 py-8">
      <div className="print-hidden flex items-center justify-between gap-4">
        <Link href={`/students/${encodeURIComponent(student.student_id)}`} className="text-sm text-gray-600 underline-offset-4 hover:underline">Back to student</Link>
        <PrintButton />
      </div>

      <header className="border-b pb-6">
        <h1 className="text-3xl font-semibold">Student Progress Report</h1>
        <div className="mt-5 grid gap-4 text-sm sm:grid-cols-4">
          <div><p className="text-gray-500">Student ID</p><p className="mt-1 font-medium">{student.student_id}</p></div>
          <div><p className="text-gray-500">Name</p><p className="mt-1 font-medium">{student.student_name}</p></div>
          <div><p className="text-gray-500">Overall %</p><p className="mt-1 font-medium">{percentage(student.overall_pct)}</p></div>
          <div><p className="text-gray-500">Overall status</p><p className="mt-1"><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusClass(student.overall_status)}`}>{student.overall_status}</span></p></div>
        </div>
      </header>

      <section>
        <h2 className="mb-4 text-xl font-semibold">Module performance</h2>
        <div className="overflow-x-auto">
          <table className="report-table min-w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="px-3 py-3 font-medium">Module</th>
                <th className="px-3 py-3 font-medium">Module Name</th>
                <th className="px-3 py-3 font-medium">Diagnostic</th>
                <th className="px-3 py-3 font-medium">Formative</th>
                <th className="px-3 py-3 font-medium">Summative</th>
                <th className="px-3 py-3 font-medium">Defense</th>
                <th className="px-3 py-3 font-medium">QPM</th>
                <th className="px-3 py-3 font-medium">Module %</th>
              </tr>
            </thead>
            <tbody>
              {modules.map((module) => {
                const moduleScore = scores.find((score) => score.module_code === module.code);
                const diagnostic = diagnostics.find((item) => item.module === module.code);

                return (
                  <tr key={module.code} className="border-b">
                    <td className="px-3 py-3 font-medium">{module.code}</td>
                    <td className="px-3 py-3">{module.name}</td>
                    <td className="px-3 py-3">{diagnostic?.diagnostic_level ?? "-"}</td>
                    {assessmentTypes.map((type) => {
                      const score = typeScores.find((item) => item.module_code === module.code && item.assessment_type === type);
                      return <td key={type} className="px-3 py-3">{percentage(score?.type_pct)}</td>;
                    })}
                    <td className="px-3 py-3 font-medium">{percentage(moduleScore?.module_pct)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
import Link from "next/link";

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

function completionLabel(moduleScore: ModuleScores | null) {
  const status = moduleScore?.module_status?.toLowerCase();

  if (status?.includes("complete")) return "Completed";
  if (status?.includes("progress")) return "In Progress";
  if (status?.includes("start")) return "Not Started";
  if (moduleScore?.module_pct == null || moduleScore.module_pct === 0) return "Not Started";
  if (moduleScore.module_pct >= 100) return "Completed";
  return "In Progress";
}

function levelRank(level: string | null) {
  const normalized = level?.toLowerCase() ?? "";

  if (normalized.includes("beginner") || normalized.includes("basic")) return 1;
  if (normalized.includes("intermediate")) return 2;
  if (normalized.includes("proficient") || normalized.includes("advanced")) return 3;

  const numericLevel = Number.parseInt(normalized.replace(/[^0-9]/g, ""), 10);
  return Number.isNaN(numericLevel) ? null : numericLevel;
}

function trendLabel(diagnosticLevel: string | null, moduleLevel: string | null) {
  if (!diagnosticLevel || !moduleLevel) return { symbol: "→", text: "same", className: "text-gray-600" };

  const diagnosticRank = levelRank(diagnosticLevel);
  const moduleRank = levelRank(moduleLevel);

  if (diagnosticRank == null || moduleRank == null || diagnosticRank === moduleRank) {
    return { symbol: "→", text: "same", className: "text-gray-600" };
  }
  if (moduleRank > diagnosticRank) return { symbol: "↑", text: "improved", className: "text-green-700" };
  return { symbol: "↓", text: "dropped", className: "text-red-700" };
}

function percentage(value: number | null | undefined) {
  return value == null ? "-" : `${value}%`;
}

export default async function StudentDetailPage({
  params,
  searchParams
}: {
  params: { studentId: string };
  searchParams: { module?: string };
}) {
  const selectedModule = modules.find((module) => module.code === searchParams.module) ?? modules[0];
  const supabase = createSupabaseServerClient();

  const [studentResult, moduleResult, typeResult, diagnosticResult] = await Promise.all([
    supabase
      .from("student_overall")
      .select("student_id, student_name, batch, overall_pct, overall_status, modules_completed")
      .eq("student_id", params.studentId)
      .maybeSingle(),
    supabase
      .from("module_scores")
      .select("student_id, module_code, module_pct, module_status, module_level")
      .eq("student_id", params.studentId)
      .eq("module_code", selectedModule.code)
      .maybeSingle(),
    supabase
      .from("module_type_scores")
      .select("student_id, module_code, assessment_type, type_pct")
      .eq("student_id", params.studentId)
      .eq("module_code", selectedModule.code),
    supabase
      .from("diagnostics")
      .select("student_id, module, diagnostic_level, trainer_notes")
      .eq("student_id", params.studentId)
      .eq("module", selectedModule.code)
      .maybeSingle()
  ]);

  if (studentResult.error || !studentResult.data) {
    return (
      <main className="mx-auto max-w-6xl px-6 py-8">
        <h1 className="text-2xl font-semibold">Student not found</h1>
        <p className="mt-4 text-red-600">{studentResult.error?.message ?? "No student record was found."}</p>
        <Link href="/students" className="mt-4 inline-block underline">Back to students</Link>
      </main>
    );
  }

  const student = studentResult.data as StudentOverall;
  const moduleScore = moduleResult.data as ModuleScores | null;
  const typeScores = (typeResult.data ?? []) as ModuleTypeScores[];
  const diagnostic = diagnosticResult.data as Diagnostics | null;
  const trend = trendLabel(diagnostic?.diagnostic_level ?? null, moduleScore?.module_level ?? null);

  return (
    <main className="mx-auto max-w-6xl space-y-8 px-6 py-8">
      <div>
        <Link href="/students" className="text-sm text-gray-600 underline-offset-4 hover:underline">Back to students</Link>
        <h1 className="mt-3 text-3xl font-semibold">{student.student_name}</h1>
        <div className="mt-3 grid gap-4 text-sm sm:grid-cols-4">
          <div><p className="text-gray-500">Student ID</p><p className="font-medium">{student.student_id}</p></div>
          <div><p className="text-gray-500">Batch</p><p className="font-medium">{student.batch}</p></div>
          <div><p className="text-gray-500">Overall</p><p className="font-medium">{percentage(student.overall_pct)}</p></div>
          <div><p className="text-gray-500">Overall status</p><p className="font-medium">{student.overall_status}</p></div>
        </div>
      </div>

      <nav aria-label="Modules" className="flex gap-2 overflow-x-auto border-b">
        {modules.map((module) => (
          <Link
            key={module.code}
            href={`/students/${encodeURIComponent(params.studentId)}?module=${module.code}`}
            className={`whitespace-nowrap border-b-2 px-3 py-2 text-sm ${module.code === selectedModule.code ? "border-black font-medium" : "border-transparent text-gray-600 hover:text-black"}`}
          >
            {module.code} {module.name}
          </Link>
        ))}
      </nav>

      <section className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-semibold">{selectedModule.code} {selectedModule.name}</h2>
          <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-medium">{completionLabel(moduleScore)}</span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Metric label="Diagnostic level" value={diagnostic?.diagnostic_level ?? "-"} />
          {assessmentTypes.map((type) => (
            <Metric key={type} label={`${type === "Qualitative Performance Markers" ? "QPM" : type} %`} value={percentage(typeScores.find((score) => score.assessment_type === type)?.type_pct)} />
          ))}
          <Metric label="Module %" value={percentage(moduleScore?.module_pct)} />
          <div className="rounded border p-4">
            <p className="text-sm text-gray-500">Trend</p>
            <p className={`mt-2 text-lg font-semibold ${trend.className}`}>{trend.symbol} {trend.text}</p>
          </div>
        </div>

        <div className="rounded border p-4">
          <p className="text-sm text-gray-500">Trainer notes</p>
          <p className="mt-2 text-sm">{diagnostic?.trainer_notes || "No trainer notes available."}</p>
          <p className="mt-4 text-sm text-gray-500">Module level: <span className="font-medium text-gray-900">{moduleScore?.module_level ?? "-"}</span></p>
        </div>
      </section>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border p-4">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-2 text-lg font-semibold">{value}</p>
    </div>
  );
}
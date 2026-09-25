import { AnalyticsCharts } from "@/components/analytics-charts";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import type { ModuleScores, StudentOverall } from "@/types/database";

const modules = ["M1", "M2", "M3", "M4", "M5", "M6", "M7", "M8"];
const statuses = ["Beginner", "Intermediate", "Proficient"] as const;

export default async function AnalyticsPage() {
  const supabase = createSupabaseServerClient();
  const [scoresResult, studentsResult] = await Promise.all([
    supabase
      .from("module_scores")
      .select("student_id, module_code, module_pct, module_status, module_level"),
    supabase
      .from("student_overall")
      .select("student_id, student_name, batch, overall_pct, overall_status, modules_completed")
  ]);

  if (scoresResult.error || studentsResult.error) {
    return (
      <main className="mx-auto max-w-6xl px-6 py-8">
        <h1 className="text-2xl font-semibold">Analytics</h1>
        <p className="mt-4 text-red-600">
          Unable to load analytics: {scoresResult.error?.message ?? studentsResult.error?.message}
        </p>
      </main>
    );
  }

  const scores = (scoresResult.data ?? []) as ModuleScores[];
  const students = (studentsResult.data ?? []) as StudentOverall[];
  const moduleAverages = modules.map((module) => {
    const values = scores
      .filter((score) => score.module_code === module && score.module_pct != null)
      .map((score) => score.module_pct as number);
    const average = values.length === 0
      ? null
      : Math.round((values.reduce((total, value) => total + value, 0) / values.length) * 10) / 10;

    return { module, average };
  });
  const statusCounts = statuses.map((status) => ({
    status,
    count: students.filter((student) => student.overall_status === status).length
  }));

  return (
    <main className="mx-auto max-w-6xl space-y-6 px-6 py-8">
      <div>
        <h1 className="text-2xl font-semibold">Analytics</h1>
        <p className="mt-1 text-sm text-gray-600">A snapshot of module performance and student status.</p>
      </div>
      <AnalyticsCharts moduleAverages={moduleAverages} statusCounts={statusCounts} />
    </main>
  );
}
import { createSupabaseServerClient } from "@/lib/supabase-server";
import type { StudentOverall } from "@/types/database";
import { StudentOverallTable } from "@/components/student-overall-table";

export default async function StudentsPage() {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("student_overall")
    .select("student_id, student_name, batch, overall_pct, overall_status, modules_completed")
    .order("student_name");

  if (error) {
    return (
      <main className="mx-auto max-w-6xl px-6 py-8">
        <h1 className="text-2xl font-semibold">Students</h1>
        <p className="mt-4 text-red-600">Unable to load students: {error.message}</p>
      </main>
    );
  }

  return <StudentOverallTable students={(data ?? []) as StudentOverall[]} />;
}
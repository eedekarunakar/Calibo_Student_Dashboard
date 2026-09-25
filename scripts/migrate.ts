import * as fs from "node:fs";
import * as path from "node:path";

import * as XLSX from "xlsx";

import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import type { AssessmentType } from "@/types/database";

const BATCH_SIZE = 200;

type SheetRow = Record<string, unknown>;

type StudentRow = {
  student_id: string;
  student_name: string;
  email: string;
  batch: string;
  enrollment_date: string;
};

type AssessmentRow = {
  student_id: string;
  module_code: string;
  unit: string;
  assessment_type: AssessmentType;
  assessment_name: string;
  score: number;
  max_score: number;
};

type DiagnosticRow = {
  student_id: string;
  module: string;
  diagnostic_level: string;
  trainer_notes: string;
};

const assessmentTypes: AssessmentType[] = [
  "Formative",
  "Summative",
  "Defense",
  "Qualitative Performance Markers"
];

function requiredString(value: unknown, field: string, rowNumber: number): string {
  const result = String(value ?? "").trim();

  if (!result) {
    throw new Error(`Missing ${field} on row ${rowNumber}`);
  }

  return result;
}

function numberValue(value: unknown, field: string, rowNumber: number): number {
  const result = Number(value);

  if (!Number.isFinite(result)) {
    throw new Error(`Invalid ${field} on row ${rowNumber}`);
  }

  return result;
}

function assessmentTypeValue(value: unknown, rowNumber: number): AssessmentType {
  const result = requiredString(value, "Assessment Type", rowNumber);

  if (!assessmentTypes.includes(result as AssessmentType)) {
    throw new Error(`Invalid Assessment Type on row ${rowNumber}: ${result}`);
  }

  return result as AssessmentType;
}

function dateValue(value: unknown, field: string, rowNumber: number): string {
  const date = value instanceof Date
    ? value
    : typeof value === "number"
      ? XLSX.SSF.parse_date_code(value)
      : new Date(String(value));

  if (!date) {
    throw new Error(`Invalid ${field} on row ${rowNumber}`);
  }

  const parsedDate = date instanceof Date
    ? date
    : new Date(Date.UTC(date.y, date.m - 1, date.d, date.H, date.M, date.S));

  if (Number.isNaN(parsedDate.getTime())) {
    throw new Error(`Invalid ${field} on row ${rowNumber}`);
  }

  return parsedDate.toISOString().slice(0, 10);
}

function sheetRows(workbook: XLSX.WorkBook, sheetName: string): SheetRow[] {
  const sheet = workbook.Sheets[sheetName];

  if (!sheet) {
    throw new Error(`Missing required sheet: ${sheetName}`);
  }

  return XLSX.utils.sheet_to_json<SheetRow>(sheet, { defval: null });
}

async function writeInChunks<T>(
  rows: T[],
  label: string,
  write: (chunk: T[]) => PromiseLike<{ error: { message: string } | null }>
): Promise<void> {
  for (let start = 0; start < rows.length; start += BATCH_SIZE) {
    const chunk = rows.slice(start, start + BATCH_SIZE);
    const { error } = await write(chunk);

    if (error) {
      throw new Error(`${label} batch failed: ${error.message}`);
    }

    console.log(`${label}: ${Math.min(start + BATCH_SIZE, rows.length)}/${rows.length}`);
  }
}

async function migrate(filePath: string): Promise<void> {
  const supabaseAdmin = createSupabaseAdminClient();
  const workbook = XLSX.readFile(filePath, { cellDates: true });

  const students: StudentRow[] = sheetRows(workbook, "Student Master").map((row, index) => ({
    student_id: requiredString(row["Student ID"], "Student ID", index + 2),
    student_name: requiredString(row["Student Name"], "Student Name", index + 2),
    email: requiredString(row.Email, "Email", index + 2),
    batch: requiredString(row.Batch, "Batch", index + 2),
    enrollment_date: dateValue(row["Enrollment Date"], "Enrollment Date", index + 2)
  }));

  const assessments: AssessmentRow[] = sheetRows(workbook, "Assessment Data").map((row, index) => ({
    student_id: requiredString(row["Student ID"], "Student ID", index + 2),
    module_code: requiredString(row.Module, "Module", index + 2),
    unit: requiredString(row.Unit, "Unit", index + 2),
    assessment_type: assessmentTypeValue(row["Assessment Type"], index + 2),
    assessment_name: requiredString(row["Assessment Name"], "Assessment Name", index + 2),
    score: numberValue(row.Score, "Score", index + 2),
    max_score: numberValue(row["Max Score"], "Max Score", index + 2)
  }));

  const diagnostics: DiagnosticRow[] = sheetRows(workbook, "Diagnostic").map((row, index) => ({
    student_id: requiredString(row["Student ID"], "Student ID", index + 2),
    module: requiredString(row.Module, "Module", index + 2),
    diagnostic_level: requiredString(row["Diagnostic Level"], "Diagnostic Level", index + 2),
    trainer_notes: String(row["Trainer Notes"] ?? "").trim()
  }));

  console.log(`Loaded ${students.length} students, ${assessments.length} assessments, ${diagnostics.length} diagnostics.`);

  await writeInChunks(students, "Students", (chunk) =>
    supabaseAdmin.from("students").upsert(chunk, { onConflict: "student_id" })
  );
  await writeInChunks(assessments, "Assessments", (chunk) =>
    supabaseAdmin.from("assessments").insert(chunk)
  );
  await writeInChunks(diagnostics, "Diagnostics", (chunk) =>
    supabaseAdmin.from("diagnostics").upsert(chunk, { onConflict: "student_id,module" })
  );

  console.log(`Migration complete: ${students.length} students, ${assessments.length} assessments, ${diagnostics.length} diagnostics.`);
}

const inputPath = process.argv[2];

if (!inputPath) {
  console.error("Usage: npm run migrate -- <path-to-excel-file>");
  process.exit(1);
}

const resolvedPath = path.resolve(inputPath);

if (!fs.existsSync(resolvedPath)) {
  console.error(`Excel file not found: ${resolvedPath}`);
  process.exit(1);
}

migrate(resolvedPath).catch((error: unknown) => {
  console.error("Migration failed:", error instanceof Error ? error.message : error);
  process.exit(1);
});
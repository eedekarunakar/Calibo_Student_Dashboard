export type AssessmentType =
  | "Formative"
  | "Summative"
  | "Defense"
  | "Qualitative Performance Markers";

export type Student = {
  student_id: string;
  student_name: string;
  email: string | null;
  batch: string;
  enrollment_date: string | null;
};

export type Assessment = {
  id: string;
  student_id: string;
  module_code: string;
  unit: string;
  assessment_type: AssessmentType;
  assessment_name: string;
  score: number;
  max_score: number;
};

export type Modules = {
  module_code: string;
  module_name: string;
};
export type Diagnostics = {
  student_id: string;
  module: string;
  diagnostic_level: string | null;
  trainer_notes: string | null;
};
export type QpmWeightage = {
  marker_name: string;
  max_score: number;
};
export type ModuleScores = {
  student_id: string;
  module_code: string;
  module_pct: number | null;
  module_status: string | null;
  module_level: string | null;
};
export type ModuleTypeScores = {
  student_id: string;
  module_code: string;
  assessment_type: AssessmentType;
  type_pct: number | null;
};
export type StudentOverall = {
  student_id: string;
  student_name: string;
  batch: string;
  overall_pct: number | null;
  overall_status: "Beginner" | "Intermediate" | "Proficient";
  modules_completed: number;
};

type Table<Row extends Record<string, unknown>, Insert extends Record<string, unknown> = Row> = {
  Row: Row;
  Insert: Insert;
  Update: Record<string, unknown>;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      students: Table<Student>;
      modules: Table<Modules>;
      assessments: Table<Assessment, Omit<Assessment, "id">>;
      diagnostics: Table<Diagnostics>;
      qpm_weightage: Table<QpmWeightage>;
    };
    Views: {
      module_scores: Table<ModuleScores>;
      module_type_scores: Table<ModuleTypeScores>;
      student_overall: Table<StudentOverall>;
    };
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
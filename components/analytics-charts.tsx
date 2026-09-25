"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

type ModuleAverage = {
  module: string;
  average: number | null;
};

type StatusCount = {
  status: "Beginner" | "Intermediate" | "Proficient";
  count: number;
};

const statusColors = {
  Beginner: "#dc2626",
  Intermediate: "#ca8a04",
  Proficient: "#16a34a"
};

export function AnalyticsCharts({
  moduleAverages,
  statusCounts
}: {
  moduleAverages: ModuleAverage[];
  statusCounts: StatusCount[];
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="rounded border p-5">
        <h2 className="text-lg font-semibold">Average module percentage</h2>
        <div className="mt-4 h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={moduleAverages} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="module" />
              <YAxis domain={[0, 100]} unit="%" />
              <Tooltip formatter={(value: number | undefined) => value == null ? "-" : `${value}%`} />
              <Bar dataKey="average" name="Average" fill="#2563eb" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="rounded border p-5">
        <h2 className="text-lg font-semibold">Students by overall status</h2>
        <div className="mt-4 h-80">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={statusCounts}
                dataKey="count"
                nameKey="status"
                cx="50%"
                cy="50%"
                outerRadius="70%"
                label={({ status, count }) => `${status}: ${count}`}
              >
                {statusCounts.map((entry) => (
                  <Cell key={entry.status} fill={statusColors[entry.status]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}
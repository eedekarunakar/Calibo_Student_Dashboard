"use client";

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="print-hidden rounded border px-4 py-2 text-sm font-medium"
    >
      Download PDF
    </button>
  );
}
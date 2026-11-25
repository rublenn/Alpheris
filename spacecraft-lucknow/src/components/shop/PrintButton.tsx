"use client";

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded bg-neutral-900 px-4 py-2 text-[13px] font-semibold text-[#ffffff] hover:bg-neutral-700"
    >
      Print / Save as PDF
    </button>
  );
}

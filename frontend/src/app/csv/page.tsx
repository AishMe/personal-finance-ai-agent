"use client";
// frontend/src/app/csv/page.tsx
// Day 12 — CSV Import page

import { useRouter } from "next/navigation";
import CSVUpload from "@/components/CSVUpload";
import { FileSpreadsheet, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function CSVPage() {
  const router = useRouter();

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-300 transition-colors mb-4"
        >
          <ArrowLeft size={14} />
          Back to dashboard
        </Link>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-900/50 border border-indigo-700/50 flex items-center justify-center">
            <FileSpreadsheet size={20} className="text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-zinc-100">Import from CSV</h1>
            <p className="text-zinc-500 text-sm mt-0.5">
              Upload a bank statement export and let AI categorize everything automatically.
            </p>
          </div>
        </div>
      </div>

      {/* Tips */}
      <div className="csv-tips mb-6">
        <p className="text-xs font-medium text-zinc-400 mb-2">Tips for best results:</p>
        <ul className="text-xs text-zinc-500 space-y-1">
          <li>• Export your bank statement as CSV from your bank&apos;s website or app.</li>
          <li>• Make sure the file has column headers in the first row.</li>
          <li>• The AI works best when the description column has merchant names (e.g. SWIGGY, AMAZON).</li>
          <li>• You can review and fix any categories before importing.</li>
        </ul>
      </div>

      {/* Main uploader */}
      <CSVUpload onImported={() => router.push("/")} />
    </div>
  );
}
"use client";
// frontend/src/components/CSVUpload.tsx  —  Day 12 (revised)

import { useState, useRef, useCallback } from "react";
import {
  Upload, FileSpreadsheet, ChevronRight, Check, AlertCircle,
  Loader2, X, RefreshCw, TrendingDown, TrendingUp, ChevronDown,
  ChevronUp, Info, Pencil,
} from "lucide-react";
import { getUserId } from "@/lib/user";

// ── Types ──────────────────────────────────────────────────────────────────────

interface FileInfo {
  headers: string[];
  preview_rows: Record<string, string>[];
  total_rows: number;
  file_type: "csv" | "excel" | "pdf";
}

/** "none" = this column doesn't exist in the file */
const NONE = "none";

interface ColumnMap {
  date: string;
  description: string;
  /** Single amount column — mutually exclusive with debit/credit */
  amount: string;
  /** Separate debit column (expense amounts) */
  debit: string;
  /** Separate credit column (income amounts) */
  credit: string;
  /** "split" = use debit+credit cols | "single" = use amount col */
  amountMode: "single" | "split";
}

interface CategorizedRow {
  date: string;
  description: string;       // editable by user
  amount: number;
  type: "income" | "expense";
  category: string;
  original_description: string;
  _selected: boolean;
}

type Step = "upload" | "map" | "preview" | "done";

// ── Bank export guides ─────────────────────────────────────────────────────────

const BANK_GUIDES = [
  {
    bank: "HDFC Bank",
    steps: [
      "Log in → NetBanking → Accounts → Account Statement",
      "Choose date range → Select 'Download' → Format: CSV",
      "File has: Date, Narration, Chq/Ref No., Value Dt, Withdrawal Amt, Deposit Amt, Closing Balance",
      "Use Split mode: Withdrawal Amt = Debit, Deposit Amt = Credit",
    ],
  },
  {
    bank: "SBI",
    steps: [
      "Log in → e-Statement → Account Statement",
      "Select period → Download as Excel or CSV",
      "File has: Txn Date, Description, Ref No/Cheque No, Debit, Credit, Balance",
      "Use Split mode: Debit column + Credit column",
    ],
  },
  {
    bank: "ICICI Bank",
    steps: [
      "Log in → Accounts → Statement of Account",
      "Date range → Download → CSV",
      "File has: S No., Value Date, Transaction Remarks, Cheque Number, Debit Amount, Credit Amount, Balance",
      "Use Split mode: Debit Amount + Credit Amount",
    ],
  },
  {
    bank: "Axis Bank",
    steps: [
      "Log in → Accounts → Account Statement → Download",
      "Format: XLS or CSV",
      "File has: Tran Date, CHQNO, Particulars, DR, CR, BAL",
      "Use Split mode: DR = Debit, CR = Credit",
    ],
  },
  {
    bank: "Kotak / Other banks",
    steps: [
      "Most banks provide CSV/Excel export from their NetBanking portal.",
      "Look for 'Account Statement', 'Download Statement', or 'e-Statement'.",
      "If only a PDF is available, download that — we support PDF too.",
      "After upload, use the column mapper to tell us which column is which.",
    ],
  },
];

// ── Helpers ────────────────────────────────────────────────────────────────────

function guessCol(headers: string[], keywords: string[]): string {
  const lower = headers.map((h) => h.toLowerCase().trim());
  for (const kw of keywords) {
    const idx = lower.findIndex((h) => h.includes(kw));
    if (idx !== -1) return headers[idx];
  }
  return NONE;
}

const EXPENSE_CATS = ["Food","Transport","Shopping","Entertainment","Health","Housing","Utilities","Subscriptions","Other"];
const INCOME_CATS  = ["Salary","Freelance","Investment","Gift","Other"];

// ── Component ──────────────────────────────────────────────────────────────────

export default function CSVUpload({ onImported }: { onImported: () => void }) {
  const [step, setStep]         = useState<Step>("upload");
  const [dragging, setDragging] = useState(false);
  const [fileInfo, setFileInfo] = useState<FileInfo | null>(null);
  const [colMap, setColMap]     = useState<ColumnMap>({
    date: "", description: "", amount: NONE,
    debit: NONE, credit: NONE, amountMode: "single",
  });
  const [rows, setRows]         = useState<CategorizedRow[]>([]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [importCount, setImportCount] = useState(0);
  const [guideOpen, setGuideOpen]     = useState(false);
  const [openBank, setOpenBank]       = useState<string | null>(null);

  const fileRef = useRef<HTMLInputElement>(null);

  // ── Upload ────────────────────────────────────────────────────────────────

  const handleFile = useCallback(async (file: File) => {
    const name = file.name.toLowerCase();
    if (!name.endsWith(".csv") && !name.endsWith(".xlsx") && !name.endsWith(".xls")) {
      setError("Please upload a CSV or Excel (.xlsx) file.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const userId = await getUserId();
      const form = new FormData();
      form.append("file", file);

      const res  = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/csv/read-file`, {
        method: "POST",
        headers: { "user-id": userId ?? "" },
        body: form,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Upload failed.");

      setFileInfo(data);

      // Auto-guess columns
      const h = data.headers as string[];
      const guessedDebit  = guessCol(h, ["debit","withdrawal","dr","withdraw"]);
      const guessedCredit = guessCol(h, ["credit","deposit","cr"]);
      const hasSplit      = guessedDebit !== NONE && guessedCredit !== NONE;

      setColMap({
        date:        guessCol(h, ["date","txn date","transaction date","value date","tran date"]),
        description: guessCol(h, ["description","narration","particulars","remarks","details","merchant"]),
        amount:      hasSplit ? NONE : guessCol(h, ["amount","value"]),
        debit:       guessedDebit,
        credit:      guessedCredit,
        amountMode:  hasSplit ? "split" : "single",
      });

      setStep("map");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }, []);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  // ── Categorize ────────────────────────────────────────────────────────────

  const handleCategorize = async () => {
    if (!fileInfo) return;
    setError("");
    setLoading(true);

    try {
      const userId = await getUserId();

      // Build rows — resolve debit/credit → amount + type_hint here on the frontend
      const mappedRows = fileInfo.preview_rows.map((r) => {
        let amount = "";
        let type_hint = "";

        if (colMap.amountMode === "split") {
          const debitVal  = r[colMap.debit]  || "0";
          const creditVal = r[colMap.credit] || "0";
          const dAmt = parseFloat(debitVal.replace(/[^\d.]/g, ""))  || 0;
          const cAmt = parseFloat(creditVal.replace(/[^\d.]/g, "")) || 0;

          if (cAmt > 0 && dAmt === 0) {
            amount = creditVal;
            type_hint = "income";
          } else if (dAmt > 0 && cAmt === 0) {
            amount = debitVal;
            type_hint = "expense";
          } else if (dAmt > 0 && cAmt > 0) {
            // Both filled (unusual) — treat net
            amount = String(Math.abs(cAmt - dAmt));
            type_hint = cAmt > dAmt ? "income" : "expense";
          } else {
            amount = "0";
            type_hint = "expense";
          }
        } else {
          amount = r[colMap.amount] || "0";
          type_hint = "";
        }

        return {
          date:        r[colMap.date]        || "",
          description: r[colMap.description] || "",
          amount,
          type_hint,
        };
      });

      // Get monthly income for salary detection
      let monthlyIncome: number | null = null;
      try {
        const pRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/profile/`, {
          headers: { "user-id": userId ?? "" },
        });
        if (pRes.ok) { const p = await pRes.json(); monthlyIncome = p.monthly_income ?? null; }
      } catch { /* ignore */ }

      const res  = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/csv/parse-rows`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "user-id": userId ?? "" },
        body: JSON.stringify({ rows: mappedRows, monthly_income: monthlyIncome }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Categorization failed.");

      setRows(
        (data.transactions as Omit<CategorizedRow, "_selected">[]).map((t) => ({
          ...t,
          _selected: true,
        }))
      );
      setStep("preview");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  // ── Confirm import ────────────────────────────────────────────────────────

  const handleConfirm = async () => {
    const selected = rows.filter((r) => r._selected);
    if (!selected.length) { setError("No transactions selected."); return; }
    setError("");
    setLoading(true);

    try {
      const userId = await getUserId();
      const res    = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/csv/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "user-id": userId ?? "" },
        body: JSON.stringify({ transactions: selected.map(({ _selected, ...r }) => r) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Import failed.");

      setImportCount(data.imported);
      setStep("done");
      onImported();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => { setStep("upload"); setFileInfo(null); setRows([]); setError(""); setLoading(false); };

  // ── Helpers ───────────────────────────────────────────────────────────────

  const setRow = (i: number, patch: Partial<CategorizedRow>) =>
    setRows((prev) => prev.map((r, j) => (j === i ? { ...r, ...patch } : r)));

  const ColSelect = ({ label, field, required = false }: { label: string; field: keyof ColumnMap; required?: boolean }) => (
    <div>
      <label className="block text-xs font-medium text-zinc-400 mb-1">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      <select
        value={colMap[field] as string}
        onChange={(e) => setColMap((m) => ({ ...m, [field]: e.target.value }))}
        className="w-full bg-zinc-800 border border-zinc-600 text-zinc-200 text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      >
        {!required && <option value={NONE}>— not in this file —</option>}
        {fileInfo?.headers.map((h) => <option key={h} value={h}>{h}</option>)}
      </select>
    </div>
  );

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="csv-upload-wrapper">

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-6">
        {(["upload","map","preview"] as Step[]).map((s, i) => {
          const done = (["upload","map","preview","done"] as Step[]).indexOf(step) > i;
          const active = step === s;
          return (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors
                ${active ? "bg-indigo-600 text-white" : done ? "bg-green-600 text-white" : "bg-zinc-700 text-zinc-500"}`}>
                {done ? <Check size={13} /> : i + 1}
              </div>
              <span className={`text-xs font-medium ${active ? "text-zinc-200" : "text-zinc-500"}`}>
                {s === "upload" ? "Upload" : s === "map" ? "Map columns" : "Review & edit"}
              </span>
              {i < 2 && <ChevronRight size={14} className="text-zinc-700" />}
            </div>
          );
        })}
      </div>

      {/* Error banner */}
      {error && (
        <div className="flex items-start gap-2 mb-4 text-sm text-red-300 bg-red-900/20 border border-red-800/40 rounded-lg px-4 py-3">
          <AlertCircle size={15} className="mt-0.5 shrink-0" />
          <span className="flex-1">{error}</span>
          <button onClick={() => setError("")}><X size={14} className="text-red-400 hover:text-red-200" /></button>
        </div>
      )}

      {/* ─── STEP: UPLOAD ─── */}
      {step === "upload" && (
        <div>
          {/* Onboarding guide */}
          <div className="csv-guide-box mb-5">
            <button
              onClick={() => setGuideOpen((o) => !o)}
              className="w-full flex items-center gap-2 text-sm text-zinc-300 font-medium"
            >
              <Info size={15} className="text-indigo-400 shrink-0" />
              <span>How do I export my bank statement?</span>
              <span className="ml-auto">{guideOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}</span>
            </button>

            {guideOpen && (
              <div className="mt-4 space-y-2">
                {BANK_GUIDES.map((g) => (
                  <div key={g.bank} className="border border-zinc-700 rounded-lg overflow-hidden">
                    <button
                      onClick={() => setOpenBank(openBank === g.bank ? null : g.bank)}
                      className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-zinc-300 bg-zinc-800/50 hover:bg-zinc-700/50 transition-colors"
                    >
                      <span className="font-medium">{g.bank}</span>
                      {openBank === g.bank ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                    {openBank === g.bank && (
                      <ol className="px-4 py-3 space-y-1.5 bg-zinc-900/50">
                        {g.steps.map((s, i) => (
                          <li key={i} className="flex gap-2 text-xs text-zinc-400">
                            <span className="text-indigo-400 font-bold shrink-0">{i + 1}.</span>
                            <span>{s}</span>
                          </li>
                        ))}
                      </ol>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Drop zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            onClick={() => fileRef.current?.click()}
            className={`csv-dropzone ${dragging ? "csv-dropzone-active" : ""}`}
          >
            <input
              ref={fileRef} type="file"
              accept=".csv,.xlsx,.xls"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
            />
            {loading ? (
              <div className="flex flex-col items-center gap-3">
                <Loader2 size={32} className="animate-spin text-indigo-400" />
                <p className="text-zinc-400 text-sm">Reading your file…</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-indigo-900/40 border border-indigo-700/50 flex items-center justify-center">
                  <FileSpreadsheet size={26} className="text-indigo-400" />
                </div>
                <div className="text-center">
                  <p className="text-zinc-200 font-medium">Drop your bank statement here</p>
                  <p className="text-zinc-500 text-sm mt-1">or click to browse</p>
                </div>
                <div className="flex gap-2 mt-1">
                  {["CSV", "Excel (.xlsx)"].map((fmt) => (
                    <span key={fmt} className="text-xs bg-zinc-800 border border-zinc-700 text-zinc-400 px-2.5 py-1 rounded-full">{fmt}</span>
                  ))}
                </div>
                <p className="text-xs text-zinc-600 text-center max-w-xs mt-1">
                  Up to 200 transactions per upload.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── STEP: MAP ─── */}
      {step === "map" && fileInfo && (
        <div>
          <div className="mb-5">
            <p className="text-zinc-300 font-medium">
              Found <span className="text-indigo-400">{fileInfo.total_rows}</span> rows ·{" "}
              <span className="text-zinc-500 text-sm capitalize">{fileInfo.file_type} file</span>
            </p>
            <p className="text-zinc-500 text-sm mt-1">
              Tell me which column is which. I&apos;ve taken a guess — correct anything that looks wrong.
            </p>
          </div>

          {/* Amount mode toggle */}
          <div className="mb-5">
            <p className="text-xs font-medium text-zinc-400 mb-2">Amount format in your file:</p>
            <div className="flex gap-2">
              {(["single", "split"] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setColMap((m) => ({ ...m, amountMode: mode }))}
                  className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium border transition-colors ${
                    colMap.amountMode === mode
                      ? "bg-indigo-600 border-indigo-500 text-white"
                      : "bg-zinc-800 border-zinc-600 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200"
                  }`}
                >
                  {mode === "single" ? "📊 Single amount column" : "↕️ Separate Debit + Credit columns"}
                </button>
              ))}
            </div>
            <p className="text-xs text-zinc-600 mt-2">
              {colMap.amountMode === "split"
                ? "Use this when your file has two separate columns — one for money going out (Debit/Withdrawal) and one for money coming in (Credit/Deposit)."
                : "Use this when your file has a single amount column, sometimes with + and − signs."}
            </p>
          </div>

          {/* Column selectors */}
          <div className="grid grid-cols-2 gap-4 mb-5">
            <ColSelect label="Date column" field="date" required />
            <ColSelect label="Description column" field="description" required />
            {colMap.amountMode === "single" ? (
              <ColSelect label="Amount column" field="amount" required />
            ) : (
              <>
                <ColSelect label="Debit / Withdrawal column" field="debit" required />
                <ColSelect label="Credit / Deposit column" field="credit" required />
              </>
            )}
          </div>

          {/* Preview */}
          <div className="mb-5">
            <p className="text-xs text-zinc-500 mb-2">Preview (first {fileInfo.preview_rows.length} rows):</p>
            <div className="overflow-x-auto rounded-lg border border-zinc-700">
              <table className="w-full text-xs text-zinc-400">
                <thead>
                  <tr className="border-b border-zinc-700 bg-zinc-800/50">
                    <th className="text-left px-3 py-2 text-zinc-500">Date</th>
                    <th className="text-left px-3 py-2 text-zinc-500">Description</th>
                    <th className="text-right px-3 py-2 text-zinc-500">
                      {colMap.amountMode === "split" ? "Debit / Credit" : "Amount"}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {fileInfo.preview_rows.map((row, i) => (
                    <tr key={i} className="border-b border-zinc-700/50 last:border-0">
                      <td className="px-3 py-2 whitespace-nowrap">{row[colMap.date] || "—"}</td>
                      <td className="px-3 py-2 max-w-[200px] truncate">{row[colMap.description] || "—"}</td>
                      <td className="px-3 py-2 text-right">
                        {colMap.amountMode === "split"
                          ? <>
                              {row[colMap.debit]  ? <span className="text-red-400">-{row[colMap.debit]}</span>  : null}
                              {row[colMap.credit] ? <span className="text-green-400 ml-1">+{row[colMap.credit]}</span> : null}
                              {!row[colMap.debit] && !row[colMap.credit] ? "—" : null}
                            </>
                          : row[colMap.amount] || "—"
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleCategorize}
              disabled={loading || !colMap.date || !colMap.description ||
                (colMap.amountMode === "single" ? colMap.amount === NONE : colMap.debit === NONE || colMap.credit === NONE)}
              className="btn-primary"
            >
              {loading
                ? <><Loader2 size={14} className="animate-spin" /> Categorizing with AI…</>
                : <><SparklesIcon size={14} /> Categorize with AI</>
              }
            </button>
            <button onClick={reset} className="btn-secondary">
              Start over
            </button>
          </div>
        </div>
      )}

      {/* ─── STEP: PREVIEW ─── */}
      {step === "preview" && (
        <div>
          <div className="flex items-start justify-between mb-4 gap-4">
            <div>
              <p className="text-zinc-200 font-medium">
                <span className="text-indigo-400">{rows.filter(r => r._selected).length}</span>
                <span className="text-zinc-400"> of {rows.length} selected</span>
              </p>
              <p className="text-zinc-500 text-sm mt-0.5">
                Edit descriptions or categories inline. Uncheck rows you don&apos;t want to import.
              </p>
            </div>
            <div className="flex gap-3 shrink-0">
              <button
                onClick={() => setRows(r => r.map(t => ({ ...t, _selected: true })))}
                className="text-xs text-zinc-400 hover:text-indigo-400 underline underline-offset-2 transition-colors"
              >
                Select all
              </button>
              <button
                onClick={() => setRows(r => r.map(t => ({ ...t, _selected: false })))}
                className="text-xs text-zinc-400 hover:text-red-400 underline underline-offset-2 transition-colors"
              >
                Deselect all
              </button>
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border border-zinc-700 mb-5">
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="border-b border-zinc-700 bg-zinc-800/60 text-xs text-zinc-500">
                  <th className="px-3 py-2 w-8"></th>
                  <th className="text-left px-3 py-2">Date</th>
                  <th className="text-left px-3 py-2">Description <span className="text-zinc-600 font-normal">(editable)</span></th>
                  <th className="text-left px-3 py-2">Category</th>
                  <th className="text-left px-3 py-2">Type</th>
                  <th className="text-right px-3 py-2">Amount</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={i} className={`border-b border-zinc-700/50 last:border-0 transition-opacity ${row._selected ? "" : "opacity-35"}`}>
                    {/* Checkbox */}
                    <td className="px-3 py-2">
                      <input type="checkbox" checked={row._selected}
                        onChange={(e) => setRow(i, { _selected: e.target.checked })}
                        className="accent-indigo-500 w-4 h-4 cursor-pointer" />
                    </td>
                    {/* Date */}
                    <td className="px-3 py-2 text-zinc-400 text-xs whitespace-nowrap">{row.date}</td>
                    {/* Description — editable */}
                    <td className="px-3 py-2 max-w-[200px]">
                      <div className="flex items-center gap-1 group">
                        <input
                          value={row.description}
                          onChange={(e) => setRow(i, { description: e.target.value })}
                          title={row.original_description}
                          className="bg-transparent text-zinc-300 text-xs w-full min-w-0 truncate border-b border-transparent focus:border-indigo-500 focus:outline-none hover:border-zinc-600 transition-colors py-0.5"
                        />
                        <Pencil size={10} className="text-zinc-600 shrink-0 group-hover:text-zinc-400 transition-colors" />
                      </div>
                    </td>
                    {/* Category dropdown */}
                    <td className="px-3 py-2">
                      <select
                        value={row.category}
                        onChange={(e) => setRow(i, { category: e.target.value })}
                        className="bg-zinc-800 border border-zinc-600 text-zinc-300 text-xs rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                      >
                        {(row.type === "income" ? INCOME_CATS : EXPENSE_CATS).map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </td>
                    {/* Type badge */}
                    <td className="px-3 py-2">
                      <button
                        onClick={() => setRow(i, {
                          type: row.type === "income" ? "expense" : "income",
                          category: row.type === "income" ? "Other" : "Other",
                        })}
                        title="Click to toggle"
                        className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium cursor-pointer transition-opacity hover:opacity-70 ${
                          row.type === "income"
                            ? "bg-green-900/50 text-green-400"
                            : "bg-indigo-900/50 text-indigo-400"
                        }`}
                      >
                        {row.type === "income" ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                        {row.type}
                      </button>
                    </td>
                    {/* Amount */}
                    <td className="px-3 py-2 text-right font-medium text-zinc-200 whitespace-nowrap">
                      ₹{row.amount.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleConfirm}
              disabled={loading || rows.filter(r => r._selected).length === 0}
              className="btn-primary"
            >
              {loading
                ? <><Loader2 size={14} className="animate-spin" /> Importing…</>
                : <><Upload size={14} /> Import {rows.filter(r => r._selected).length} transactions</>
              }
            </button>
            <button onClick={() => setStep("map")} disabled={loading} className="btn-secondary">
              <RefreshCw size={13} /> Re-map columns
            </button>
          </div>
        </div>
      )}

      {/* ─── STEP: DONE ─── */}
      {step === "done" && (
        <div className="text-center py-10">
          <div className="w-16 h-16 rounded-full bg-green-900/40 border border-green-700/50 flex items-center justify-center mx-auto mb-4">
            <Check size={28} className="text-green-400" />
          </div>
          <p className="text-zinc-100 font-semibold text-lg">Import complete!</p>
          <p className="text-zinc-500 text-sm mt-2">
            {importCount} transaction{importCount !== 1 ? "s" : ""} added. Your dashboard has been updated.
          </p>
          <button onClick={reset} className="btn-secondary mt-6 mx-auto">
            Import another file
          </button>
        </div>
      )}
    </div>
  );
}

function SparklesIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z"/>
      <path d="M19 12l.75 2.25L22 15l-2.25.75L19 18l-.75-2.25L16 15l2.25-.75L19 12z"/>
      <path d="M5 17l.5 1.5L7 19l-1.5.5L5 21l-.5-1.5L3 19l1.5-.5L5 17z"/>
    </svg>
  );
}
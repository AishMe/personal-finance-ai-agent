"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function Home() {
  const [status, setStatus] = useState("Checking...");

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/health`)
      .then((res) => res.json())
      .then((data) => setStatus(data.status))
      .catch(() => setStatus("Cannot reach backend"));
  }, []);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="bg-white rounded-2xl shadow p-10 flex flex-col items-center gap-4">
        <h1 className="text-2xl font-semibold text-gray-800">Finance Agent</h1>
        <p className="text-gray-500 text-sm">Backend status</p>
        <span
          className={`px-4 py-1 rounded-full text-sm font-medium ${
            status === "ok"
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {status === "ok" ? "Connected" : status}
        </span>
        <Link
          href="/chat"
          className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-xl text-sm font-medium transition-colors"
        >
          Open Chat
        </Link>
      </div>
    </main>
  );
}
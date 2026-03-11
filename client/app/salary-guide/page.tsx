import Link from "next/link";

export default function SalaryGuidePage() {
  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="mx-auto max-w-5xl px-4 py-10">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Salary Guide</h1>
        <p className="mt-2 text-slate-600 dark:text-slate-300">
          This page is available so the navigation links don’t 404. If you want, we can enhance this into a full
          salary insights experience.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/jobs"
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
          >
            Browse Jobs
          </Link>
          <Link
            href="/companies"
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:hover:bg-slate-800"
          >
            Explore Companies
          </Link>
        </div>
      </div>
    </main>
  );
}


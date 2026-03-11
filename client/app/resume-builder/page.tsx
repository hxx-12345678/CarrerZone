import Link from "next/link";

export default function ResumeBuilderPage() {
  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="mx-auto max-w-5xl px-4 py-10">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Resume Builder</h1>
        <p className="mt-2 text-slate-600 dark:text-slate-300">
          This route exists to prevent 404s from navigation. If you want the full builder UI here, we can wire it up
          to your existing “Job at Pace” resume builder features.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/job-at-pace"
            className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Go to Job at Pace
          </Link>
          <Link
            href="/job-at-pace/features"
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:hover:bg-slate-800"
          >
            See Resume Builder Features
          </Link>
        </div>
      </div>
    </main>
  );
}


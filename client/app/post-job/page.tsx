'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function PostJobRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to employer dashboard post job page
    router.replace('/employer-dashboard/post-job');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-2">Redirecting...</h2>
        <p className="text-gray-600">Taking you to the job posting page</p>
      </div>
    </div>
  );
}


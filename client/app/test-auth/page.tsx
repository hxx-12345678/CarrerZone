"use client"

import { useAuth } from "@/hooks/useAuth"

export default function TestAuthPage() {
    const { user, loading } = useAuth()

    if (loading) return <div>Loading...</div>

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold mb-4">Auth Debug Page</h1>
            <pre className="bg-slate-100 p-4 rounded">
                {JSON.stringify(user, null, 2)}
            </pre>

            <h2 className="text-xl font-bold mt-8 mb-4">Permissions Check</h2>
            <ul>
                <li>jobPosting: {String(user?.permissions?.jobPosting)}</li>
                <li>resumeDatabase: {String(user?.permissions?.resumeDatabase)}</li>
                <li>settings: {String(user?.permissions?.settings)}</li>
                <li>analytics: {String(user?.permissions?.analytics)}</li>
            </ul>
        </div>
    )
}

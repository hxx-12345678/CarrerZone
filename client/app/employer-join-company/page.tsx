'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiService } from '@/lib/api'

export default function EmployerJoinCompanyPage() {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [companies, setCompanies] = useState<any[]>([])
  const [loadingList, setLoadingList] = useState(false)
  const [selecting, setSelecting] = useState<string | null>(null)

  // Public page: no auth required

  useEffect(() => {
    const load = async () => {
      setLoadingList(true)
      const res = await apiService.listCompanies({ search, limit: 25 })
      if (res.success && res.data) setCompanies(res.data)
      setLoadingList(false)
    }
    load()
  }, [search])

  const handleSelect = async (companyId: string) => {
    setSelecting(companyId)
    router.push(`/employer-register?companyId=${encodeURIComponent(companyId)}`)
  }

  // Always render

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Join Your Company</h1>
      <div className="flex gap-2">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search companies by name"
          className="border rounded px-3 py-2 w-full max-w-md"
        />
      </div>
      <div className="bg-white border rounded">
        {loadingList ? (
          <div className="p-4">Loading companies...</div>
        ) : (
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-gray-600">
                <th className="p-2">Name</th>
                <th className="p-2">Industry</th>
                <th className="p-2">Size</th>
                <th className="p-2">Location</th>
                <th className="p-2"></th>
              </tr>
            </thead>
            <tbody>
              {companies.map((c) => (
                <tr key={c.id} className="border-t">
                  <td className="p-2">{c.name}</td>
                  <td className="p-2">{c.industry}</td>
                  <td className="p-2">{c.companySize}</td>
                  <td className="p-2">{[c.city, c.state, c.country].filter(Boolean).join(', ')}</td>
                  <td className="p-2 text-right">
                    <button
                      onClick={() => handleSelect(c.id)}
                      disabled={selecting === c.id}
                      className="px-3 py-1 border rounded disabled:opacity-50"
                    >{selecting === c.id ? 'Selecting...' : 'Select'}</button>
                  </td>
                </tr>
              ))}
              {companies.length === 0 && (
                <tr><td className="p-4 text-gray-500" colSpan={5}>No companies found</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}



"use client"

import Link from "next/link"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ChevronDown, Linkedin, Youtube } from "lucide-react"

export default function HyreBridgeSolutionsPage() {
  const tabs = [
    "Talent Sourcing",
    "Talent Planning",
    "Screening & Evaluation",
    "Employer Branding",
    "Hiring Automation",
    "Assisted Hiring",
  ]

  const [activeTab, setActiveTab] = useState<string>(tabs[0])

  const solutions: Record<string, Array<{name: string; title: string; points: string[]}>> = {
    "Talent Sourcing": [
      { name: "CampusZone", title: "Job Posting", points: ["India's largest talent pool", "Power of AI", "No.1 jobsite"] },
      { name: "Uninest Ai", title: "Resume Search", points: ["Premium tech talent", "Top 10%", "3L+ CVs"] },
    ],
    "Talent Planning": [
      { name: "RecrootBridge", title: "Hiring automation", points: ["Workflows", "Approvals", "Integrations"] },
      { name: "Campus", title: "Campus hiring decoded", points: ["Plan, brand & hire", "Pan-India", "Virtual & on‑site"] },
    ],
    "Screening & Evaluation": [
      { name: "TalentPulse", title: "Talent evaluation", points: ["Skill tests", "Auto‑grading", "Deep insights"] },
    ],
    "Employer Branding": [
      { name: "CRM", title: "Company relations", points: ["Salary insights", "Branding edge", "One platform"] },
      { name: "Branding Edge", title: "Employer branding", points: ["Showcase brand", "Reach jobseekers", "Campaigns"] },
    ],
    "Hiring Automation": [
      { name: "RecrootBridge", title: "ATS & Automation", points: ["Parsing", "Screening", "Scheduling"] },
    ],
    "Assisted Hiring": [
      { name: "Expert Assist", title: "Recruitment services", points: ["Sourcing", "Shortlisting", "Interviewing"] },
    ],
  }

  const offerings = tabs
  const brands = ["CampusZone", "Uninest Ai", "RecrootBridge", "TalentPulse", "Branding Edge", "CRM", "Expert Assist", "Campus"]

  return (
    <div className="bg-white dark:bg-slate-950">
      {/* LOCAL NAVBAR */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-black/20 bg-black/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/hyrebridge-solutions" className="font-bold text-lg tracking-tight text-white">HyreBridgeSolutions</Link>
          <div className="flex items-center gap-2">
            <Button asChild className="bg-indigo-600 hover:bg-indigo-700 text-white">
              <Link href="#demo">Request demo</Link>
            </Button>
            <div className="relative group">
              <Button variant="outline" className="flex items-center border-white/30 text-white">
                Hiring For
                <ChevronDown className="w-4 h-4 ml-2" />
              </Button>
              <div className="absolute right-0 mt-2 w-[620px] bg-slate-900 text-slate-200 rounded-xl shadow-2xl border border-slate-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 p-4 z-50">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-semibold mb-3 text-white">Offerings</h4>
                    <div className="grid grid-cols-1 gap-2">
                      {offerings.map(o => (
                        <Link key={o} href="#explore" className="flex items-center gap-3 p-2 rounded-md hover:bg-slate-800 cursor-pointer">
                          <div className="w-7 h-7 rounded-full bg-indigo-500/20 text-indigo-300 flex items-center justify-center text-xs font-bold">{o.split(' ').map(s=>s[0]).join('')}</div>
                          <span className="text-sm text-slate-200">{o}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold mb-3 text-white">Brands</h4>
                    <div className="grid grid-cols-1 gap-2">
                      {brands.map(b => (
                        <Link key={b} href="#brands" className="flex items-center gap-3 p-2 rounded-md hover:bg-slate-800 cursor-pointer">
                          <div className="w-7 h-7 rounded-full bg-blue-500/20 text-blue-300 flex items-center justify-center text-xs font-bold">{b[0]}</div>
                          <span className="text-sm text-slate-200">{b}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="h-full w-full bg-cover bg-center" style={{backgroundImage: 'url(/images/hyrebridge-hero.jpg)'}} />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-white" />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div>
              <h1 className="text-5xl sm:text-6xl font-extrabold leading-tight text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]">
                One‑Stop Solution.
                <br />
                Talent Decoded.
              </h1>
              <p className="mt-5 text-slate-100/90 max-w-2xl text-lg">
                One‑stop solution for planning, sourcing, screening, employer branding, and hiring automation, powered by AI.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button asChild>
                  <Link href="#demo">Request demo</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="#video">Watch video</Link>
                </Button>
              </div>
              <div className="mt-8 flex flex-wrap gap-6 opacity-90 text-white/90 text-sm">
                <span>CAampusZone</span>
                <span>Uninest Ai</span>
                <span>RecrootBridge</span>
                <span>TalentPulse</span>
                <span>CRM</span>
                <span>Campus</span>
              </div>
            </div>
            <div className="hidden lg:block" />
          </div>
        </div>
      </section>

      {/* SEPARATE YOUTUBE VIDEO SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12" id="video">
        <div className="mb-4 flex items-end justify-between">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">Product walkthrough</h2>
          <Link href="#demo" className="text-indigo-600 dark:text-indigo-400 text-sm font-medium hover:underline">Request a demo</Link>
        </div>
        <div className="rounded-2xl overflow-hidden shadow-xl ring-1 ring-slate-200 dark:ring-slate-800 bg-black">
          <iframe
            className="w-full h-[420px] sm:h-[520px]"
            src="https://www.youtube.com/embed/dQw4w9WgXcQ?rel=0"
            title="HyreBridge Solutions Walkthrough"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      </section>

      {/* EXPLORE ALL SOLUTIONS (TABS) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6">
        <div className="text-center mb-6">
          <p className="text-sm text-indigo-600 font-semibold">For your hiring needs</p>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white">
            Explore all solutions
          </h2>
        </div>
        <div className="flex flex-wrap gap-2 justify-center mb-6">
          {tabs.map(t => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`px-3 py-1.5 rounded-full text-sm border ${activeTab === t ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'}`}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {(solutions[activeTab] || []).map((s) => (
            <Card key={`${activeTab}-${s.name}`} className="bg-white/70 dark:bg-slate-900/70 border-slate-200 dark:border-slate-700">
              <CardHeader>
                <CardTitle className="text-slate-900 dark:text-white flex items-center justify-between">
                  <span>{s.name}</span>
                  <span className="text-xs font-medium text-slate-500">{s.title}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc pl-5 text-sm text-slate-600 dark:text-slate-400 space-y-1">
                  {s.points.map(p => (<li key={p}>{p}</li>))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* EXPERIENCE ONE‑STOP SOLUTION + BRAND CARDS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div>
            <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-4 tracking-tight">Experience the one‑stop solution</h3>
            <ul className="space-y-2 text-slate-700 dark:text-slate-300 text-base">
              <li>Single sign‑on</li>
              <li>Smart recommendations</li>
            </ul>
            <Button id="demo" className="mt-6 bg-indigo-600 hover:bg-indigo-700">Request demo</Button>
          </div>
          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { n: 'CAampusZone', d: 'Talent decoded' },
              { n: 'Uninest Ai', d: 'Premium tech talent' },
              { n: 'Campus', d: 'Campus hiring decoded' },
              { n: 'CRM', d: 'Company relations decoded' },
              { n: 'TalentPulse', d: 'Talent evaluation decoded' },
              { n: 'Branding Edge', d: 'Employer branding decoded' },
              { n: 'Expert Assist', d: 'Assisted hiring decoded' },
              { n: 'RecrootBridge', d: 'Hiring automation decoded' },
            ].map(b => (
              <Card key={b.n} className="border-slate-200 dark:border-slate-700">
                <CardHeader>
                  <CardTitle className="text-slate-900 dark:text-white text-base">{b.n}</CardTitle>
                  <CardDescription>{b.d}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA + DEMO FORM */}
      <section className="bg-indigo-50 dark:bg-slate-900/40 border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Know more about
                <br /> HyreBridge Solutions</h3>
              <ul className="mt-4 space-y-2 text-slate-700 dark:text-slate-300">
                <li>Request a demo</li>
                <li>Learn how it will help you</li>
              </ul>
            </div>
            <Card className="bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800">
              <CardContent className="p-6">
                <form className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Input placeholder="Full name" />
                  <Input placeholder="10‑digit mobile number" />
                  <Input placeholder="Work email" className="md:col-span-2" />
                  <Input placeholder="Your company" />
                  <Input placeholder="Your consultancy" />
                  <Button type="submit" className="md:col-span-2 mt-1">Continue</Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-slate-950 text-slate-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <h4 className="text-white text-lg font-semibold mb-3">HyreBridge Solutions</h4>
              <p className="text-sm text-slate-400">One‑stop solution for planning, sourcing, screening, employer branding, and hiring automation, powered by AI to decode talent.</p>
              <div className="flex items-center gap-3 mt-4">
                <Link href="https://www.linkedin.com" target="_blank" className="p-2 rounded-full bg-slate-800 hover:bg-slate-700"><Linkedin className="w-4 h-4"/></Link>
                <Link href="https://www.youtube.com" target="_blank" className="p-2 rounded-full bg-slate-800 hover:bg-slate-700"><Youtube className="w-4 h-4"/></Link>
              </div>
            </div>
            <div>
              <h4 className="text-white text-sm font-semibold mb-3">Offerings</h4>
              <div className="flex flex-col gap-2">
                {offerings.map(o => (
                  <Link key={`f-${o}`} href="#explore" className="inline-flex items-center justify-start px-3 py-2 rounded-md bg-slate-900 hover:bg-slate-800 text-slate-200 text-sm">
                    {o}
                  </Link>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-white text-sm font-semibold mb-3">Brands</h4>
              <div className="flex flex-col gap-2">
                {brands.map(b => (
                  <Link key={`b-${b}`} href="#brands" className="inline-flex items-center justify-start px-3 py-2 rounded-md bg-slate-900 hover:bg-slate-800 text-slate-200 text-sm">
                    {b}
                  </Link>
                ))}
              </div>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-4 text-xs text-slate-500 flex items-center justify-between">
            <span>© {new Date().getFullYear()} HyreBridge Solutions. All rights reserved.</span>
            <span>Made for better hiring.</span>
          </div>
        </div>
      </footer>
    </div>
  )
}



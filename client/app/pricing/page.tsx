"use client"

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ChevronDown, Check } from 'lucide-react';

export default function PricingPage() {
  const offerings = [
    'Talent Sourcing', 'Talent Planning', 'Screening & Evaluation', 'Employer Branding', 'Hiring Automation', 'Assisted Hiring'
  ];
  const brands = ['CampusZone', 'Uninest Ai', 'RecrootBridge', 'TalentPulse', 'Branding Edge', 'CRM', 'Expert Assist', 'Campus'];

  return (
    <div className="min-h-screen bg-white">
      {/* Pricing Navbar */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-black/10 bg-black text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <Link href="/" className="font-semibold tracking-tight">CampusZone</Link>
          <nav className="flex items-center gap-6">
            <div className="relative group">
              <Button variant="ghost" className="h-8 px-0 text-sm text-white">OUR OFFERING</Button>
              <div className="absolute left-0 mt-2 w-[520px] bg-white text-slate-900 rounded-xl shadow-2xl border border-slate-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 p-4 z-50">
                <div className="grid grid-cols-2 gap-3">
                  <Link href="/job-posting" className="rounded-lg p-4 hover:bg-slate-50 border border-slate-200">
                    <div className="font-semibold mb-1">Job Posting Plans</div>
                    <div className="text-sm text-slate-600">Hot Vacancy, Classified, Standard & Free</div>
                  </Link>
                  <Link href="/database-pricing" className="rounded-lg p-4 hover:bg-slate-50 border border-slate-200">
                    <div className="font-semibold mb-1">Resume Database</div>
                    <div className="text-sm text-slate-600">Access 50M+ profiles</div>
                  </Link>
                </div>
                      </div>
                    </div>
            <div className="relative group">
              <Button variant="outline" className="h-8 px-3 text-xs border-white/30 text-white bg-transparent">
                HyreBridge Solutions
                <ChevronDown className="w-4 h-4 ml-1" />
                        </Button>
              <div className="absolute right-0 mt-2 w-[620px] bg-slate-900 text-slate-200 rounded-xl shadow-2xl border border-slate-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 p-4 z-50">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-semibold mb-3 text-white">Offerings</h4>
                    <div className="grid grid-cols-1 gap-2">
                      {offerings.map(o => (
                        <Link key={o} href="/hyrebridge-solutions#explore" className="flex items-center gap-3 p-2 rounded-md hover:bg-slate-800">
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
                        <Link key={b} href="/hyrebridge-solutions#brands" className="flex items-center gap-3 p-2 rounded-md hover:bg-slate-800">
                          <div className="w-7 h-7 rounded-full bg-blue-500/20 text-blue-300 flex items-center justify-center text-xs font-bold">{b[0]}</div>
                          <span className="text-sm text-slate-200">{b}</span>
                        </Link>
                      ))}
                    </div>
                      </div>
                        </div>
                      </div>
                    </div>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <main className="pt-20">
        <section className="bg-gradient-to-b from-slate-50 to-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div className="text-center max-w-3xl mx-auto">
              <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-slate-900">Attract candidates</h1>
              <p className="mt-3 text-slate-600">with quick and easy plans on India’s leading job site</p>
            </div>
          </div>
        </section>

        {/* Pricing tables (Job Posting) */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            {[
              { name:'Hot Vacancy', price:'₹1650', features:['Top placement','Featured logo','Priority support','Advanced analytics','Social promotion','Email notifications','App visibility','Unlimited applications'], c:'border-orange-500', text:'text-orange-600', badge:'Most visible' },
              { name:'Classified', price:'₹850', features:['Enhanced placement','Logo display','Email notifications','Basic analytics','App visibility','Unlimited applications','Std. support'], c:'border-blue-500', text:'text-blue-600', badge:'Popular' },
              { name:'Standard', price:'₹400', features:['Standard placement','Basic listing','Email notifications','Unlimited applications','Std. support'], c:'border-green-500', text:'text-green-600', badge:'Value' },
              { name:'Free', price:'₹0', features:['Job post','1 location','Up to 20 skills','Email notifications','Basic analytics'], c:'border-slate-300', text:'text-slate-700', badge:'Try now' },
            ].map((p) => (
              <div key={p.name} className={`rounded-2xl border ${p.c} bg-white p-5 shadow-sm`}>
                <div className="flex items-center justify-between mb-2">
                  <h3 className={`text-lg font-semibold ${p.text}`}>{p.name}</h3>
                  <span className="text-xs bg-slate-100 px-2 py-1 rounded-full text-slate-600">{p.badge}</span>
                </div>
                <div className="text-2xl font-bold mb-4">{p.price}</div>
                <ul className="space-y-2 text-sm text-slate-600 mb-5">
                  {p.features.map(f => (
                    <li key={f} className="flex items-center"><Check className="w-4 h-4 text-emerald-600 mr-2" />{f}</li>
                  ))}
                </ul>
                <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white">Buy now</Button>
              </div>
            ))}
          </div>
        </section>

        {/* Resume Database (Resdex-like) */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-slate-900">Search India’s largest resume database</h2>
            <p className="text-slate-600">by location, industry, skills, and more to find the right fit</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {[{name:'Resdex Lite', price:'₹4,000', desc:'Best for small and medium businesses with minimal hiring needs'}, {name:'Resdex', price:'Custom price', desc:'Designed for your bigger hiring needs'}].map(card => (
              <div key={card.name} className="rounded-2xl border border-slate-200 bg-white p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-1">{card.name}</h3>
                <p className="text-sm text-slate-600 mb-4">{card.desc}</p>
                <div className="text-3xl font-bold text-slate-900 mb-4">{card.price}</div>
                <ul className="space-y-2 text-sm text-slate-600 mb-6">
                  {['NOCV download per month','Access to 50M+ profiles','Targeted search (role, location, experience)'].map((f,i) => (
                    <li key={i} className="flex items-center"><Check className="w-4 h-4 text-emerald-600 mr-2" />{f}</li>
                  ))}
                </ul>
                <div className="flex gap-3">
                  <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">{card.name === 'Resdex' ? 'Contact sales' : 'Buy now'}</Button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Assisted Hiring */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-slate-900">Get our expert assistance</h2>
            <p className="text-slate-600">to source, screen, and handpick candidates for your business</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {[{name:'Assisted Hiring for Job Posting', price:'₹4,000'}, {name:'Assisted Hiring for Resume Database', price:'₹5,000'}].map(c => (
              <div key={c.name} className="rounded-2xl border border-slate-200 bg-white p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-2">{c.name}</h3>
                <div className="text-3xl font-bold text-slate-900 mb-4">{c.price}</div>
                <ul className="space-y-2 text-sm text-slate-600 mb-6">
                  {['Get shortlisted candidates with high intent','1:1 recruitment support by our hiring experts','Custom screening as per your JD'].map((f,i) => (
                    <li key={i} className="flex items-center"><Check className="w-4 h-4 text-emerald-600 mr-2" />{f}</li>
                  ))}
                </ul>
                <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">How it works</Button>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  type Period,
  loadPeriods,
  savePeriods,
  grossProfit,
  netProfit,
  grossMargin,
  netMargin,
} from '@/lib/store'

const aud = (n: number) =>
  (n < 0 ? '-$' : '$') +
  Math.abs(n).toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const pct = (n: number) => `${n.toFixed(1)}%`

const profitColor = (n: number) =>
  n > 0 ? 'text-emerald-400' : n < 0 ? 'text-red-400' : 'text-zinc-400'

export default function Dashboard() {
  const [periods, setPeriods] = useState<Period[]>([])
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    const sorted = loadPeriods().sort((a, b) => a.startDate.localeCompare(b.startDate))
    setPeriods(sorted)
    setHydrated(true)
  }, [])

  function deletePeriod(id: string) {
    if (!window.confirm('Delete this period?')) return
    const next = periods.filter((p) => p.id !== id)
    setPeriods(next)
    savePeriods(next)
  }

  const totalRevenue = periods.reduce((s, p) => s + p.revenue, 0)
  const totalUnits = periods.reduce((s, p) => s + p.orderCount, 0)
  const totalNewCustomers = periods.reduce((s, p) => s + p.newCustomers, 0)
  const totalGross = periods.reduce((s, p) => s + grossProfit(p), 0)
  const totalNet = periods.reduce((s, p) => s + netProfit(p), 0)
  const totalGM = totalRevenue > 0 ? (totalGross / totalRevenue) * 100 : 0
  const totalNM = totalRevenue > 0 ? (totalNet / totalRevenue) * 100 : 0

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
        <h1 className="text-base font-semibold tracking-tight">DEVOTED — P&amp;L Dashboard</h1>
        <Link
          href="/entry"
          className="rounded-md bg-white px-4 py-2 text-sm font-medium text-black hover:bg-zinc-200 transition-colors"
        >
          + Add Period
        </Link>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8 space-y-8">
        {/* Summary cards */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          <MetricCard label="Total Revenue" value={aud(totalRevenue)} />
          <MetricCard label="Units Sold" value={totalUnits.toLocaleString()} />
          <MetricCard label="New Customers" value={totalNewCustomers.toLocaleString()} />
          <MetricCard label="Gross Profit" value={aud(totalGross)} valueClass={profitColor(totalGross)} sub={pct(totalGM)} />
          <MetricCard label="Net Profit" value={aud(totalNet)} valueClass={profitColor(totalNet)} sub={pct(totalNM)} />
        </div>

        {/* Periods table */}
        {!hydrated ? null : periods.length === 0 ? (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 px-8 py-20 text-center">
            <p className="text-zinc-500 text-sm">No data yet.</p>
            <Link
              href="/entry"
              className="mt-3 inline-block text-sm text-white underline underline-offset-4"
            >
              Add your first period →
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-zinc-800">
            <table className="w-full text-sm">
              <thead className="bg-zinc-900 text-zinc-500 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Period</th>
                  <th className="px-4 py-3 text-right font-medium">Revenue</th>
                  <th className="px-4 py-3 text-right font-medium">Units Sold</th>
                  <th className="px-4 py-3 text-right font-medium">New Cust.</th>
                  <th className="px-4 py-3 text-right font-medium">COGS</th>
                  <th className="px-4 py-3 text-right font-medium">Mktg</th>
                  <th className="px-4 py-3 text-right font-medium">Other</th>
                  <th className="px-4 py-3 text-right font-medium">Gross Profit</th>
                  <th className="px-4 py-3 text-right font-medium">GM%</th>
                  <th className="px-4 py-3 text-right font-medium">Net Profit</th>
                  <th className="px-4 py-3 text-right font-medium">NM%</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800 bg-zinc-950">
                {periods.map((p) => {
                  const gp = grossProfit(p)
                  const np = netProfit(p)
                  return (
                    <tr key={p.id} className="hover:bg-zinc-900/60 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-medium text-zinc-100">
                          {p.label || `${p.startDate} – ${p.endDate}`}
                        </div>
                        {p.label && (
                          <div className="text-xs text-zinc-500 mt-0.5">
                            {p.startDate} – {p.endDate}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-zinc-100">{aud(p.revenue)}</td>
                      <td className="px-4 py-3 text-right font-mono text-zinc-300">{p.orderCount}</td>
                      <td className="px-4 py-3 text-right font-mono text-zinc-300">{p.newCustomers}</td>
                      <td className="px-4 py-3 text-right font-mono text-zinc-400">{p.cogs > 0 ? aud(p.cogs) : '—'}</td>
                      <td className="px-4 py-3 text-right font-mono text-zinc-400">{p.marketingSpend > 0 ? aud(p.marketingSpend) : '—'}</td>
                      <td className="px-4 py-3 text-right font-mono text-zinc-400">{p.otherExpenses > 0 ? aud(p.otherExpenses) : '—'}</td>
                      <td className={`px-4 py-3 text-right font-mono ${profitColor(gp)}`}>{aud(gp)}</td>
                      <td className={`px-4 py-3 text-right font-mono ${profitColor(gp)}`}>{pct(grossMargin(p))}</td>
                      <td className={`px-4 py-3 text-right font-mono ${profitColor(np)}`}>{aud(np)}</td>
                      <td className={`px-4 py-3 text-right font-mono ${profitColor(np)}`}>{pct(netMargin(p))}</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => deletePeriod(p.id)}
                          className="text-zinc-700 hover:text-red-400 text-xs transition-colors"
                        >
                          delete
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              {periods.length > 1 && (
                <tfoot className="bg-zinc-900 border-t border-zinc-700 text-sm font-semibold">
                  <tr>
                    <td className="px-4 py-3 text-zinc-300">Totals</td>
                    <td className="px-4 py-3 text-right font-mono text-zinc-100">{aud(totalRevenue)}</td>
                    <td className="px-4 py-3 text-right font-mono text-zinc-300">{totalUnits}</td>
                    <td className="px-4 py-3 text-right font-mono text-zinc-300">{totalNewCustomers}</td>
                    <td className="px-4 py-3 text-right font-mono text-zinc-400">
                      {aud(periods.reduce((s, p) => s + p.cogs, 0))}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-zinc-400">
                      {aud(periods.reduce((s, p) => s + p.marketingSpend, 0))}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-zinc-400">
                      {aud(periods.reduce((s, p) => s + p.otherExpenses, 0))}
                    </td>
                    <td className={`px-4 py-3 text-right font-mono ${profitColor(totalGross)}`}>{aud(totalGross)}</td>
                    <td className={`px-4 py-3 text-right font-mono ${profitColor(totalGross)}`}>{pct(totalGM)}</td>
                    <td className={`px-4 py-3 text-right font-mono ${profitColor(totalNet)}`}>{aud(totalNet)}</td>
                    <td className={`px-4 py-3 text-right font-mono ${profitColor(totalNet)}`}>{pct(totalNM)}</td>
                    <td />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}
      </main>
    </div>
  )
}

function MetricCard({
  label,
  value,
  valueClass = 'text-white',
  sub,
}: {
  label: string
  value: string
  valueClass?: string
  sub?: string
}) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 px-5 py-4">
      <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">{label}</p>
      <p className={`text-xl font-semibold font-mono leading-tight ${valueClass}`}>{value}</p>
      {sub && <p className={`text-xs mt-1 font-mono ${valueClass} opacity-70`}>{sub}</p>}
    </div>
  )
}

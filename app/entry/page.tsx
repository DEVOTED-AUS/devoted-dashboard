'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { type Period, loadPeriods, savePeriods, blankPeriod, grossProfit, netProfit } from '@/lib/store'

const aud = (n: number) =>
  (n < 0 ? '-$' : '$') +
  Math.abs(n).toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const profitColor = (n: number) =>
  n > 0 ? 'text-emerald-400' : n < 0 ? 'text-red-400' : 'text-zinc-500'

export default function EntryPage() {
  const router = useRouter()
  const [form, setForm] = useState<Period>(blankPeriod)
  const [saving, setSaving] = useState(false)

  function setField(field: keyof Period, value: string | number) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function handleNum(field: keyof Period) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setField(field, parseFloat(e.target.value) || 0)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const periods = loadPeriods()
    periods.push({ ...form, id: crypto.randomUUID() })
    savePeriods(periods)
    router.push('/')
  }

  const gp = grossProfit(form)
  const np = netProfit(form)
  const aov = form.orderCount > 0 ? form.revenue / form.orderCount : 0

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="border-b border-zinc-800 px-6 py-4 flex items-center gap-4">
        <Link href="/" className="text-zinc-500 hover:text-zinc-100 text-sm transition-colors">
          ← Back
        </Link>
        <h1 className="text-base font-semibold tracking-tight">Add Period</h1>
      </header>

      <main className="mx-auto max-w-2xl px-6 py-10">
        <form onSubmit={handleSubmit} className="space-y-8">

          {/* Period info */}
          <section className="space-y-4">
            <SectionHeader>Period</SectionHeader>
            <Field label="Label" hint="e.g. Jun 23–29 or Month of May">
              <input
                type="text"
                value={form.label}
                onChange={(e) => setField('label', e.target.value)}
                placeholder="Week 26 — Jun 23–29"
                className={inputCls}
              />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Start date">
                <input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => setField('startDate', e.target.value)}
                  className={inputCls}
                />
              </Field>
              <Field label="End date">
                <input
                  type="date"
                  value={form.endDate}
                  onChange={(e) => setField('endDate', e.target.value)}
                  className={inputCls}
                />
              </Field>
            </div>
          </section>

          {/* Revenue — from Shopify Admin */}
          <section className="space-y-4">
            <SectionHeader hint="from Shopify Admin → Analytics → Reports">Revenue</SectionHeader>
            <Field label="Total Sales (AUD)" hint="Shopify Total Sales — includes shipping & taxes">
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.revenue || ''}
                onChange={handleNum('revenue')}
                placeholder="0.00"
                className={inputCls}
              />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Order count">
                <input
                  type="number"
                  step="1"
                  min="0"
                  value={form.orderCount || ''}
                  onChange={handleNum('orderCount')}
                  placeholder="0"
                  className={inputCls}
                />
              </Field>
              <Field label="New customers">
                <input
                  type="number"
                  step="1"
                  min="0"
                  value={form.newCustomers || ''}
                  onChange={handleNum('newCustomers')}
                  placeholder="0"
                  className={inputCls}
                />
              </Field>
            </div>
          </section>

          {/* Costs */}
          <section className="space-y-4">
            <SectionHeader hint="optional — leave blank to track revenue-only">Costs</SectionHeader>
            <Field label="COGS — Cost of Goods Sold (AUD)">
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.cogs || ''}
                onChange={handleNum('cogs')}
                placeholder="0.00"
                className={inputCls}
              />
            </Field>
            <Field label="Marketing Spend (AUD)">
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.marketingSpend || ''}
                onChange={handleNum('marketingSpend')}
                placeholder="0.00"
                className={inputCls}
              />
            </Field>
            <Field label="Other Expenses (AUD)">
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.otherExpenses || ''}
                onChange={handleNum('otherExpenses')}
                placeholder="0.00"
                className={inputCls}
              />
            </Field>
          </section>

          {/* Live preview */}
          {form.revenue > 0 && (
            <section className="rounded-xl border border-zinc-800 bg-zinc-900 px-5 py-4 space-y-2 text-sm">
              <p className="text-xs text-zinc-500 uppercase tracking-wider mb-3">Preview</p>
              <Row label="Revenue" value={aud(form.revenue)} />
              <Row label="Avg Order Value" value={aov > 0 ? aud(aov) : '—'} />
              {form.cogs > 0 && <Row label="COGS" value={`− ${aud(form.cogs)}`} dimmed />}
              {(form.cogs > 0 || form.revenue > 0) && (
                <Row label="Gross Profit" value={aud(gp)} valueClass={profitColor(gp)} bold />
              )}
              {form.marketingSpend > 0 && <Row label="Marketing" value={`− ${aud(form.marketingSpend)}`} dimmed />}
              {form.otherExpenses > 0 && <Row label="Other Expenses" value={`− ${aud(form.otherExpenses)}`} dimmed />}
              {(form.cogs > 0 || form.marketingSpend > 0 || form.otherExpenses > 0) && (
                <Row label="Net Profit" value={aud(np)} valueClass={profitColor(np)} bold />
              )}
            </section>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-lg bg-white py-3 text-sm font-semibold text-black hover:bg-zinc-200 transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save Period'}
          </button>
        </form>
      </main>
    </div>
  )
}

const inputCls =
  'w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600 font-mono'

function SectionHeader({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <div className="flex items-baseline gap-2">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">{children}</h2>
      {hint && <span className="text-xs text-zinc-600">{hint}</span>}
    </div>
  )
}

function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-zinc-300">
        {label}
        {hint && <span className="ml-1.5 text-xs text-zinc-500 font-normal">{hint}</span>}
      </label>
      {children}
    </div>
  )
}

function Row({
  label,
  value,
  valueClass = 'text-zinc-200',
  dimmed,
  bold,
}: {
  label: string
  value: string
  valueClass?: string
  dimmed?: boolean
  bold?: boolean
}) {
  return (
    <div className={`flex justify-between ${bold ? 'border-t border-zinc-800 pt-2 mt-1' : ''}`}>
      <span className={dimmed ? 'text-zinc-500' : 'text-zinc-400'}>{label}</span>
      <span className={`font-mono ${bold ? 'font-semibold' : ''} ${valueClass}`}>{value}</span>
    </div>
  )
}

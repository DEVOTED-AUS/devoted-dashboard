export type Period = {
  id: string
  label: string
  startDate: string
  endDate: string
  revenue: number
  orderCount: number
  newCustomers: number
  cogs: number
  marketingSpend: number
  otherExpenses: number
}

const KEY = 'devoted_pl_periods'

export function loadPeriods(): Period[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as Period[]) : []
  } catch {
    return []
  }
}

export function savePeriods(periods: Period[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(KEY, JSON.stringify(periods))
}

export function blankPeriod(): Period {
  return {
    id: '',
    label: '',
    startDate: '',
    endDate: '',
    revenue: 0,
    orderCount: 0,
    newCustomers: 0,
    cogs: 0,
    marketingSpend: 0,
    otherExpenses: 0,
  }
}

export const grossProfit = (p: Period) => p.revenue - p.cogs
export const netProfit = (p: Period) => p.revenue - p.cogs - p.marketingSpend - p.otherExpenses
export const grossMargin = (p: Period) => (p.revenue === 0 ? 0 : (grossProfit(p) / p.revenue) * 100)
export const netMargin = (p: Period) => (p.revenue === 0 ? 0 : (netProfit(p) / p.revenue) * 100)
